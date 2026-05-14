/**
 * Single meal row on the home screen.
 *   - Tap body → open meal detail
 *   - Tap ⋯ → action menu (currently just Delete)
 *
 * The photo thumbnail fetches via GET /v1/meals/:id/photo?token=... — the access
 * token is embedded in the URL because <Image>'s `headers:` option is unreliable
 * on Android. The caller (home screen) builds the signed URL.
 */
import { View, Text, Image, Pressable, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import type { MealRecord } from '../lib/api';

interface MealCardProps {
  meal: MealRecord;
  /** Fully signed URL — caller embeds `?token=` so RN Image can fetch as-is. */
  photoUrl?: string;
  onPress?: () => void;
  onDelete?: () => void;
}

export function MealCard({ meal, photoUrl, onPress, onDelete }: MealCardProps) {
  const time = new Date(meal.logged_at).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  function handleMore() {
    if (!onDelete) return;
    Alert.alert(meal.meal_name, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
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
              <Text style={styles.thumbIcon}>{meal.source === 'photo' ? '📷' : '✎'}</Text>
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
          <Text style={styles.protein}>
            +{Math.round(meal.protein_g)}
            <Text style={styles.proteinUnit}>g</Text>
          </Text>
          {meal.calories != null && <Text style={styles.cal}>{meal.calories} kcal</Text>}
        </View>
      </Pressable>

      <Pressable onPress={handleMore} hitSlop={10} style={styles.moreBtn}>
        <Text style={styles.moreIcon}>⋯</Text>
      </Pressable>
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
  thumbIcon: { fontSize: 22 },
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
  moreIcon: {
    fontSize: 20,
    color: colors.muted,
    fontWeight: '700',
  },
});
