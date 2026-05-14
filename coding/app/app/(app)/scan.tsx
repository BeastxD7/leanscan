/**
 * Snap → analyze → review → save flow.
 *
 * State machine:
 *   idle     — buttons: take photo / pick from gallery
 *   analyzing — spinner while photo uploads + Gemini runs (~5-8s)
 *   reviewing — show photo + AI estimate; user can edit name/portion/macros, save, retake
 *   saving    — quick spinner while POST /v1/meals fires, then nav back to home
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import { Button } from '../../src/components/Input';
import { colors, typography, spacing, radius } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { toast } from '../../src/state/toast';
import { useAuthStore } from '../../src/state/auth';

type Phase = 'idle' | 'analyzing' | 'reviewing' | 'saving';

interface Estimate {
  meal_name: string;
  estimated_portion?: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
  notes?: string;
}

export default function Scan() {
  const router = useRouter();
  const qc = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);
  const user = useAuthStore((s) => s.user);

  const [phase, setPhase] = useState<Phase>('idle');
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [rawAi, setRawAi] = useState<unknown>(null);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [editedByUser, setEditedByUser] = useState(false);

  async function ensurePermissions(mode: 'camera' | 'gallery'): Promise<boolean> {
    if (mode === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Camera permission denied. Enable in Settings to snap meals.');
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Photo library permission denied.');
        return false;
      }
    }
    return true;
  }

  async function pickAndAnalyze(mode: 'camera' | 'gallery') {
    if (!(await ensurePermissions(mode))) return;

    const result =
      mode === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            exif: false,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            exif: false,
          });

    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    setLocalUri(uri);
    setPhase('analyzing');

    try {
      const data = await api.uploadMealPhoto(uri);

      // Credit was already debited server-side. Sync the UI immediately so it
      // reflects the new balance whether the photo was a meal or not.
      if (user) await patchUser({ credit_balance: data.credit_balance });

      if (data.estimate && (data.estimate as Estimate & { error?: string }).error === 'not_a_meal') {
        const conf = data.estimate.confidence;
        const msg =
          conf === 'high'
            ? "We couldn't find any food or drink in this photo — 1 credit used."
            : conf === 'medium'
              ? "Not sure what's in this photo — 1 credit used. Try a clearer shot of the food, drink, or wrapper."
              : 'No food found — 1 credit used. Try framing the item more directly.';
        toast.info(msg, 5000);
        setPhase('idle');
        setLocalUri(null);
        return;
      }
      setEstimate(data.estimate);
      setPhotoPath(data.photo_path);
      setRawAi(data.raw_ai_response);
      setEditedByUser(false);
      setPhase('reviewing');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'out_of_credits') {
          toast.error("You're out of credits. Log this meal manually for free.");
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Failed to analyze photo. Try again.');
      }
      setPhase('idle');
      setLocalUri(null);
    }
  }

  async function handleSave() {
    if (!estimate) return;
    setPhase('saving');
    try {
      const result = await api.saveMeal({
        meal_name: estimate.meal_name,
        protein_g: estimate.protein_g,
        calories: estimate.calories,
        carbs_g: estimate.carbs_g,
        fat_g: estimate.fat_g,
        estimated_portion: estimate.estimated_portion,
        confidence: estimate.confidence,
        ai_notes: estimate.notes,
        photo_path: photoPath ?? undefined,
        raw_ai_response: rawAi,
        source: 'photo',
        edited_by_user: editedByUser,
      });
      toast.success(result.message);
      // refresh home screen data
      qc.invalidateQueries({ queryKey: ['meals'] });
      router.back();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not save meal.';
      toast.error(msg);
      setPhase('reviewing');
    }
  }

  function handleRetake() {
    setEstimate(null);
    setPhotoPath(null);
    setLocalUri(null);
    setRawAi(null);
    setEditedByUser(false);
    setPhase('idle');
  }

  function updateEstimate(patch: Partial<Estimate>) {
    setEstimate((prev) => (prev ? { ...prev, ...patch } : prev));
    setEditedByUser(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="x" size={22} color={colors.forest} />
        </Pressable>
        <Text style={styles.title}>Scan meal</Text>
        <View style={{ width: 24 }} />
      </View>

      {phase === 'idle' && (
        <View style={styles.idleWrap}>
          <View style={styles.idleHero}>
            <Text style={styles.eyebrow}>Snap or pick</Text>
            <Text style={styles.idleTitle}>Photograph your meal.</Text>
            <Text style={styles.idleLede}>
              We'll estimate protein in about 5 seconds. Costs 1 credit per scan.
            </Text>
          </View>
          <View style={styles.idleActions}>
            <Button label="Take photo" variant="amber" onPress={() => pickAndAnalyze('camera')} />
            <Button
              label="Pick from gallery"
              variant="ghost"
              onPress={() => pickAndAnalyze('gallery')}
            />
          </View>
        </View>
      )}

      {phase === 'analyzing' && (
        <View style={styles.center}>
          {localUri && <Image source={{ uri: localUri }} style={styles.previewBig} />}
          <ActivityIndicator size="large" color={colors.forest} style={{ marginTop: spacing.lg }} />
          <Text style={styles.analyzeText}>Looking at your plate…</Text>
          <Text style={styles.analyzeSub}>Estimating protein, calories, macros.</Text>
        </View>
      )}

      {phase === 'reviewing' && estimate && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.reviewScroll} keyboardShouldPersistTaps="handled">
            {localUri && <Image source={{ uri: localUri }} style={styles.previewSmall} />}

            <View style={styles.resultCard}>
              <Text style={styles.resultEyebrow}>AI estimate · {estimate.confidence}</Text>
              <Text style={styles.resultProtein}>
                {estimate.protein_g}
                <Text style={styles.resultUnit}> g protein</Text>
              </Text>
              <View style={styles.macroRow}>
                <Macro label="Calories" value={`${estimate.calories}`} unit="kcal" />
                <Macro label="Carbs" value={`${estimate.carbs_g}`} unit="g" />
                <Macro label="Fat" value={`${estimate.fat_g}`} unit="g" />
              </View>
            </View>

            <View style={styles.editGroup}>
              <Text style={styles.label}>Meal name</Text>
              <TextInput
                style={styles.input}
                value={estimate.meal_name}
                onChangeText={(t) => updateEstimate({ meal_name: t })}
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.editGroup}>
              <Text style={styles.label}>Portion</Text>
              <TextInput
                style={styles.input}
                value={estimate.estimated_portion ?? ''}
                onChangeText={(t) => updateEstimate({ estimated_portion: t })}
                placeholder="e.g. 1 plate, ~350g"
                placeholderTextColor={colors.muted}
              />
            </View>
            <View style={styles.editRow}>
              <View style={[styles.editGroup, { flex: 1 }]}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={`${estimate.protein_g}`}
                  onChangeText={(t) => updateEstimate({ protein_g: Number(t) || 0 })}
                />
              </View>
              <View style={[styles.editGroup, { flex: 1 }]}>
                <Text style={styles.label}>Calories</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={`${estimate.calories}`}
                  onChangeText={(t) => updateEstimate({ calories: Number(t) || 0 })}
                />
              </View>
            </View>

            {estimate.notes ? <Text style={styles.aiNotes}>{estimate.notes}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerRow}>
              <View style={{ flex: 1 }}>
                <Button label="Retake" variant="ghost" onPress={handleRetake} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="Save meal" variant="amber" onPress={handleSave} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {phase === 'saving' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.forest} />
          <Text style={styles.analyzeText}>Saving meal…</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

function Macro({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value}
        <Text style={styles.macroUnit}> {unit}</Text>
      </Text>
    </View>
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
  close: { fontSize: 22, color: colors.forest },
  title: { ...typography.bodyMedium, color: colors.forest },

  idleWrap: { flex: 1, padding: spacing.lg, justifyContent: 'space-between' },
  idleHero: { gap: spacing.sm, marginTop: spacing.xl },
  eyebrow: { ...typography.eyebrow, color: colors.amber },
  idleTitle: { ...typography.h1, color: colors.forest },
  idleLede: { ...typography.body, color: colors.muted },
  idleActions: { gap: spacing.sm, paddingBottom: spacing.xl },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  previewBig: {
    width: 240,
    height: 240,
    borderRadius: radius.xl,
    backgroundColor: colors.creamDark,
  },
  previewSmall: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    alignSelf: 'center',
    backgroundColor: colors.creamDark,
  },
  analyzeText: { ...typography.h3, color: colors.forest, marginTop: spacing.md },
  analyzeSub: { ...typography.small, color: colors.muted, marginTop: spacing.xxs },

  reviewScroll: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultCard: {
    backgroundColor: colors.forest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  resultEyebrow: { ...typography.eyebrow, color: colors.amber },
  resultProtein: {
    ...typography.display,
    fontSize: 64,
    lineHeight: 68,
    color: colors.amber,
  },
  resultUnit: { ...typography.bodyMedium, color: colors.cream, opacity: 0.7 },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  macroCol: { alignItems: 'center', minWidth: 60 },
  macroLabel: { ...typography.eyebrow, color: colors.cream, opacity: 0.6 },
  macroValue: { ...typography.bodyMedium, color: colors.cream, fontFamily: 'Fraunces_500Medium', fontSize: 18 },
  macroUnit: { ...typography.small, color: colors.cream, opacity: 0.6 },

  editGroup: { gap: spacing.xxs },
  editRow: { flexDirection: 'row', gap: spacing.sm },
  label: { ...typography.eyebrow, color: colors.muted },
  input: {
    ...typography.body,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.charcoal,
    minHeight: 44,
  },
  aiNotes: {
    ...typography.small,
    color: colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },

  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
});
