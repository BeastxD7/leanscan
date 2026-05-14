/**
 * Final onboarding step:
 *   1. Show calculated protein target
 *   2. On "Let's go", PATCH /v1/profile with everything we gathered
 *   3. Then POST /v1/onboarding/complete (which grants +20 credits)
 *   4. Update auth store with the latest user, AuthGate redirects to /(app)/home
 */
import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { Button, FormError } from '../../src/components/Input';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing, radius } from '../../src/theme';
import { useOnboardingStore, calculateProteinTarget } from '../../src/state/onboarding';
import { useAuthStore } from '../../src/state/auth';
import { api, ApiError } from '../../src/lib/api';
import { toast } from '../../src/state/toast';

export default function DoneStep() {
  const router = useRouter();
  const qc = useQueryClient();
  const reset = useOnboardingStore((s) => s.reset);
  const onboarding = useOnboardingStore();
  const patchUser = useAuthStore((s) => s.patchUser);

  const proteinTarget = useMemo(
    () =>
      calculateProteinTarget({
        weightKg: onboarding.weightKg,
        activityLevel: onboarding.activityLevel,
        goal: onboarding.goal,
      }),
    [onboarding.weightKg, onboarding.activityLevel, onboarding.goal],
  );

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleFinish() {
    setFormError(null);
    setSubmitting(true);
    try {
      // 1. Build a payload that omits null/undefined fields so the backend's
      //    `.optional()` Zod schema actually treats them as optional. null !== undefined.
      const payload: Record<string, unknown> = {
        units_metric: onboarding.unitsMetric,
        reminder_weight_time: onboarding.reminderWeightTime,
        reminder_meal_nudges: onboarding.reminderMealNudges,
        medication: onboarding.medication,
      };
      if (onboarding.goal) payload.goal = onboarding.goal;
      if (onboarding.heightCm != null) payload.height_cm = onboarding.heightCm;
      if (onboarding.weightKg != null) payload.weight_kg = onboarding.weightKg;
      if (onboarding.goalWeightKg != null) payload.goal_weight_kg = onboarding.goalWeightKg;
      if (onboarding.activityLevel) payload.activity_level = onboarding.activityLevel;

      await api.patchProfile(payload);

      // 2. Mark onboarding complete + grant bonus credits
      const completeResult = await api.completeOnboarding();
      toast.success(completeResult.message);

      // 3. Pull the fresh user record so AuthGate sees onboarding_completed=true
      const me = await api.me();
      await patchUser({
        ...me,
        // /auth/me is snake_case now; explicit fallback in case server returned null
        protein_target_g:
          completeResult.data?.protein_target_g ?? me.protein_target_g ?? proteinTarget,
        onboarding_completed: true,
      });

      // 4. Invalidate cached profile so Settings reflects the new state
      qc.invalidateQueries({ queryKey: ['profile'] });

      // 5. Clean up the local onboarding state and explicitly navigate.
      //    Belt + suspenders — AuthGate also handles this, but tsx watch can
      //    miss the segment update if effect timing is unlucky.
      reset();
      router.replace('/(app)/home');
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Something went wrong. Try again.';
      // Toast so the user actually sees it (FormError is below the fold on short screens).
      toast.error(message);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={6} canGoBack={!submitting} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Your target</Text>
          <Text style={styles.title}>Based on your numbers,{'\n'}you should hit</Text>
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetNumber}>
            {proteinTarget ?? '—'}
            <Text style={styles.targetUnit}> g</Text>
          </Text>
          <Text style={styles.targetLabel}>protein per day</Text>
        </View>

        <Text style={styles.helper}>
          The number that matters most on a recomp / weight-loss / muscle-building track.
          You can adjust it any time in Settings.
        </Text>

        <FormError message={formError} />
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Let's go" variant="amber" onPress={handleFinish} loading={submitting} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  hero: { gap: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...typography.eyebrow, color: colors.amber },
  title: { ...typography.h1, color: colors.forest },
  targetCard: {
    backgroundColor: colors.forest,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  targetNumber: {
    ...typography.display,
    color: colors.amber,
    fontSize: 80,
    lineHeight: 84,
  },
  targetUnit: {
    ...typography.h1,
    color: colors.cream,
    opacity: 0.7,
  },
  targetLabel: {
    ...typography.eyebrow,
    color: colors.cream,
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  helper: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: { padding: spacing.lg },
});
