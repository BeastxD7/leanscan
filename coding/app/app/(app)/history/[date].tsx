/**
 * History — Day detail screen.
 *
 * Shows every meal logged on the date in the URL param. Tap a meal row
 * to navigate to the existing /(app)/meal/[id] detail.
 *
 * Reached from history.tsx by either:
 *   - Tapping a day card (most common)
 *   - Picking a date in the calendar filter
 */
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { colors, typography, spacing, radius, fontFamily } from '../../../src/theme';
import { useAuthStore } from '../../../src/state/auth';
import { api } from '../../../src/lib/api';

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDayHeading(iso: string): string {
  const today = isoDate(new Date());
  const yesterday = isoDate(new Date(Date.now() - 86_400_000));
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HistoryDayDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date: string }>();
  const date = String(params.date ?? '');
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const proteinTargetG = user?.protein_target_g ?? 0;

  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const mealsQuery = useQuery({
    queryKey: ['meals', date],
    queryFn: () => api.listMeals(date),
    enabled: isValidDate,
    staleTime: 60_000,
  });

  useFocusEffect(
    useCallback(() => {
      if (isValidDate) {
        qc.invalidateQueries({ queryKey: ['meals', date] });
      }
    }, [qc, date, isValidDate]),
  );

  const data = mealsQuery.data;
  const meals = data?.meals ?? [];
  const totals = data?.totals;
  const hitTarget =
    proteinTargetG > 0 && (totals?.protein_g ?? 0) >= proteinTargetG;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {isValidDate ? formatDayHeading(date) : 'Day'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={mealsQuery.isFetching && !mealsQuery.isLoading}
            onRefresh={() => mealsQuery.refetch()}
            tintColor={colors.forest}
          />
        }
      >
        {!isValidDate ? (
          <View style={styles.centered}>
            <Text style={styles.error}>Invalid date.</Text>
          </View>
        ) : mealsQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (
          <>
            {/* Day totals */}
            {totals && (
              <View style={styles.totalsCard}>
                <View style={styles.totalsRow}>
                  <View style={styles.totalsCol}>
                    <Text style={styles.totalsValue}>
                      {Math.round(totals.protein_g)}
                      <Text style={styles.totalsUnit}>g</Text>
                    </Text>
                    <View style={styles.totalsLabelRow}>
                      <Text style={styles.totalsLabel}>protein</Text>
                      {hitTarget && <View style={styles.hitDot} />}
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalsCol}>
                    <Text style={styles.totalsValue}>
                      {Math.round(totals.calories)}
                    </Text>
                    <Text style={styles.totalsLabel}>kcal</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.totalsCol}>
                    <Text style={styles.totalsValue}>{meals.length}</Text>
                    <Text style={styles.totalsLabel}>
                      {meals.length === 1 ? 'meal' : 'meals'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Meals list */}
            <Text style={styles.sectionLabel}>MEALS</Text>

            {meals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nothing logged.</Text>
                <Text style={styles.emptyBody}>
                  This day didn&apos;t have any meals logged. Quiet days
                  happen — no pressure.
                </Text>
              </View>
            ) : (
              meals.map((m) => (
                <Pressable
                  key={m.id}
                  style={styles.mealRow}
                  onPress={() => router.push(`/(app)/meal/${m.id}`)}
                >
                  <View style={styles.mealTimeCol}>
                    <Text style={styles.mealTime}>
                      {new Date(m.logged_at).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.mealMiddle}>
                    <Text style={styles.mealName} numberOfLines={1}>
                      {m.meal_name}
                    </Text>
                    {!!m.estimated_portion && (
                      <Text style={styles.mealPortion} numberOfLines={1}>
                        {m.estimated_portion}
                      </Text>
                    )}
                  </View>
                  <View style={styles.mealRight}>
                    <Text style={styles.mealProtein}>
                      {Math.round(m.protein_g)}g
                    </Text>
                    {m.calories != null && (
                      <Text style={styles.mealKcal}>
                        {Math.round(m.calories)} kcal
                      </Text>
                    )}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
              ))
            )}
          </>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  error: { ...typography.body, color: colors.error },

  totalsCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  totalsCol: {
    alignItems: 'center',
    flex: 1,
  },
  totalsValue: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.serifBold,
    fontSize: 26,
  },
  totalsUnit: {
    fontSize: 16,
    color: colors.muted,
    fontFamily: fontFamily.sansSemibold,
  },
  totalsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  totalsLabel: {
    ...typography.small,
    color: colors.muted,
  },
  hitDot: {
    width: 7,
    height: 7,
    borderRadius: radius.circle,
    backgroundColor: colors.amber,
    marginLeft: 6,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.line,
  },

  sectionLabel: {
    ...typography.eyebrow,
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  emptyState: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.serif,
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    ...typography.small,
    color: colors.muted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },

  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  mealTimeCol: { width: 64 },
  mealTime: {
    ...typography.small,
    color: colors.muted,
  },
  mealMiddle: {
    flex: 1,
    marginRight: spacing.sm,
  },
  mealName: {
    ...typography.body,
    color: colors.charcoal,
  },
  mealPortion: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
  mealRight: {
    alignItems: 'flex-end',
    marginRight: spacing.xs,
  },
  mealProtein: {
    ...typography.bodyMedium,
    color: colors.forest,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
  },
  mealKcal: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
});
