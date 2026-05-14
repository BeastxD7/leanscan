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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { colors, typography, spacing, radius } from '../../src/theme';
import { useAuthStore } from '../../src/state/auth';
import { api, API_URL } from '../../src/lib/api';
import { toast } from '../../src/state/toast';
import { ProteinRing } from '../../src/components/ProteinRing';
import { MealCard } from '../../src/components/MealCard';
import { RecentChips, type RecentChipItem } from '../../src/components/RecentChips';

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
          // eslint-disable-next-line no-console
          console.log('[home] /auth/me result:', JSON.stringify(fresh));
          if (!cancelled && fresh) {
            await setUser(fresh);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[home] /auth/me failed:', err);
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

  function confirmDelete(mealId: string, mealName: string) {
    Alert.alert(`Delete "${mealName}"?`, 'You can re-log it later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMeal.mutate(mealId),
      },
    ]);
  }

  async function handleSignOut() {
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          if (refreshToken) {
            try {
              await api.logout({ refresh_token: refreshToken });
            } catch {
              /* ignore */
            }
          }
          // Wipe any cached queries (profile, meals, etc.) so the next user's
          // data is fetched fresh instead of reading the previous user's cache.
          qc.clear();
          await clear();
        },
      },
    ]);
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
          <View style={styles.dot} />
          <Text style={styles.brand}>LeanScan</Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.creditPill}>
            <Text style={styles.creditPillText}>{user?.credit_balance ?? 0} credits</Text>
          </View>
          <Pressable
            onPress={() => router.push('/(app)/settings')}
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Text style={styles.iconBtnText}>⚙</Text>
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
          <Text style={styles.greeting}>
            {greeting()}, {displayName(user)}.
          </Text>
          <Text style={styles.greetingSub}>
            {meals.length === 0
              ? "Let's log your first meal of the day."
              : `${meals.length} meal${meals.length === 1 ? '' : 's'} so far.`}
          </Text>
        </View>

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

        <RecentChips
          items={recents.data?.items ?? []}
          loading={recents.isLoading}
          pendingId={pendingQuickAddId}
          onPress={(item) => quickAdd.mutate(item)}
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
                onDelete={() => confirmDelete(m.id, m.meal_name)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fab}>
        <Pressable
          onPress={handleSnap}
          style={({ pressed }) => [styles.snapBtn, pressed && styles.snapBtnPressed]}
        >
          <Text style={styles.snapBtnIcon}>📷</Text>
          <Text style={styles.snapBtnText}>Snap</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/manual')}
          hitSlop={8}
          style={styles.manualLinkWrap}
        >
          <Text style={styles.manualLink}>Or enter manually</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  dot: { width: 10, height: 10, borderRadius: radius.circle, backgroundColor: colors.amber },
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
  iconBtnText: { fontSize: 20, color: colors.forest },
  signOutBtn: { paddingHorizontal: spacing.xs },
  signOutText: { ...typography.small, color: colors.muted },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  heroSection: { gap: spacing.xxs, marginTop: spacing.xs },
  greeting: { ...typography.h2, color: colors.forest },
  greetingSub: { ...typography.body, color: colors.muted },

  loadingWrap: { height: 220, alignItems: 'center', justifyContent: 'center' },

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
  snapBtnIcon: { fontSize: 20 },
  snapBtnText: { ...typography.button, color: colors.forestDeep, fontSize: 16 },
  manualLinkWrap: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  manualLink: { ...typography.bodyMedium, color: colors.forest, textDecorationLine: 'underline' },
});
