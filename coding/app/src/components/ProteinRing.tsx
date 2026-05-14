/**
 * Brand-styled protein ring + secondary calorie ring.
 * Pure react-native-svg, no Skia/Victory needed for two rings.
 */
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, typography, spacing } from '../theme';

interface ProteinRingProps {
  proteinG: number;
  proteinTargetG: number;
  calories: number;
  calorieGoal?: number | null;
}

const RING_SIZE = 220;
const STROKE = 18;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProteinRing({
  proteinG,
  proteinTargetG,
  calories,
  calorieGoal,
}: ProteinRingProps) {
  const proteinPct = proteinTargetG > 0 ? Math.min(1, proteinG / proteinTargetG) : 0;
  const proteinOffset = CIRCUMFERENCE * (1 - proteinPct);

  return (
    <View style={styles.wrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <G rotation={-90} originX={RING_SIZE / 2} originY={RING_SIZE / 2}>
          {/* Track */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.creamDark}
            strokeWidth={STROKE}
            fill="none"
          />
          {/* Progress */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.amber}
            strokeWidth={STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={proteinOffset}
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.bigNumber}>{Math.round(proteinG)}</Text>
        <Text style={styles.unit}>g protein</Text>
        <Text style={styles.target}>of {proteinTargetG}g</Text>
        <View style={styles.divider} />
        <Text style={styles.secondary}>
          {Math.round(calories)} kcal{calorieGoal ? ` · goal ${calorieGoal}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  bigNumber: {
    ...typography.display,
    fontSize: 60,
    lineHeight: 64,
    color: colors.forest,
  },
  unit: {
    ...typography.eyebrow,
    color: colors.muted,
    marginTop: -spacing.xxs,
  },
  target: {
    ...typography.small,
    color: colors.muted,
  },
  divider: {
    width: 24,
    height: 1,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  secondary: {
    ...typography.small,
    color: colors.muted,
  },
});
