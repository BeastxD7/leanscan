import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button } from '../../src/components/Input';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing } from '../../src/theme';
import { useOnboardingStore } from '../../src/state/onboarding';

export default function BodyStep() {
  const router = useRouter();
  const { heightCm, weightKg, goalWeightKg, set } = useOnboardingStore();

  const [heightStr, setHeightStr] = useState(heightCm?.toString() ?? '');
  const [weightStr, setWeightStr] = useState(weightKg?.toString() ?? '');
  const [goalStr, setGoalStr] = useState(goalWeightKg?.toString() ?? '');
  const [errors, setErrors] = useState<{ height?: string; weight?: string; goal?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    const h = Number(heightStr);
    const w = Number(weightStr);
    const g = Number(goalStr);
    if (!h || h < 100 || h > 250) next.height = 'Enter height in cm (100–250).';
    if (!w || w < 30 || w > 300) next.weight = 'Enter weight in kg (30–300).';
    if (goalStr && (g < 30 || g > 300)) next.goal = 'Goal weight should be 30–300 kg.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleContinue() {
    if (!validate()) return;
    set({
      heightCm: Number(heightStr),
      weightKg: Number(weightStr),
      goalWeightKg: goalStr ? Number(goalStr) : null,
    });
    router.push('/onboarding/activity');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={2} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Your body</Text>
            <Text style={styles.title}>The numbers we need.</Text>
            <Text style={styles.lede}>
              Used to calculate your daily protein target. Stays on the server, never shared.
            </Text>
          </View>

          <Input
            label="Height (cm)"
            keyboardType="numeric"
            value={heightStr}
            onChangeText={(t) => {
              setHeightStr(t);
              if (errors.height) setErrors({ ...errors, height: undefined });
            }}
            error={errors.height}
            placeholder="e.g. 175"
          />
          <Input
            label="Current weight (kg)"
            keyboardType="decimal-pad"
            value={weightStr}
            onChangeText={(t) => {
              setWeightStr(t);
              if (errors.weight) setErrors({ ...errors, weight: undefined });
            }}
            error={errors.weight}
            placeholder="e.g. 78.5"
          />
          <Input
            label="Goal weight (kg) — optional"
            keyboardType="decimal-pad"
            value={goalStr}
            onChangeText={(t) => {
              setGoalStr(t);
              if (errors.goal) setErrors({ ...errors, goal: undefined });
            }}
            error={errors.goal}
            placeholder="e.g. 72"
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, flexGrow: 1 },
  hero: { gap: spacing.sm, marginBottom: spacing.lg },
  eyebrow: { ...typography.eyebrow, color: colors.amber },
  title: { ...typography.h1, color: colors.forest },
  lede: { ...typography.body, color: colors.muted },
  footer: { padding: spacing.lg },
});
