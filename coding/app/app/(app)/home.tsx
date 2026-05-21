/**
 * Real home dashboard. Phase 1.2.
 * Protein ring (primary) + today's meal list + Snap button.
 * The Snap button is a placeholder until Phase 1.3 wires the camera flow.
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { colors, typography, spacing, radius } from '../../src/theme';
import { useAuthStore } from '../../src/state/auth';
import { api, API_URL } from '../../src/lib/api';
import { toast } from '../../src/state/toast';
import { ProteinRing } from '../../src/components/ProteinRing';
import { MealCard } from '../../src/components/MealCard';
import { RecentChips, type RecentChipItem } from '../../src/components/RecentChips';
import { ConfirmSheet } from '../../src/components/ConfirmSheet';
import { LogoMark } from '../../src/components/LogoMark';
import { WeighInSheet } from '../../src/components/WeighInSheet';
import { cancelAllReminders } from '../../src/lib/notifications';

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);
  const qc = useQueryClient();

  const proteinTargetG = user?.protein_target_g ?? 120;

  // Refresh the cached user every time Home gets focus — picks up new profile
  // fields after they're edited in Settings, and migrates older accounts that
  // were cached before first_name / last_name were collected at signup.
  // `api.me()` returns the unwrapped User payload directly (no .data wrapper).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const fresh = await api.me();
          if (!cancelled && fresh) {
            await setUser(fresh);
          }
        } catch {
          // Silent — user can pull to refresh if profile data looks stale.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [setUser]),
  );

  // GET /v1/meals (today by default)
  const today = useQuery({
    queryKey: ['meals', 'today'],
    queryFn: () => api.listMeals(),
    staleTime: 30_000,
  });

  // GET /v1/meals/recent — last 10 unique meal names for the Quick Add row
  const recents = useQuery({
    queryKey: ['meals', 'recent'],
    queryFn: () => api.recentMeals(),
    staleTime: 60_000,
  });

  const deleteMeal = useMutation({
    mutationFn: (id: string) => api.deleteMeal(id),
    onSuccess: (result) => {
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ['meals'] });
    },
  });

  // Quick add — re-log a previously eaten meal with source: 'quick_add'.
  // Track which item is currently being saved so the chip can show a spinner
  // (matters when network is slow and the user might tap a second chip).
  const [pendingQuickAddId, setPendingQuickAddId] = useState<string | null>(null);
  const quickAdd = useMutation({
    mutationFn: (item: RecentChipItem) =>
      api.saveMeal({
        meal_name: item.meal_name,
        protein_g: item.protein_g,
        ...(item.calories != null ? { calories: item.calories } : {}),
        ...(item.carbs_g != null ? { carbs_g: item.carbs_g } : {}),
        ...(item.fat_g != null ? { fat_g: item.fat_g } : {}),
        ...(item.estimated_portion ? { estimated_portion: item.estimated_portion } : {}),
        source: 'quick_add',
      }),
    onMutate: (item) => setPendingQuickAddId(item.id),
    onSuccess: (_result, item) => {
      toast.success(`Logged ${item.meal_name} · +${Math.round(item.protein_g)}g protein`);
      qc.invalidateQueries({ queryKey: ['meals'] });
    },
    onError: () => toast.error('Could not log. Try again.'),
    onSettled: () => setPendingQuickAddId(null),
  });

  const onRefresh = useCallback(() => {
    today.refetch();
  }, [today]);

  // MealCard now shows its own branded ConfirmSheet for the ⋯ → Delete flow,
  // so this just runs the deletion directly. (No second native alert.)
  function handleDelete(mealId: string) {
    deleteMeal.mutate(mealId);
  }

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [weighInOpen, setWeighInOpen] = useState(false);

  function handleSignOut() {
    setSignOutOpen(true);
  }
  async function performSignOut() {
    setSigningOut(true);
    try {
      if (refreshToken) {
        try {
          await api.logout({ refresh_token: refreshToken });
        } catch {
          /* ignore */
        }
      }
      // Cancel scheduled notifications so the next user logging in on this
      // device doesn't inherit the previous user's reminders.
      await cancelAllReminders().catch(() => {});
      // Wipe any cached queries (profile, meals, etc.) so the next user's
      // data is fetched fresh instead of reading the previous user's cache.
      qc.clear();
      await clear();
    } finally {
      setSigningOut(false);
      setSignOutOpen(false);
    }
  }
  function handleSnap() {
    router.push('/(app)/scan');
  }

  const totals = today.data?.totals ?? { protein_g: 0, calories: 0, carbs_g: 0, fat_g: 0 };
  const meals = today.data?.meals ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <LogoMark size={22} />
          <Text style={styles.brand}>LeanScan</Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.creditPill}>
            <Text style={styles.creditPillText}>{user?.credit_balance ?? 0} credits</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/history')}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Feather name="calendar" size={20} color={colors.forest} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Feather name="settings" size={20} color={colors.forest} />
          </Pressable>
          <Pressable onPress={handleSignOut} hitSlop={8} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={today.isRefetching}
            onRefresh={onRefresh}
            tintColor={colors.forest}
          />
        }
      >
        <View style={styles.heroSection}>
          {goalEyebrow(user?.goal) ? (
            <Text style={styles.goalEyebrow}>{goalEyebrow(user?.goal)}</Text>
          ) : null}
          <Text style={styles.greeting}>
            {greeting()}, {displayName(user)}.
          </Text>
          <Text style={styles.greetingSub}>
            {greetingSubtitle(user?.goal, meals.length)}
          </Text>
        </View>

        {isGlp1User(user?.medication) ? (
          <View style={styles.medBanner}>
            <Feather name="shield" size={14} color={colors.forest} />
            <Text style={styles.medBannerText}>
              {prettyMedication(user?.medication)} · protein target tuned for muscle protection
            </Text>
          </View>
        ) : null}

        {today.isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (
          <ProteinRing
            proteinG={totals.protein_g}
            proteinTargetG={proteinTargetG}
            calories={totals.calories}
          />
        )}

        <View style={styles.macroRow}>
          <MacroPill label="Carbs" value={`${Math.round(totals.carbs_g)}g`} />
          <MacroPill label="Fat" value={`${Math.round(totals.fat_g)}g`} />
        </View>

        {user?.calorie_target_kcal != null ? (
          <CalorieStrip
            consumed={Math.round(totals.calories)}
            target={user.calorie_target_kcal}
            tdee={user.tdee_kcal ?? null}
          />
        ) : null}

        {user?.weight_kg != null && user?.goal_weight_kg != null && user.goal_weight_kg !== user.weight_kg ? (
          <WeightStrip
            currentKg={user.weight_kg}
            goalKg={user.goal_weight_kg}
            onTapWeighIn={() => setWeighInOpen(true)}
          />
        ) : user?.weight_kg != null ? (
          // No goal weight set — still expose a "Weigh in" CTA so the user can
          // update their weight directly from home without going to Settings.
          <Pressable onPress={() => setWeighInOpen(true)} style={styles.weightCtaInline}>
            <Feather name="activity" size={14} color={colors.muted} />
            <Text style={styles.weightCtaText}>Last weight: {user.weight_kg} kg · tap to update</Text>
          </Pressable>
        ) : null}

        <RecentChips
          items={recents.data?.items ?? []}
          loading={recents.isLoading}
          pendingId={pendingQuickAddId}
          onPress={(item) => quickAdd.mutate(item)}
          onAddManual={() => router.push('/(app)/manual')}
        />

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Today</Text>
          {today.isFetching && !today.isRefetching && (
            <ActivityIndicator size="small" color={colors.muted} />
          )}
        </View>

        {meals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nothing logged yet</Text>
            <Text style={styles.emptyBody}>
              Snap a photo or enter your first meal manually.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {meals.map((m) => (
              <MealCard
                key={m.id}
                meal={m}
                photoUrl={
                  m.photo_path && accessToken
                    ? `${API_URL}/v1/meals/${m.id}/photo?token=${encodeURIComponent(accessToken)}`
                    : undefined
                }
                onPress={() => router.push(`/(app)/meal/${m.id}`)}
                onDelete={() => handleDelete(m.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Single hero CTA — Snap. Manual entry now lives in the Quick Add row. */}
      <View style={styles.fab}>
        <Pressable
          onPress={handleSnap}
          style={({ pressed }) => [styles.snapBtn, pressed && styles.snapBtnPressed]}
        >
          <Feather name="camera" size={20} color={colors.forestDeep} />
          <Text style={styles.snapBtnText}>Snap</Text>
        </Pressable>
      </View>

      <ConfirmSheet
        visible={signOutOpen}
        title="Sign out?"
        body="You can sign back in any time."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
        onConfirm={performSignOut}
        onCancel={() => setSignOutOpen(false)}
      />

      <WeighInSheet
        visible={weighInOpen}
        initialKg={user?.weight_kg ?? null}
        onClose={() => setWeighInOpen(false)}
      />
    </SafeAreaView>
  );
}

/**
 * Calorie progress strip — shows consumed / target with the TDEE-relative
 * framing ("X under maintenance" / "X over maintenance"). Replaces the bare
 * kcal number that used to live inside the protein ring.
 */
function CalorieStrip({
  consumed,
  target,
  tdee,
}: {
  consumed: number;
  target: number;
  tdee: number | null;
}) {
  const remaining = Math.max(0, target - consumed);
  const overBy = Math.max(0, consumed - target);
  const tdeeDelta = tdee != null ? consumed - tdee : null;

  // Primary headline: "consumed / target kcal"
  // Secondary: "X left" or "X over"; plus a "Y under maintenance" anchor
  const primary = `${consumed} / ${target} kcal`;
  const secondaryParts: string[] = [];
  if (overBy > 0) {
    secondaryParts.push(`${overBy} over target`);
  } else {
    secondaryParts.push(`${remaining} left`);
  }
  if (tdeeDelta !== null) {
    const abs = Math.abs(Math.round(tdeeDelta));
    if (tdeeDelta < 0) secondaryParts.push(`${abs} under maintenance`);
    else if (tdeeDelta > 0) secondaryParts.push(`${abs} over maintenance`);
    else secondaryParts.push('at maintenance');
  }

  const pct = Math.max(0, Math.min(1, consumed / target));

  return (
    <View style={styles.calStrip}>
      <View style={styles.calBarTrack}>
        <View style={[styles.calBarFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.calTextRow}>
        <Text style={styles.calPrimary}>{primary}</Text>
        <Text style={styles.calSecondary}>{secondaryParts.join(' · ')}</Text>
      </View>
    </View>
  );
}

/**
 * Weight progress strip — shows current vs goal weight with the directional
 * delta ("X kg to go" or "X kg over goal" or "At goal"). Tap to open the
 * WeighInSheet for a fast update without bouncing to Settings.
 *
 * v1 limitation: this shows static delta, not historical progress. Adding a
 * starting_weight_kg field or a WeighIn history table would let us show
 * "60% of the way to your goal" — that's Tier 3 work.
 */
function WeightStrip({
  currentKg,
  goalKg,
  onTapWeighIn,
}: {
  currentKg: number;
  goalKg: number;
  onTapWeighIn: () => void;
}) {
  const delta = currentKg - goalKg;
  const absDelta = Math.abs(delta).toFixed(1);
  // Friendly tagline keyed off direction:
  //   delta > 0 = above goal (typical cutter case)
  //   delta < 0 = below goal (overshoot or building toward goal weight)
  //   delta ≈ 0 = at goal
  const atGoal = Math.abs(delta) < 0.1;
  const tagline = atGoal
    ? 'At goal'
    : delta > 0
      ? `${absDelta} kg to goal`
      : `${absDelta} kg below goal`;

  return (
    <Pressable
      onPress={onTapWeighIn}
      style={({ pressed }) => [styles.weightStrip, pressed && styles.weightStripPressed]}
    >
      <View style={styles.weightLeft}>
        <Text style={styles.weightLabel}>Weight</Text>
        <Text style={styles.weightMain}>
          {currentKg} <Text style={styles.weightArrow}>→</Text> {goalKg} kg
        </Text>
      </View>
      <View style={styles.weightRight}>
        <Text style={styles.weightDelta}>{tagline}</Text>
        <Text style={styles.weightTap}>Tap to weigh in</Text>
      </View>
    </Pressable>
  );
}

function MacroPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroPill}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Goal-keyed eyebrow shown above the greeting. Honors the goal selection from
 * onboarding so the home doesn't feel generic. Returns null when no goal is
 * set so the layout collapses cleanly.
 */
function goalEyebrow(goal: string | null | undefined): string | null {
  switch (goal) {
    case 'lose': return 'CUTTING';
    case 'build': return 'BUILDING';
    case 'recomp': return 'RECOMPING';
    case 'maintain': return 'MAINTAINING';
    default: return null;
  }
}

/**
 * Goal-keyed greeting subtitle that swaps the meals-counter for a tone-of-voice
 * line that matches the user's goal. Falls back to neutral copy when no goal
 * is set.
 */
function greetingSubtitle(goal: string | null | undefined, mealCount: number): string {
  if (mealCount === 0) {
    switch (goal) {
      case 'lose':     return "On a cut. Let's log your first meal — protein keeps you full.";
      case 'build':    return "Building. Let's log your first meal — eat above maintenance.";
      case 'recomp':   return "Recomping. Let's log your first meal — protein first, scale slowly.";
      case 'maintain': return "Steady state. Let's log your first meal of the day.";
      default:         return "Let's log your first meal of the day.";
    }
  }
  return `${mealCount} meal${mealCount === 1 ? '' : 's'} so far.`;
}

/**
 * Greeting name resolution, in order of preference:
 *   1. "First Last" if both set and combined ≤ 16 chars
 *   2. "First" alone if it fits, otherwise "Last" alone
 *   3. Username if set
 *   4. Email local-part as a final fallback
 *   5. "there"
 *
 * The 16-char cap keeps the greeting on a single line on small screens
 * (e.g. "Good morning, Shashank." fits; longer compound names get trimmed).
 */
const GLP1_MEDS = new Set([
  'ozempic',
  'wegovy',
  'mounjaro',
  'zepbound',
  'saxenda',
  'compounded_semaglutide',
  'compounded_tirzepatide',
]);

function isGlp1User(medication?: string | null): boolean {
  return !!medication && GLP1_MEDS.has(medication);
}

function prettyMedication(medication?: string | null): string {
  if (!medication) return '';
  // Map snake_case enum values to nice display names.
  switch (medication) {
    case 'ozempic': return 'Ozempic';
    case 'wegovy': return 'Wegovy';
    case 'mounjaro': return 'Mounjaro';
    case 'zepbound': return 'Zepbound';
    case 'saxenda': return 'Saxenda';
    case 'compounded_semaglutide': return 'Compounded semaglutide';
    case 'compounded_tirzepatide': return 'Compounded tirzepatide';
    default: return medication;
  }
}

const MAX_GREETING_NAME = 16;

function displayName(
  user: { first_name?: string | null; last_name?: string | null; username?: string | null; email?: string } | null | undefined
): string {
  if (!user) return 'there';
  const first = user.first_name?.trim();
  const last = user.last_name?.trim();

  if (first && last) {
    const full = `${first} ${last}`;
    if (full.length <= MAX_GREETING_NAME) return full;
    // Too long for a one-line greeting — fall back to last name alone.
    return last;
  }
  if (first) return first;
  if (last) return last;
  if (user.username) return user.username;
  if (user.email) {
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'there';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  brand: { ...typography.h3, color: colors.forest },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  creditPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.creamDark,
    borderRadius: radius.pill,
  },
  creditPillText: { ...typography.small, color: colors.forest, fontFamily: 'Manrope_600SemiBold' },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.circle,
  },
  signOutBtn: { paddingHorizontal: spacing.xs },
  signOutText: { ...typography.small, color: colors.muted },

  scroll: {
    paddingHorizontal: spacing.lg,
    // FAB is ~56px tall + spacing.xl bottom + safe area. 140 gives meal cards
    // a clean breathing margin so the last card doesn't sit under the Snap pill.
    paddingBottom: 140,
    gap: spacing.lg,
  },
  heroSection: { gap: spacing.xxs, marginTop: spacing.xs },
  goalEyebrow: {
    ...typography.eyebrow,
    color: colors.amber,
    letterSpacing: 1.5,
  },
  greeting: { ...typography.h2, color: colors.forest },
  greetingSub: { ...typography.body, color: colors.muted },

  loadingWrap: { height: 220, alignItems: 'center', justifyContent: 'center' },

  // GLP-1 medication acknowledgment — a small, calm strip under the greeting.
  // Shown only when the user has a GLP-1 set, so it doesn't add noise for
  // non-medicated users.
  medBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.creamDark,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  medBannerText: { ...typography.small, color: colors.forest },


  macroRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  macroPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'baseline',
  },
  macroLabel: { ...typography.eyebrow, color: colors.muted },
  macroValue: { ...typography.bodyMedium, color: colors.charcoal },

  // Calorie progress strip — slim horizontal bar + two-line text caption.
  // Reads protein-first user the same as everyone else: the protein ring stays
  // hero, calories live below as context.
  calStrip: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  calBarTrack: {
    height: 6,
    backgroundColor: colors.creamDark,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  calBarFill: {
    height: '100%',
    backgroundColor: colors.forest,
    borderRadius: radius.pill,
  },
  calTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  calPrimary: { ...typography.bodyMedium, color: colors.forest },
  calSecondary: { ...typography.small, color: colors.muted },

  // Weight strip (when goal weight is set)
  weightStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  weightStripPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  weightLeft: { gap: spacing.xxs },
  weightLabel: { ...typography.eyebrow, color: colors.muted },
  weightMain: { ...typography.bodyMedium, color: colors.forest, fontSize: 16 },
  weightArrow: { color: colors.amber },
  weightRight: { alignItems: 'flex-end', gap: spacing.xxs },
  weightDelta: { ...typography.bodyMedium, color: colors.forest, fontSize: 14 },
  weightTap: { ...typography.small, color: colors.muted, fontSize: 11 },

  // Inline CTA shown when weight is set but no goal weight — gives the user a
  // way to log weight from home without forcing a Settings detour.
  weightCtaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  weightCtaText: { ...typography.small, color: colors.muted },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listTitle: { ...typography.h3, color: colors.forest },

  empty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyTitle: { ...typography.h3, color: colors.forest },
  emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' },

  list: { gap: spacing.xs },

  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: spacing.xs,
  },
  snapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.amber,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    shadowColor: colors.forest,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  snapBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  snapBtnText: { ...typography.button, color: colors.forestDeep, fontSize: 16 },
});
