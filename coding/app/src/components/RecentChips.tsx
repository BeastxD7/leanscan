/**
 * Horizontal scroll of recent meals. Tap a chip to quick-log the same meal.
 * Lives between the protein ring and today's list on the home screen.
 *
 * Backed by GET /v1/meals/recent (last 10 unique meal names).
 * Quick-add POSTs to /v1/meals with source: 'quick_add'.
 */
import { ScrollView, Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
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
}

export function RecentChips({ items, loading, pendingId, onPress }: Props) {
  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.muted} />
      </View>
    );
  }
  if (items.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>Quick add</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
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
                ) : (
                  <Text style={styles.protein}>
                    +{Math.round(item.protein_g)}
                    <Text style={styles.proteinUnit}>g</Text>
                  </Text>
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
});
