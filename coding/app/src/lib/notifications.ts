/**
 * Local notification service.
 *
 * Only LOCAL notifications — no push, no server, no Expo project ID required.
 *
 * Expo Go quirk: in SDK 53+, the entire `expo-notifications` module refuses
 * to load on Android Expo Go (even for local notifications — the error message
 * misleadingly says "push notifications"). To keep the app bootable in Expo Go
 * for dev, we lazy-require the module and gracefully no-op every function
 * when it can't be loaded. In a real development build or production build,
 * everything just works.
 *
 * What we schedule when notifications are available:
 *   1. Daily weigh-in reminder at `reminder_weight_time` (e.g. 08:00)
 *   2. Daily meal-log nudge at 13:00, if `reminder_meal_nudges` is on
 *
 * Both notifications are scheduled per-day repeating. We `cancelAllScheduled`
 * before re-scheduling so changes from Settings take effect immediately.
 *
 * Permission strategy:
 *   - Don't ask on first app launch (feels demanding)
 *   - Ask once, right after onboarding completes — natural moment of intent
 *   - If denied OR unavailable, schedule calls silently no-op; settings shows
 *     a "Blocked" state with a CTA to open OS settings
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Stable identifiers so we can update / cancel specific schedules without
// touching unrelated future feature notifications.
const ID_WEIGH_IN = 'weigh-in-daily';
const ID_MEAL_NUDGE = 'meal-nudge-daily';
const ANDROID_CHANNEL_ID = 'reminders';

/**
 * Detect whether we're running inside Expo Go on Android, where the
 * `expo-notifications` module fails to load entirely. In that case all our
 * functions become no-ops so the app still boots cleanly during development.
 */
const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.appOwnership === 'expo';

/* eslint-disable @typescript-eslint/no-explicit-any */
let Notifications: any = null;
if (!isExpoGoAndroid) {
  try {
    // Dynamic require so the import failure doesn't crash the entire bundle.
    // Real builds (dev or prod) reach this branch and get the real module.
    Notifications = require('expo-notifications');
  } catch (err) {
    // If anything goes wrong loading the native module, fall back to no-op.
    // eslint-disable-next-line no-console
    console.warn('[notifications] expo-notifications unavailable — running in no-op mode', err);
    Notifications = null;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const isAvailable = Notifications !== null;

// Foreground behavior — show the alert + play sound even if the app is open,
// so the user sees their reminder land rather than missing it because they
// happen to be in another screen.
if (isAvailable) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Set up the Android notification channel. Required for Android 8+ — without
 * a channel, notifications silently fail to display.
 */
async function ensureAndroidChannel(): Promise<void> {
  if (!isAvailable || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'Daily reminders',
    description: 'Weigh-in time and meal-log nudges.',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    vibrationPattern: [0, 200, 200, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

/**
 * Get current permission status without prompting. Use this to display state
 * in Settings or decide whether to show a "request permission" CTA.
 *
 * Returns 'unavailable' if running in Expo Go on Android — the UI can use
 * this to show a "notifications need a dev build" hint instead of the usual
 * Allow / Open settings CTAs.
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (!isAvailable) return 'unavailable';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

/**
 * Prompt the user for notification permission. Safe to call when status is
 * already determined — it just returns the existing answer. Always sets up
 * the Android channel before prompting so the OS shows the right details.
 */
export async function requestPermission(): Promise<PermissionStatus> {
  if (!isAvailable) return 'unavailable';
  await ensureAndroidChannel();
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return 'granted';

  // On iOS this triggers the system dialog. On Android 13+ it also triggers
  // a runtime POST_NOTIFICATIONS prompt; on older Android it's a no-op.
  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  if (result.status === 'granted') return 'granted';
  return 'denied';
}

/**
 * Parse an "HH:MM" string into { hour, minute }. Falls back to 08:00 on bad
 * input rather than throwing — the user's saved preference shouldn't be able
 * to crash the scheduler.
 */
function parseHHMM(timeStr: string | null | undefined): { hour: number; minute: number } {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return { hour: 8, minute: 0 };
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return { hour: 8, minute: 0 };
  }
  return { hour: h, minute: m };
}

interface ReminderSettings {
  /** "HH:MM" — when to fire the daily weigh-in notification. */
  reminder_weight_time?: string | null;
  /** Whether to fire the daily meal-log nudge at 13:00. */
  reminder_meal_nudges?: boolean | null;
}

/**
 * Apply the user's reminder preferences. Cancels any previous schedules and
 * re-creates them so changes take effect immediately. Safe to call any time —
 * we always normalize against fresh user state, never delta-apply.
 *
 * Silently no-ops if:
 *   - We're in Expo Go on Android (module isn't loaded)
 *   - Permission isn't granted (caller should request first)
 */
export async function applyReminders(settings: ReminderSettings): Promise<void> {
  if (!isAvailable) return;
  const perm = await getPermissionStatus();
  if (perm !== 'granted') return;
  await ensureAndroidChannel();

  // Clear our managed schedules. We use explicit IDs so we don't accidentally
  // wipe future feature notifications scheduled by other parts of the app.
  await Notifications.cancelScheduledNotificationAsync(ID_WEIGH_IN).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ID_MEAL_NUDGE).catch(() => {});

  // 1. Daily weigh-in reminder at the configured time.
  const { hour, minute } = parseHHMM(settings.reminder_weight_time);
  await Notifications.scheduleNotificationAsync({
    identifier: ID_WEIGH_IN,
    content: {
      title: 'Morning weigh-in',
      body: 'Quick step on the scale — takes 10 seconds.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  // 2. Daily meal-log nudge at 13:00 — only if the user opted in.
  if (settings.reminder_meal_nudges) {
    await Notifications.scheduleNotificationAsync({
      identifier: ID_MEAL_NUDGE,
      content: {
        title: 'How is your protein day going?',
        body: 'Logging meals keeps the ring full. Snap or quick-add now.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 13,
        minute: 0,
        channelId: ANDROID_CHANNEL_ID,
      },
    });
  }
}

/**
 * Hard cancel everything we scheduled. Use on sign-out so a new user logging
 * in on the same device doesn't inherit the previous user's reminders.
 */
export async function cancelAllReminders(): Promise<void> {
  if (!isAvailable) return;
  await Notifications.cancelScheduledNotificationAsync(ID_WEIGH_IN).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ID_MEAL_NUDGE).catch(() => {});
}
