/**
 * Horizontal scroll of recent meals. Tap a chip to quick-log the same meal.
 * Lives between the protein ring and today's list on the home screen.
 *
 * Backed by GET /v1/meals/recent (last 10 unique meal names).
 * Quick-add POSTs to /v1/meals with source: 'quick_add'.
 */
import { ScrollView, Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

export interface RecentChipItem {
  id: string;
  meal_name: string;
  protein_g: number;
  calories: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  estimated_portion: string | null;
  last_logged_at: string;
}

interface Props {
  items: RecentChipItem[];
  loading?: boolean;
  /** Set to the id currently being logged so we can grey-out + spinner that chip. */
  pendingId?: string | null;
  onPress: (item: RecentChipItem) => void;
  /**
   * Optional "Add manually" handler. When provided, a leading "+ Manual" chip
   * is rendered before the recents so brand-new users (no recents yet) still
   * see a non-photo logging entry point here instead of needing a second FAB.
   */
  onAddManual?: () => void;
}

export function RecentChips({ items, loading, pendingId, onPress, onAddManual }: Props) {
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.muted} />
      </View>
    );
  }
  // Hide the section entirely only if there are no items AND no manual handler.
  if (items.length === 0 && !onAddManual) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Quick add</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {onAddManual && (
          <Pressable
            onPress={onAddManual}
            style={({ pressed }) => [
              styles.chip,
              styles.manualChip,
              pressed && styles.pressed,
            ]}
            hitSlop={4}
          >
            <View style={styles.manualIconWrap}>
              <Feather name="plus" size={16} color={colors.forest} />
            </View>
            <View>
              <Text style={styles.manualName}>Add manually</Text>
              <Text style={styles.manualSub}>Type macros</Text>
            </View>
          </Pressable>
        )}
        {items.map((item) => {
          const pending = item.id === pendingId;
          return (
            <Pressable
              key={item.id}
              onPress={() => onPress(item)}
              disabled={pending}
              style={({ pressed }) => [
                styles.chip,
                pressed && styles.pressed,
                pending && styles.pendingChip,
              ]}
              hitSlop={4}
            >
              <Text style={styles.name} numberOfLines={1}>
                {item.meal_name}
              </Text>
              <View style={styles.proteinRow}>
                {pending ? (
                  <ActivityIndicator size="small" color={colors.amber} />
                ) : Math.round(item.protein_g) >= 1 ? (
                  // Protein-first when it matters — the headline number.
                  <Text style={styles.protein}>
                    +{Math.round(item.protein_g)}
                    <Text style={styles.proteinUnit}>g</Text>
                  </Text>
                ) : item.calories != null ? (
                  // Zero-protein item (drink, candy, water) — fall back to calories
                  // so the chip isn't a meaningless "+0g".
                  <Text style={styles.protein}>
                    {item.calories}
                    <Text style={styles.proteinUnit}> kcal</Text>
                  </Text>
                ) : (
                  <Text style={styles.protein}>—</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { height: 60, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: {
    ...typography.h3,
    color: colors.forest,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  chip: {
    minWidth: 130,
    maxWidth: 180,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    gap: spacing.xxs,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  pendingChip: { opacity: 0.5 },
  name: { ...typography.bodyMedium, color: colors.charcoal },
  proteinRow: { minHeight: 22, justifyContent: 'center' },
  protein: {
    color: colors.forest,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 18,
  },
  proteinUnit: {
    ...typography.small,
    color: colors.muted,
    fontFamily: 'Manrope_400Regular',
  },
  // "Add manually" leading chip — visually distinct from recents (dashed border,
  // cream-dark fill) so it reads as an action, not a logged item.
  manualChip: {
    minWidth: 130,
    backgroundColor: colors.creamDark,
    borderStyle: 'dashed',
    borderColor: colors.lineStrong,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  manualIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualName: { ...typography.bodyMedium, color: colors.forest },
  manualSub: { ...typography.small, color: colors.muted },
});
