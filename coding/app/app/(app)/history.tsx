/**
 * History — paginated list of past days.
 *
 *   - Default view: last 7 days
 *   - "Show more" button at bottom → loads 10 more days per tap
 *   - Filter icon (top right) → opens a native date picker; selecting a
 *     date jumps directly to that day's detail (bypasses pagination)
 *   - Tap a day card → navigates to /(app)/history/[date] (day detail
 *     screen with the meals list)
 *
 * Calm-tracker tone, per the strategy doc:
 *   - No streak counters
 *   - No badges / shame mechanics
 *   - Quiet weekly observation only ("X/7 days hit protein this week")
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
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { colors, typography, spacing, radius, fontFamily } from '../../src/theme';
import { useAuthStore } from '../../src/state/auth';
import { api } from '../../src/lib/api';

const INITIAL_VISIBLE = 7;
const PAGE_SIZE = 10;
// Hard upper bound — even for long-time users we don't load >730 days at once.
// The endpoint enforces the same cap.
const MAX_WINDOW_DAYS = 730;

// Weekly consistency widget: GitHub-style heatmap showing the last 12 weeks
// as a 7×12 grid (days × weeks). 4-of-7 days hit threshold defines a
// "successful" week for the streak subtitle.
const WEEKS_TO_SHOW = 12;
const WEEK_SUCCESS_THRESHOLD = 4;

function isoDate(d: Date): string {
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

/**
 * Days between user join date and today (inclusive of today), capped at
 * MAX_WINDOW_DAYS. Falls back to 14 if the join date is unknown.
 */
function daysSinceJoin(createdAtIso: string | undefined): number {
  if (!createdAtIso) return 14;
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return 14;
  const today = new Date();
  const ms = today.getTime() - created.getTime();
  const days = Math.floor(ms / 86_400_000) + 1; // +1 to include join day itself
  return Math.max(1, Math.min(MAX_WINDOW_DAYS, days));
}

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString([], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------
// Weekly consistency math
// ---------------------------------------------------------------

type WeekStatus = 'success' | 'fail' | 'current';

interface WeekStat {
  weekStart: Date;
  daysHit: number;
  status: WeekStatus;
}

/** Monday 00:00 of the ISO week containing d (local time). */
function isoMonday(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

/** Returns the last n Mondays, oldest first. */
function getWeekStarts(n: number): Date[] {
  const today = new Date();
  const currentMon = isoMonday(today);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(currentMon);
    d.setDate(currentMon.getDate() - (n - 1 - i) * 7);
    return d;
  });
}

/**
 * Build the weekly consistency series from per-day protein totals.
 *
 *   - "Success" week = ≥ WEEK_SUCCESS_THRESHOLD days hit the protein target.
 *   - The current (in-progress) week is marked 'current' unless it has already
 *     hit the threshold — in which case it's already 'success'.
 *   - Days before the user's join date and days in the future are excluded
 *     from the day-hit count (rather than counted as failures).
 */
function computeWeeklyStreak(
  proteinByDate: Map<string, number>,
  proteinTargetG: number,
  joinDate: Date | null,
): { weeks: WeekStat[]; current: number; longest: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMon = isoMonday(today);

  const weeks: WeekStat[] = getWeekStarts(WEEKS_TO_SHOW).map((weekStart) => {
    let daysHit = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      if (joinDate && day < joinDate) continue;
      if (day > today) continue;
      const protein = proteinByDate.get(isoDate(day)) ?? 0;
      if (protein >= proteinTargetG) daysHit++;
    }

    const isCurrent = weekStart.getTime() === currentMon.getTime();
    const success = daysHit >= WEEK_SUCCESS_THRESHOLD;
    const status: WeekStatus = success
      ? 'success'
      : isCurrent
        ? 'current'
        : 'fail';

    return { weekStart, daysHit, status };
  });

  // Current streak: walk backwards from the most recent week. The current
  // week doesn't break the streak if it's still in progress — it just
  // doesn't extend it either.
  let current = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i].status === 'success') {
      current++;
    } else if (weeks[i].status === 'current') {
      continue; // in-progress current week is neutral
    } else {
      break;
    }
  }

  // Longest: longest consecutive 'success' run across the window.
  let longest = 0;
  let run = 0;
  for (const w of weeks) {
    if (w.status === 'success') {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 0;
    }
  }

  return { weeks, current, longest };
}

