/**
 * History — last 14 days at a glance.
 *
 * One card per day: weekday, date, protein total, calorie total, meal count.
 * A small amber dot shows when the day's protein target was hit.
 * Tap a card to expand and see that day's meals inline.
 *
 * Calm-tracker tone, per the strategy doc:
 *   - No streak counters
 *   - No badges or trophies
 *   - No "you broke your streak" copy
 *   - Just observation — "5/7 days hit protein this week"
 */
import { useCallback, useMemo, useState } from 'react';
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
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { colors, typography, spacing, radius, fontFamily } from '../../src/theme';
import { useAuthStore } from '../../src/state/auth';
import { api } from '../../src/lib/api';

const DAYS_TO_SHOW = 14;

function isoDate(d: Date): string {
  // Local-timezone YYYY-MM-DD, matches what the API expects.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getLastNDates(n: number): string[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return isoDate(d);
  });
}

function dayLabel(iso: string): { day: string; date: string } {
  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86_400_000));
  if (iso === today) return { day: 'Today', date: '' };
  if (iso === yesterday) return { day: 'Yesterday', date: '' };
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: d.toLocaleDateString([], { weekday: 'long' }),
    date: d.toLocaleDateString([], { month: 'short', day: 'numeric' }),
  };
}

export default function History() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const proteinTargetG = user?.protein_target_g ?? 0;
  const dates = useMemo(() => getLastNDates(DAYS_TO_SHOW), []);

  const dayQueries = useQueries({
    queries: dates.map((date) => ({
      queryKey: ['meals', date],
      queryFn: () => api.listMeals(date),
      staleTime: 60_000,
    })),
  });

  // Quiet observational stat: "5/7 days hit protein this week" — not a streak.
  const last7DaysHit = useMemo(() => {
    if (proteinTargetG <= 0) return null;
    const first7 = dayQueries.slice(0, 7);
    if (first7.some((q) => q.isLoading)) return null;
    const hit = first7.filter(
      (q) => (q.data?.totals.protein_g ?? 0) >= proteinTargetG,
    ).length;
    return hit;
  }, [dayQueries, proteinTargetG]);

  useFocusEffect(
    useCallback(() => {
      // Re-fetch on focus so meals logged elsewhere show up.
      qc.invalidateQueries({ queryKey: ['meals'] });
    }, [qc]),
  );

  const isInitialLoading = dayQueries.every((q) => q.isLoading);
  const isRefreshing = dayQueries.some((q) => q.isFetching && !q.isLoading);

  function refetchAll() {
    dayQueries.forEach((q) => q.refetch());
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetchAll}
            tintColor={colors.forest}
          />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>LAST 14 DAYS</Text>
          {last7DaysHit !== null && (
            <Text style={styles.observation}>
              {last7DaysHit}/7 days hit your protein target this week
            </Text>
          )}
        </View>

        {isInitialLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (
          dates.map((date, i) => {
            const q = dayQueries[i];
            const data = q.data;
            const label = dayLabel(date);
            const expanded = expandedDate === date;
            const protein = data?.totals.protein_g ?? 0;
            const calories = data?.totals.calories ?? 0;
            const mealCount = data?.meals.length ?? 0;
            const hitTarget = proteinTargetG > 0 && protein >= proteinTargetG;
            const isEmpty = !q.isLoading && mealCount === 0;

            return (
              <Pressable
                key={date}
                style={[styles.dayCard, expanded && styles.dayCardExpanded]}
                onPress={() => setExpandedDate(expanded ? null : date)}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayLabelCol}>
                    <Text style={styles.dayName}>{label.day}</Text>
                    {!!label.date && (
                      <Text style={styles.dayDate}>{label.date}</Text>
                    )}
                  </View>

                  <View style={styles.daySummary}>
                    {q.isLoading ? (
                      <ActivityIndicator size="small" color={colors.muted} />
                    ) : isEmpty ? (
                      <Text style={styles.emptyDay}>No meals logged</Text>
                    ) : (
                      <>
                        <View style={styles.statRow}>
                          <Text style={styles.statValue}>
                            {Math.round(protein)}g
                          </Text>
                          <Text style={styles.statLabel}>protein</Text>
                          {hitTarget && <View style={styles.hitDot} />}
                        </View>
                        <Text style={styles.statSecondary}>
                          {Math.round(calories)} kcal · {mealCount}{' '}
                          {mealCount === 1 ? 'meal' : 'meals'}
                        </Text>
                      </>
                    )}
                  </View>

                  <Feather
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.muted}
                    style={styles.chevron}
                  />
                </View>

                {expanded && data && data.meals.length > 0 && (
                  <View style={styles.expandedBody}>
                    {data.meals.map((m) => (
                      <Pressable
                        key={m.id}
                        style={styles.mealRow}
                        onPress={() => router.push(`/(app)/meal/${m.id}`)}
                      >
                        <Text style={styles.mealTime}>
                          {new Date(m.logged_at).toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </Text>
                        <Text style={styles.mealName} numberOfLines={1}>
                          {m.meal_name}
                        </Text>
                        <Text style={styles.mealProtein}>
                          {Math.round(m.protein_g)}g
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {expanded && isEmpty && (
                  <View style={styles.expandedEmpty}>
                    <Text style={styles.expandedEmptyText}>
                      Nothing logged on this day.
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  headerTitle: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.serifBold,
    fontSize: 18,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  intro: { marginBottom: spacing.lg },
  eyebrow: {
    ...typography.eyebrow,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  observation: {
    ...typography.body,
    color: colors.forest,
    fontFamily: fontFamily.serif,
    fontSize: 18,
    lineHeight: 24,
  },
  loadingState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },

  dayCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  dayCardExpanded: {
    borderColor: colors.lineStrong,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  dayLabelCol: {
    width: 110,
  },
  dayName: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.serifBold,
    fontSize: 16,
  },
  dayDate: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
  daySummary: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 17,
  },
  statLabel: {
    ...typography.small,
    color: colors.muted,
    marginLeft: 4,
  },
  hitDot: {
    width: 8,
    height: 8,
    borderRadius: radius.circle,
    backgroundColor: colors.amber,
    marginLeft: spacing.xs,
  },
  statSecondary: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
  emptyDay: {
    ...typography.small,
    color: colors.muted,
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: spacing.sm,
  },

  expandedBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
  },
  expandedEmpty: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  expandedEmptyText: {
    ...typography.small,
    color: colors.muted,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  mealTime: {
    ...typography.small,
    color: colors.muted,
    width: 64,
  },
  mealName: {
    ...typography.body,
    color: colors.charcoal,
    flex: 1,
    marginRight: spacing.sm,
  },
  mealProtein: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.sansSemibold,
  },
});
