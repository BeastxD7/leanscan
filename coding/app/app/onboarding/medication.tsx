import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../src/components/Input';
import { OptionList } from '../../src/components/OptionList';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing } from '../../src/theme';
import { useOnboardingStore, type Medication } from '../../src/state/onboarding';

const OPTS: { value: Medication; label: string; hint?: string }[] = [
  { value: 'none', label: 'None', hint: 'Most people choose this' },
  { value: 'ozempic', label: 'Ozempic (semaglutide)' },
  { value: 'wegovy', label: 'Wegovy (semaglutide)' },
  { value: 'mounjaro', label: 'Mounjaro (tirzepatide)' },
  { value: 'zepbound', label: 'Zepbound (tirzepatide)' },
  { value: 'saxenda', label: 'Saxenda (liraglutide)' },
  { value: 'compounded_semaglutide', label: 'Compounded semaglutide' },
  { value: 'compounded_tirzepatide', label: 'Compounded tirzepatide' },
  { value: 'other', label: 'Other' },
];

export default function MedicationStep() {
  const router = useRouter();
  const medication = useOnboardingStore((s) => s.medication);
  const setStore = useOnboardingStore((s) => s.set);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={4} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Medication (optional)</Text>
          <Text style={styles.title}>Are you on any of these?</Text>
          <Text style={styles.lede}>
            If yes, we surface medication-specific symptom tracking. If no, leave it on "None".
          </Text>
        </View>

        <OptionList<Medication>
          value={medication}
          options={OPTS}
          onChange={(v) => setStore({ medication: v })}
        />
      </ScrollView>
      <View style={styles.footer}>
        <Button label="Continue" onPress={() => router.push('/onboarding/reminders')} />
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
