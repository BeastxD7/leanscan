/**
 * Settings — edit identity (username, name, DOB, sex) + body + goal + activity.
 * Single scrollable form; "Save" → PATCH /v1/profile.
 *
 * All field names sent to and received from the API are snake_case
 * (via serializeUser on the backend).
 */
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { Input, Button, FormError } from '../../src/components/Input';
import { DatePickerField } from '../../src/components/DatePickerField';
import { colors, typography, spacing, radius } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { useAuthStore } from '../../src/state/auth';
import { toast } from '../../src/state/toast';
import {
  requestPermission,
  getPermissionStatus,
  applyReminders,
  type PermissionStatus,
} from '../../src/lib/notifications';

type GoalT = 'lose' | 'build' | 'recomp' | 'maintain';
type ActivityT = 'sedentary' | 'light' | 'moderate' | 'active';
type SexT = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const GOALS: { value: GoalT; label: string }[] = [
  { value: 'lose', label: 'Lose' },
  { value: 'build', label: 'Build' },
  { value: 'recomp', label: 'Recomp' },
  { value: 'maintain', label: 'Maintain' },
];
const ACTIVITY: { value: ActivityT; label: string }[] = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'light', label: 'Light' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'active', label: 'Active' },
];
const SEX_OPTS: { value: SexT; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

interface ServerProfile {
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  sex?: SexT | null;
  display_name?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal_weight_kg?: number | null;
  goal?: GoalT | null;
  activity_level?: ActivityT | null;
  protein_target_g?: number | null;
  reminder_weight_time?: string | null;
  reminder_meal_nudges?: boolean | null;
}

export default function Settings() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<SexT | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goalWeightKg, setGoalWeightKg] = useState('');
  const [goal, setGoal] = useState<GoalT | null>(null);
  const [activity, setActivity] = useState<ActivityT | null>(null);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [mealNudges, setMealNudges] = useState(true);
  const [permStatus, setPermStatus] = useState<PermissionStatus>('undetermined');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Check notification permission state on mount so we can show the right CTA.
  useEffect(() => {
    let cancelled = false;
    getPermissionStatus().then((s) => {
      if (!cancelled) setPermStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyed by userId so a sign-in to a different account fetches fresh data.
  const profile = useQuery({
    queryKey: ['profile', user?.id ?? 'anon'],
    queryFn: () => api.getProfile() as Promise<ServerProfile>,
    staleTime: 0,
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!profile.data) return;
    const p = profile.data;
    setUsername(p.username ?? '');
    setFirstName(p.first_name ?? '');
    setLastName(p.last_name ?? '');
    setDob(p.date_of_birth ? p.date_of_birth.slice(0, 10) : '');
    setSex((p.sex as SexT) ?? null);
    setDisplayName(p.display_name ?? '');
    setHeightCm(p.height_cm != null ? String(p.height_cm) : '');
    setWeightKg(p.weight_kg != null ? String(p.weight_kg) : '');
    setGoalWeightKg(p.goal_weight_kg != null ? String(p.goal_weight_kg) : '');
    setGoal((p.goal as GoalT) ?? null);
    setActivity((p.activity_level as ActivityT) ?? null);
    setReminderTime(p.reminder_weight_time ?? '08:00');
    setMealNudges(p.reminder_meal_nudges ?? true);
  }, [profile.data]);

  function setErr(key: string, msg: string | undefined) {
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  }

  async function handleSave() {
    setErrors({});
    const payload: Record<string, unknown> = {};

    if (username && (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username))) {
      setErr('username', '3+ chars, letters / numbers / _ / - only.');
      return;
    }
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setErr('dob', 'Format: YYYY-MM-DD.');
      return;
    }

    if (username) payload.username = username;
    if (firstName) payload.first_name = firstName;
    if (lastName) payload.last_name = lastName;
    if (dob) payload.date_of_birth = dob;
    if (sex) payload.sex = sex;
    if (displayName) payload.display_name = displayName;
    if (heightCm) payload.height_cm = Number(heightCm);
    if (weightKg) payload.weight_kg = Number(weightKg);
    if (goalWeightKg) payload.goal_weight_kg = Number(goalWeightKg);
    if (goal) payload.goal = goal;
    if (activity) payload.activity_level = activity;
    // Reminder fields always sent — they have sensible defaults and the user
    // can intentionally change them. Sending always avoids "the toggle didn't
    // save" bugs from skipping when value is false.
    payload.reminder_weight_time = reminderTime;
    payload.reminder_meal_nudges = mealNudges;

    if (Object.keys(payload).length === 0) {
      toast.info('Nothing to save.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.patchProfile(payload);
      toast.success(result.message);
      // Sync the snake_case shape directly into the auth store
      const u = result.data as ServerProfile;
      await patchUser({
        username: u.username ?? null,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        date_of_birth: u.date_of_birth ?? null,
        sex: u.sex ?? null,
        display_name: u.display_name ?? null,
        height_cm: u.height_cm ?? null,
        weight_kg: u.weight_kg ?? null,
        goal_weight_kg: u.goal_weight_kg ?? null,
        goal: u.goal ?? null,
        activity_level: u.activity_level ?? null,
        protein_target_g: u.protein_target_g ?? user?.protein_target_g ?? null,
      });
      // Note: reminder fields aren't in the User type used by auth store yet —
      // they live only in the server profile. That's intentional; the auth store
      // is for identity + display. Reminders are read from the server when needed.
      profile.refetch();

      // Re-apply notification schedules so any changes to time / toggle take
      // effect immediately. Silently no-ops if permission isn't granted.
      try {
        await applyReminders({
          reminder_weight_time: reminderTime,
          reminder_meal_nudges: mealNudges,
        });
      } catch {
        /* best-effort */
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'username_taken') setErr('username', err.message);
        else if (err.code === 'validation_error') toast.error('Please check your inputs.');
        else toast.error(err.message);
      } else {
        toast.error('Could not save settings.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (profile.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.forest} />
          <Text style={styles.close}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <SectionHeader title="Identity" />
          <FormError message={errors.form} />
          <Input
            label="Username"
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              setErr('username', undefined);
            }}
            error={errors.username}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="shashank"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input label="First name" value={firstName} onChangeText={setFirstName} placeholder="Shashank" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Last name" value={lastName} onChangeText={setLastName} placeholder="Devadiga" />
            </View>
          </View>
          <DatePickerField
            label="Date of birth"
            value={dob}
            onChange={(v) => {
              setDob(v);
              setErr('dob', undefined);
            }}
            error={errors.dob}
            placeholder="Tap to pick"
          />
          <SectionHeader title="Sex" />
          <Chips<SexT> options={SEX_OPTS} value={sex} onChange={(v) => setSex(v)} />
          <Input
            label="Display name"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="What we call you in greetings"
          />

          <SectionHeader title="Body" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input
                label="Height (cm)"
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                placeholder="175"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Weight (kg)"
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="80"
              />
            </View>
          </View>
          <Input
            label="Goal weight (kg)"
            value={goalWeightKg}
            onChangeText={setGoalWeightKg}
            keyboardType="decimal-pad"
            placeholder="Optional"
          />

          <SectionHeader title="Goal" />
          <Chips<GoalT> options={GOALS} value={goal} onChange={(v) => setGoal(v)} />

          <SectionHeader title="Activity level" />
          <Chips<ActivityT> options={ACTIVITY} value={activity} onChange={(v) => setActivity(v)} />

          <SectionHeader title="Reminders" />

          {/* Permission status row — only meaningful before grant. After grant
              we hide it; OS settings is the source of truth from then on. */}
          {permStatus !== 'granted' && (
            <View style={styles.permRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.permTitle}>
                  {permStatus === 'denied' ? 'Notifications are blocked' : 'Notifications are off'}
                </Text>
                <Text style={styles.permSub}>
                  {permStatus === 'denied'
                    ? 'Enable them in your phone settings to get reminders.'
                    : 'Allow notifications so we can remind you.'}
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  if (permStatus === 'denied') {
                    Linking.openSettings();
                  } else {
                    const next = await requestPermission();
                    setPermStatus(next);
                    if (next === 'granted') {
                      await applyReminders({
                        reminder_weight_time: reminderTime,
                        reminder_meal_nudges: mealNudges,
                      });
                    }
                  }
                }}
                style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.permBtnText}>
                  {permStatus === 'denied' ? 'Open settings' : 'Allow'}
                </Text>
              </Pressable>
            </View>
          )}

          <Input
            label="Weigh-in reminder (HH:MM)"
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="08:00"
            keyboardType="numbers-and-punctuation"
            autoCapitalize="none"
          />

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Meal-log nudges</Text>
              <Text style={styles.toggleSub}>A gentle nudge at 1 PM if you haven&apos;t logged.</Text>
            </View>
            <Switch
              value={mealNudges}
              onValueChange={setMealNudges}
              trackColor={{ false: colors.line, true: colors.forest }}
              thumbColor={colors.cream}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Save settings" onPress={handleSave} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const sel = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.chip, sel && styles.chipSelected]}
          >
            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  close: { ...typography.bodyMedium, color: colors.forest },
  title: { ...typography.h3, color: colors.forest },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  sectionHeader: { marginTop: spacing.md, marginBottom: spacing.xs },
  sectionTitle: { ...typography.eyebrow, color: colors.amber },
  row2: { flexDirection: 'row', gap: spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
  },
  chipSelected: { backgroundColor: colors.creamDark, borderColor: colors.forest },
  chipText: { ...typography.body, color: colors.charcoal },
  chipTextSelected: { color: colors.forest, fontFamily: 'Manrope_600SemiBold' },

  // Reminders section pieces
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  permTitle: { ...typography.bodyMedium, color: colors.forest },
  permSub: { ...typography.small, color: colors.muted, marginTop: spacing.xxs },
  permBtn: {
    backgroundColor: colors.forest,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  permBtnText: { ...typography.bodyMedium, color: colors.cream, fontSize: 13 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  toggleTitle: { ...typography.bodyMedium, color: colors.charcoal },
  toggleSub: { ...typography.small, color: colors.muted, marginTop: spacing.xxs },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