// ---------------------------------------------------------------
// Heatmap cell intensity — one cell = one day
//
//   future:  pre-join or not-yet-today (renders invisible; preserves grid)
//   empty:   day with no logged protein
//   low:     1-49% of protein target
//   medium:  50-99% of protein target
//   high:    >= protein target
// ---------------------------------------------------------------
type CellIntensity = 'future' | 'empty' | 'low' | 'medium' | 'high';

interface HeatmapCellData {
  date: string;
  intensity: CellIntensity;
}

/**
 * Build a 7×WEEKS_TO_SHOW grid of cells. Each column is a week (oldest
 * left → newest right). Each row within a column is Mon..Sun.
 * Returns the grid plus the count of "high" (target-hit) days.
 */
function computeHeatmap(
  proteinByDate: Map<string, number>,
  proteinTargetG: number,
  joinDate: Date | null,
): { columns: HeatmapCellData[][]; daysHit: number } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekStarts = getWeekStarts(WEEKS_TO_SHOW);
  let daysHit = 0;

  const columns = weekStarts.map((weekStart) =>
    Array.from({ length: 7 }, (_, dayIdx) => {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + dayIdx);
      const dateStr = isoDate(day);

      if (joinDate && day < joinDate) {
        return { date: dateStr, intensity: 'future' as const };
      }
      if (day > today) {
        return { date: dateStr, intensity: 'future' as const };
      }

      const protein = proteinByDate.get(dateStr) ?? 0;
      if (protein <= 0) return { date: dateStr, intensity: 'empty' as const };

      const pct = proteinTargetG > 0 ? protein / proteinTargetG : 0;
      if (pct >= 1) {
        daysHit++;
        return { date: dateStr, intensity: 'high' as const };
      }
      if (pct >= 0.5) return { date: dateStr, intensity: 'medium' as const };
      return { date: dateStr, intensity: 'low' as const };
    }),
  );

  return { columns, daysHit };
}

// ---------------------------------------------------------------
// Heatmap cell — small rounded square, intensity by protein %
// ---------------------------------------------------------------
const CELL_FILL: Record<CellIntensity, string> = {
  future: 'transparent',
  empty: 'transparent',
  low: 'rgba(200, 151, 91, 0.25)',
  medium: 'rgba(200, 151, 91, 0.55)',
  high: colors.amber,
};

function HeatmapCell({
  cell,
  onPress,
}: {
  cell: HeatmapCellData;
  onPress?: () => void;
}) {
  const isFuture = cell.intensity === 'future';
  const isEmpty = cell.intensity === 'empty';
  const fill = CELL_FILL[cell.intensity];

  return (
    <Pressable
      onPress={isFuture ? undefined : onPress}
      style={[
        cellStyles.cell,
        { backgroundColor: fill },
        isEmpty && cellStyles.cellEmpty,
        isFuture && cellStyles.cellFuture,
      ]}
    />
  );
}

