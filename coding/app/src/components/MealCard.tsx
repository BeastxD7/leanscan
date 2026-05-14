/**
 * Single meal row on the home screen.
 *   - Tap body → open meal detail
 *   - Tap ⋯ → branded ConfirmSheet asking to delete (one step, no native alert)
 *
 * The photo thumbnail fetches via GET /v1/meals/:id/photo?token=... — the access
 * token is embedded in the URL because <Image>'s `headers:` option is unreliable
 * on Android. The caller (home screen) builds the signed URL.
 */
import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';
import { ConfirmSheet } from './ConfirmSheet';
import type { MealRecord } from '../lib/api';

interface MealCardProps {
  meal: MealRecord;
  /** Fully signed URL — caller embeds `?token=` so RN Image can fetch as-is. */
  photoUrl?: string;
  onPress?: () => void;
  /** Called when the user confirms deletion in the sheet. */
  onDelete?: () => void;
}

export function MealCard({ meal, photoUrl, onPress, onDelete }: MealCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const time = new Date(meal.logged_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  function handleMore() {
    if (!onDelete) return;
    setConfirmOpen(true);
  }

  function handleConfirmDelete() {
    setConfirmOpen(false);
    onDelete?.();
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tapArea, pressed && styles.pressed]}
      >
        <View style={styles.thumbWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbFallback]}>
              <Feather
                name={meal.source === 'photo' ? 'camera' : 'edit-3'}
                size={20}
                color={colors.muted}
              />
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {meal.meal_name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {time}
            {meal.estimated_portion ? ` · ${meal.estimated_portion}` : ''}
          </Text>
        </View>

        <View style={styles.rightCol}>
          {Math.round(meal.protein_g) >= 1 ? (
            <>
              {/* Protein-first: protein is the headline, calories sit below. */}
              <Text style={styles.protein}>
                +{Math.round(meal.protein_g)}
                <Text style={styles.proteinUnit}>g</Text>
              </Text>
              {meal.calories != null && <Text style={styles.cal}>{meal.calories} kcal</Text>}
            </>
          ) : (
            // Zero-protein item — show calories as the headline instead so the
            // row doesn't read as a useless "+0g" entry.
            <Text style={styles.protein}>
              {meal.calories ?? 0}
              <Text style={styles.proteinUnit}> kcal</Text>
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable onPress={handleMore} hitSlop={10} style={styles.moreBtn}>
        <Feather name="more-horizontal" size={20} color={colors.muted} />
      </Pressable>

      <ConfirmSheet
        visible={confirmOpen}
        title={`Delete "${meal.meal_name}"?`}
        body="You can re-log it later — no credits charged."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.75 },
  thumbWrap: { width: 48, height: 48 },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.creamDark },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: spacing.xxs },
  name: { ...typography.bodyMedium, color: colors.charcoal },
  meta: { ...typography.small, color: colors.muted },
  rightCol: { alignItems: 'flex-end' },
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
  cal: { ...typography.small, color: colors.muted },
  moreBtn: {
    width: 36,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: spacing.xs,
  },
});
