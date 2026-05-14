/**
 * Manual entry — log a meal by typing macros directly. No photo, no credit cost.
 * Required: meal name + protein. Optional: calories, carbs, fat, portion.
 *
 * Why a separate route from the scan flow:
 *   - No image processing, no credit debit
 *   - Used as a fallback when AI fails OR there's no photo opportunity
 *   - Kept simple — single screen, single Save action
 */
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { Input, Button, FormError } from '../../src/components/Input';
import { colors, typography, spacing } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { toast } from '../../src/state/toast';

export default function ManualEntry() {
  const router = useRouter();
  const qc = useQueryClient();

  const [mealName, setMealName] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [calories, setCalories] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [portion, setPortion] = useState('');

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const proteinRef = useRef<RNTextInput>(null);
  const caloriesRef = useRef<RNTextInput>(null);
  const carbsRef = useRef<RNTextInput>(null);
  const fatRef = useRef<RNTextInput>(null);
  const portionRef = useRef<RNTextInput>(null);

  function setErr(k: string, msg: string | null) {
    setErrors((prev) => ({ ...prev, [k]: msg }));
  }

  function validate(): boolean {
    let ok = true;
    const next: Record<string, string | null> = {};

    if (!mealName.trim()) {
      next.mealName = 'What did you eat?';
      ok = false;
    }
    const p = Number(proteinG);
    if (!proteinG.trim() || !Number.isFinite(p) || p < 0 || p > 500) {
      next.proteinG = 'Protein (g) is required. 0–500.';
      ok = false;
    }
    if (calories.trim()) {
      const c = Number(calories);
      if (!Number.isFinite(c) || c < 0 || c > 5000) {
        next.calories = '0–5000 kcal.';
        ok = false;
      }
    }
    if (carbsG.trim()) {
      const c = Number(carbsG);
      if (!Number.isFinite(c) || c < 0 || c > 500) {
        next.carbsG = '0–500 g.';
        ok = false;
      }
    }
    if (fatG.trim()) {
      const f = Number(fatG);
      if (!Number.isFinite(f) || f < 0 || f > 500) {
        next.fatG = '0–500 g.';
        ok = false;
      }
    }
    setErrors(next);
    return ok;
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      api.saveMeal({
        meal_name: mealName.trim(),
        protein_g: Number(proteinG),
        ...(calories.trim() ? { calories: Math.round(Number(calories)) } : {}),
        ...(carbsG.trim() ? { carbs_g: Number(carbsG) } : {}),
        ...(fatG.trim() ? { fat_g: Number(fatG) } : {}),
        ...(portion.trim() ? { estimated_portion: portion.trim() } : {}),
        source: 'manual',
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ['meals'] });
      router.back();
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        if (err.code === 'validation_error') {
          setFormError('Please check the fields above.');
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Could not save. Try again.');
      }
    },
  });

  function handleSave() {
    setFormError(null);
    if (!validate()) return;
    saveMutation.mutate();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Feather name="x" size={18} color={colors.forest} />
          <Text style={styles.close}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Add manually</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>No photo? No problem.</Text>
            <Text style={styles.lede}>
              Just protein is required — the rest you can fill in if you know it.
            </Text>
          </View>

          <FormError message={formError} />

          <Input
            label="What did you eat? *"
            placeholder="Greek yogurt with honey"
            value={mealName}
            onChangeText={(t) => {
              setMealName(t);
              if (errors.mealName) setErr('mealName', null);
            }}
            error={errors.mealName}
            returnKeyType="next"
            onSubmitEditing={() => proteinRef.current?.focus()}
            editable={!saveMutation.isPending}
          />

          <Input
            ref={proteinRef}
            label="Protein (g) *"
            placeholder="25"
            keyboardType="decimal-pad"
            value={proteinG}
            onChangeText={(t) => {
              setProteinG(t);
              if (errors.proteinG) setErr('proteinG', null);
            }}
            error={errors.proteinG}
            returnKeyType="next"
            onSubmitEditing={() => caloriesRef.current?.focus()}
            editable={!saveMutation.isPending}
          />

          <View style={styles.row3}>
            <View style={{ flex: 1 }}>
              <Input
                ref={caloriesRef}
                label="Calories"
                placeholder="kcal"
                keyboardType="number-pad"
                value={calories}
                onChangeText={(t) => {
                  setCalories(t);
                  if (errors.calories) setErr('calories', null);
                }}
                error={errors.calories}
                returnKeyType="next"
                onSubmitEditing={() => carbsRef.current?.focus()}
                editable={!saveMutation.isPending}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                ref={carbsRef}
                label="Carbs (g)"
                placeholder="0"
                keyboardType="decimal-pad"
                value={carbsG}
                onChangeText={(t) => {
                  setCarbsG(t);
                  if (errors.carbsG) setErr('carbsG', null);
                }}
                error={errors.carbsG}
                returnKeyType="next"
                onSubmitEditing={() => fatRef.current?.focus()}
                editable={!saveMutation.isPending}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                ref={fatRef}
                label="Fat (g)"
                placeholder="0"
                keyboardType="decimal-pad"
                value={fatG}
                onChangeText={(t) => {
                  setFatG(t);
                  if (errors.fatG) setErr('fatG', null);
                }}
                error={errors.fatG}
                returnKeyType="next"
                onSubmitEditing={() => portionRef.current?.focus()}
                editable={!saveMutation.isPending}
              />
            </View>
          </View>

          <Input
            ref={portionRef}
            label="Portion (optional)"
            placeholder="1 cup, 200g, 1 medium"
            value={portion}
            onChangeText={setPortion}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            editable={!saveMutation.isPending}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={saveMutation.isPending ? 'Saving…' : 'Save meal'}
            onPress={handleSave}
            loading={saveMutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  close: { ...typography.bodyMedium, color: colors.forest },
  title: { ...typography.h3, color: colors.forest },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  eyebrow: { ...typography.eyebrow, color: colors.amber, marginBottom: spacing.xs },
  lede: { ...typography.body, color: colors.muted },
  row3: { flexDirection: 'row', gap: spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
