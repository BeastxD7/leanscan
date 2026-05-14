/**
 * Reusable header for onboarding screens.
 * Shows "Step N of 6" + back arrow + a tiny progress bar.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, radius } from '../theme';

interface StepHeaderProps {
  step: number;
  total?: number;
  canGoBack?: boolean;
}

export function StepHeader({ step, total = 6, canGoBack = true }: StepHeaderProps) {
  const router = useRouter();
  const pct = Math.min(100, Math.round((step / total) * 100));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {canGoBack && router.canGoBack() ? (
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text style={styles.label}>
          Step {step} of {total}
        </Text>
        <View style={styles.back} />
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.forest,
  },
  label: {
    ...typography.eyebrow,
    color: colors.muted,
  },
  barTrack: {
    height: 3,
    backgroundColor: colors.line,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.amber,
    borderRadius: radius.pill,
  },
});