const cellStyles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
    margin: 1.5,
  },
  cellEmpty: {
    borderWidth: 1,
    borderColor: colors.line,
  },
  cellFuture: {
    opacity: 0, // hidden but keeps grid alignment
  },
});

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
  const proteinTargetG = user?.protein_target_g ?? 0;

  const [pickerOpen, setPickerOpen] = useState(false);

  // Total days available = days since the account was created (capped at
  // MAX_WINDOW_DAYS). Nothing earlier exists — the user wasn't a user yet.
  const totalDaysAvailable = useMemo(
    () => daysSinceJoin(user?.created_at),
    [user?.created_at],
  );

  // Initial visible = min(7, total). A brand-new account that just signed up
  // today shows just "Today" — no fake empty days back to a week ago.
  const [visibleCount, setVisibleCount] = useState(
    Math.min(INITIAL_VISIBLE, totalDaysAvailable),
  );

  const allDates = useMemo(
    () => getLastNDates(totalDaysAvailable),
    [totalDaysAvailable],
  );
  const earliestDate = allDates[allDates.length - 1];

  const daysQuery = useQuery({
    queryKey: ['mealDays', earliestDate],
    queryFn: () => api.listMealDays(earliestDate),
    staleTime: 60_000,
  });

  // Build a date → aggregate lookup so we can render zero-meal days.
  const aggByDate = useMemo(() => {
    const m = new Map<string, { protein_g: number; calories: number; meal_count: number }>();
    daysQuery.data?.days.forEach((d) => {
      m.set(d.date, {
        protein_g: d.protein_g,
        calories: d.calories,
        meal_count: d.meal_count,
      });
    });
    return m;
  }, [daysQuery.data]);

  // Quiet weekly stat: "5/7 days hit protein this week" — observation only.
  const last7DaysHit = useMemo(() => {
    if (proteinTargetG <= 0 || !daysQuery.data) return null;
    const first7 = allDates.slice(0, 7);
    return first7.filter(
      (date) => (aggByDate.get(date)?.protein_g ?? 0) >= proteinTargetG,
    ).length;
  }, [aggByDate, allDates, proteinTargetG, daysQuery.data]);

  // Weekly consistency over the last 12 weeks. We need two things from the
  // per-day protein totals: the streak count (X weeks running) and the
  // heatmap cells (7×12 grid).
  const weekly = useMemo(() => {
    if (proteinTargetG <= 0 || !daysQuery.data) return null;
    const proteinByDate = new Map<string, number>();
    daysQuery.data.days.forEach((d) => proteinByDate.set(d.date, d.protein_g));
    const joinDate = user?.created_at ? new Date(user.created_at) : null;
    if (joinDate && !Number.isNaN(joinDate.getTime())) {
      joinDate.setHours(0, 0, 0, 0);
    }
    const streak = computeWeeklyStreak(proteinByDate, proteinTargetG, joinDate);
    const heat = computeHeatmap(proteinByDate, proteinTargetG, joinDate);
    return { ...streak, columns: heat.columns, daysHit: heat.daysHit };
  }, [daysQuery.data, proteinTargetG, user?.created_at]);

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['mealDays'] });
    }, [qc]),
  );

  const visibleDates = allDates.slice(0, visibleCount);
  const canShowMore = visibleCount < allDates.length;

  function onPickDate(_e: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== 'ios') setPickerOpen(false);
    if (selected) {
      const date = isoDate(selected);
      router.push(`/(app)/history/${date}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.forest} />
        </Pressable>
        <Text style={styles.headerTitle}>History</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={12}
          style={styles.filterBtn}
        >
          <Feather name="calendar" size={20} color={colors.forest} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={daysQuery.isFetching && !daysQuery.isLoading}
            onRefresh={() => daysQuery.refetch()}
            tintColor={colors.forest}
          />
        }
      >
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>RECENT</Text>
          {last7DaysHit !== null && (
            <Text style={styles.observation}>
              {last7DaysHit}/7 days hit your protein target this week
            </Text>
          )}
        </View>

        {weekly && (
          <View style={styles.consistencyCard}>
            <Text style={styles.eyebrow}>LAST {WEEKS_TO_SHOW} WEEKS</Text>

            <View style={styles.heatmapRow}>
              {/* Day labels (M T W T F S S) */}
              <View style={styles.heatmapDayCol}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <Text key={i} style={styles.dayLabelTxt}>
                    {d}
                  </Text>
                ))}
              </View>

              {/* Week columns, oldest left → newest right */}
              {weekly.columns.map((week, wIdx) => (
                <View key={wIdx} style={styles.weekCol}>
                  {week.map((cell) => (
                    <HeatmapCell
                      key={cell.date}
                      cell={cell}
                      onPress={() =>
                        router.push(`/(app)/history/${cell.date}`)
                      }
                    />
                  ))}
                </View>
              ))}
            </View>

            <Text style={styles.consistencyLabel}>
              {weekly.daysHit} {weekly.daysHit === 1 ? 'day' : 'days'} hit your
              protein target
              {weekly.current > 0
                ? ` · ${weekly.current} ${
                    weekly.current === 1 ? 'week' : 'weeks'
                  } running${
                    weekly.longest > weekly.current
                      ? ` · Best ${weekly.longest}`
                      : ''
                  }`
                : ''}
            </Text>

            {/* Legend */}
            <View style={styles.legendRow}>
              <Text style={styles.legendTxt}>Less</Text>
              <View
                style={[styles.legendSwatch, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line }]}
              />
              <View
                style={[styles.legendSwatch, { backgroundColor: CELL_FILL.low }]}
              />
              <View
                style={[styles.legendSwatch, { backgroundColor: CELL_FILL.medium }]}
              />
              <View
                style={[styles.legendSwatch, { backgroundColor: CELL_FILL.high }]}
              />
              <Text style={styles.legendTxt}>More</Text>
            </View>
          </View>
        )}

        {daysQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.forest} />
          </View>
        ) : (
          <>
            {visibleDates.map((date) => {
              const agg = aggByDate.get(date);
              const label = dayLabel(date);
              const protein = agg?.protein_g ?? 0;
              const calories = agg?.calories ?? 0;
              const mealCount = agg?.meal_count ?? 0;
              const hitTarget =
                proteinTargetG > 0 && protein >= proteinTargetG;
              const isEmpty = mealCount === 0;

              return (
                <Pressable
                  key={date}
                  style={styles.dayCard}
                  onPress={() => router.push(`/(app)/history/${date}`)}
                >
                  <View style={styles.dayLabelCol}>
                    <Text style={styles.dayName}>{label.day}</Text>
                    {!!label.date && (
                      <Text style={styles.dayDate}>{label.date}</Text>
                    )}
                  </View>

                  <View style={styles.daySummary}>
                    {isEmpty ? (
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
                    name="chevron-right"
                    size={18}
                    color={colors.muted}
                    style={styles.chevron}
                  />
                </Pressable>
              );
            })}

            {canShowMore && (
              <Pressable
                style={styles.showMoreBtn}
                onPress={() =>
                  setVisibleCount((c) =>
                    Math.min(c + PAGE_SIZE, allDates.length),
                  )
                }
              >
                <Text style={styles.showMoreText}>
                  Show {Math.min(PAGE_SIZE, allDates.length - visibleCount)} more
                </Text>
              </Pressable>
            )}

            {!canShowMore && (
              <Text style={styles.endNote}>
                {user?.created_at
                  ? `You've been with LeanScan since ${formatJoinDate(user.created_at)}. Nothing to show before then.`
                  : `Showing the past ${allDates.length} days.`}
              </Text>
            )}
          </>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Date picker — Android shows inline dialog, iOS uses spinner overlay.
          minimumDate caps it at the join date so users can't jump to dates
          before their account existed. */}
      {pickerOpen && Platform.OS === 'android' && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          minimumDate={
            user?.created_at ? new Date(user.created_at) : undefined
          }
          onChange={onPickDate}
        />
      )}
      {pickerOpen && Platform.OS === 'ios' && (
        <View style={styles.iosPickerOverlay} pointerEvents="box-none">
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => setPickerOpen(false)}
          />
          <View style={styles.iosPickerSheet}>
            <View style={styles.iosPickerHeader}>
              <Text style={styles.iosPickerTitle}>Jump to date</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
                <Text style={styles.iosPickerDone}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={new Date()}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              minimumDate={
                user?.created_at ? new Date(user.created_at) : undefined
              }
              onChange={onPickDate}
              themeVariant="light"
            />
          </View>
        </View>
      )}
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
  filterBtn: {
    padding: 2,
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

  consistencyCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  heatmapRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heatmapDayCol: {
    width: 18,
    justifyContent: 'space-between',
    paddingVertical: 2,
    marginRight: 4,
  },
  dayLabelTxt: {
    ...typography.small,
    fontSize: 9,
    color: colors.muted,
    height: 18,
    lineHeight: 18,
    textAlign: 'right',
  },
  weekCol: {
    flex: 1,
    flexDirection: 'column',
  },
  consistencyLabel: {
    ...typography.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: spacing.xs,
  },
  legendTxt: {
    ...typography.small,
    fontSize: 10,
    color: colors.muted,
    marginHorizontal: 2,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },

  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  dayLabelCol: { width: 110 },
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
  statRow: { flexDirection: 'row', alignItems: 'center' },
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
  chevron: { marginLeft: spacing.sm },

  showMoreBtn: {
    backgroundColor: colors.forest,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  showMoreText: {
    ...typography.bodyMedium,
    color: colors.cream,
    fontFamily: fontFamily.sansSemibold,
  },
  endNote: {
    ...typography.small,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },

  iosPickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  iosPickerSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  iosPickerTitle: {
    ...typography.bodyMedium,
    color: colors.forest,
  },
  iosPickerDone: {
    ...typography.bodyMedium,
    color: colors.amber,
  },
});
