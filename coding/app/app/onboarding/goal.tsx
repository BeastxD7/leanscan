import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Input';
import { OptionList } from '../../src/components/OptionList';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing } from '../../src/theme';
import { useOnboardingStore, type Goal } from '../../src/state/onboarding';

const GOALS: { value: Goal; label: string; hint: string }[] = [
  { value: 'lose', label: 'Lose weight', hint: 'Calorie deficit, protect muscle' },
  { value: 'build', label: 'Build muscle', hint: 'Surplus, hit protein hard' },
  { value: 'recomp', label: 'Recomp', hint: 'Lose fat and build muscle at once' },
  { value: 'maintain', label: 'Maintain', hint: 'Stay where I am' },
];

export default function GoalStep() {
  const router = useRouter();
  const goal = useOnboardingStore((s) => s.goal);
  const setStore = useOnboardingStore((s) => s.set);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={1} canGoBack={false} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Your goal</Text>
          <Text style={styles.title}>What are you working on?</Text>
          <Text style={styles.lede}>This sets your daily protein target.</Text>
        </View>

        <OptionList<Goal>
          value={goal}
          options={GOALS}
          onChange={(v) => setStore({ goal: v })}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Continue"
          onPress={() => router.push('/onboarding/body')}
          disabled={!goal}
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
