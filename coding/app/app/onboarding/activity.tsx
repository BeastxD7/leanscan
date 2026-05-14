import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Input';
import { OptionList } from '../../src/components/OptionList';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing } from '../../src/theme';
import { useOnboardingStore, type ActivityLevel } from '../../src/state/onboarding';

const LEVELS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Sedentary', hint: 'Desk job, little or no exercise' },
  { value: 'light', label: 'Light', hint: 'Light exercise 1–2 days/week' },
  { value: 'moderate', label: 'Moderate', hint: 'Gym + some cardio 3–4 days/week' },
  { value: 'active', label: 'Active', hint: 'Hard training 5+ days/week' },
];

export default function ActivityStep() {
  const router = useRouter();
  const activityLevel = useOnboardingStore((s) => s.activityLevel);
  const setStore = useOnboardingStore((s) => s.set);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={3} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Activity level</Text>
          <Text style={styles.title}>How active are you?</Text>
          <Text style={styles.lede}>
            Bumps your protein target — moderate adds 0.2 g/kg, active adds 0.4 g/kg.
          </Text>
        </View>

        <OptionList<ActivityLevel>
          value={activityLevel}
          options={LEVELS}
          onChange={(v) => setStore({ activityLevel: v })}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Continue"
          onPress={() => router.push('/onboarding/medication')}
          disabled={!activityLevel}
        />
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
  lede: { ...typography.body, color: colors.muted },
  footer: { padding: spacing.lg },
});
