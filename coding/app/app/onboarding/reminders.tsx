import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button } from '../../src/components/Input';
import { StepHeader } from '../../src/components/StepHeader';
import { colors, typography, spacing, radius } from '../../src/theme';
import { useOnboardingStore } from '../../src/state/onboarding';

export default function RemindersStep() {
  const router = useRouter();
  const reminderWeightTime = useOnboardingStore((s) => s.reminderWeightTime);
  const reminderMealNudges = useOnboardingStore((s) => s.reminderMealNudges);
  const setStore = useOnboardingStore((s) => s.set);

  const [timeStr, setTimeStr] = useState(reminderWeightTime);
  const [timeError, setTimeError] = useState<string | null>(null);

  function handleContinue() {
    if (!/^\d{2}:\d{2}$/.test(timeStr)) {
      setTimeError('Format: HH:MM (e.g. 08:00).');
      return;
    }
    setStore({ reminderWeightTime: timeStr });
    router.push('/onboarding/done');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StepHeader step={5} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Reminders</Text>
            <Text style={styles.title}>When should we nudge?</Text>
            <Text style={styles.lede}>You can change these later in Settings.</Text>
          </View>

          <Input
            label="Morning weight reminder"
            value={timeStr}
            onChangeText={(t) => {
              setTimeStr(t);
              if (timeError) setTimeError(null);
            }}
            error={timeError}
            placeholder="08:00"
            autoCapitalize="none"
          />

          <Pressable
            onPress={() => setStore({ reminderMealNudges: !reminderMealNudges })}
            style={styles.toggleRow}
          >
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Mid-day protein nudges</Text>
              <Text style={styles.toggleHint}>
                A friendly check-in around 2pm if you're behind on protein.
              </Text>
            </View>
            <Switch
              value={reminderMealNudges}
              onValueChange={(v) => setStore({ reminderMealNudges: v })}
              trackColor={{ true: colors.forest, false: colors.line }}
              thumbColor={colors.cream}
            />
          </Pressable>
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleText: { flex: 1 },
  toggleLabel: { ...typography.bodyMedium, color: colors.charcoal },
  toggleHint: { ...typography.small, color: colors.muted, marginTop: spacing.xxs },
  footer: { padding: spacing.lg },
});
