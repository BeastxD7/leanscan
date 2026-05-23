/**
 * Snap → analyze → review → save flow with multi-item support.
 *
 * State machine:
 *   idle      — buttons: take photo / pick from gallery
 *   analyzing — spinner while photo uploads + AI runs (~5-8s)
 *   reviewing — show photo + AI breakdown (per-item editable list); user can
 *               add/remove items, edit names/portions/macros, save, retake
 *   saving    — quick spinner while POST /v1/meals fires, then nav back to home
 */
import { useMemo, useState } from 'react';
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
import { colors, typography, spacing, radius, fontFamily } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { toast } from '../../src/state/toast';
import { useAuthStore } from '../../src/state/auth';

type Phase = 'idle' | 'analyzing' | 'reviewing' | 'saving';

interface ItemDraft {
  // Client-side stable id so React keys survive edits/reorders.
  uid: string;
  item_name: string;
  estimated_portion?: string;
  protein_g: number;
  calories: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
}

interface EstimateDraft {
  meal_name: string;
  items: ItemDraft[];
  notes?: string;
  /** Lowest confidence across items — meal-level summary for the header. */
  confidence: 'low' | 'medium' | 'high';
}

let _uidCounter = 0;
function nextUid(): string {
  _uidCounter += 1;
  return `i-${Date.now()}-${_uidCounter}`;
}

function lowestConfidence(items: ItemDraft[]): 'low' | 'medium' | 'high' {
  const rank = { low: 0, medium: 1, high: 2 };
  let lowest: 'low' | 'medium' | 'high' = 'high';
  for (const it of items) {
    if (rank[it.confidence] < rank[lowest]) lowest = it.confidence;
  }
  return items.length === 0 ? 'low' : lowest;
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
  const [estimate, setEstimate] = useState<EstimateDraft | null>(null);
  const [editedByUser, setEditedByUser] = useState(false);

  /** Live totals (sum across items) for the header card. */
  const totals = useMemo(() => {
    const items = estimate?.items ?? [];
    return items.reduce(
      (acc, it) => {
        acc.protein_g += it.protein_g;
        acc.calories += it.calories;
        acc.carbs_g += it.carbs_g;
        acc.fat_g += it.fat_g;
        return acc;
      },
      { protein_g: 0, calories: 0, carbs_g: 0, fat_g: 0 },
    );
  }, [estimate?.items]);

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

      // Sync credit balance UI whether the photo was a meal or not.
      if (user) await patchUser({ credit_balance: data.credit_balance });

      if (data.estimate.error === 'not_a_meal') {
        const conf = data.estimate.confidence;
        const msg =
          conf === 'high'
            ? "We couldn't find any food or drink in this photo — 1 credit used."
            : conf === 'medium'
              ? "Not sure what's in this photo — 1 credit used. Try a clearer shot."
              : 'No food found — 1 credit used. Try framing the item more directly.';
        toast.info(msg, 5000);
        setPhase('idle');
        setLocalUri(null);
        return;
      }

      // Convert API items into local drafts with stable uids.
      const items: ItemDraft[] = data.estimate.items.map((it) => ({
        uid: nextUid(),
        item_name: it.item_name,
        estimated_portion: it.estimated_portion,
        protein_g: it.protein_g,
        calories: it.calories,
        carbs_g: it.carbs_g,
        fat_g: it.fat_g,
        confidence: it.confidence,
      }));

      setEstimate({
        meal_name: data.estimate.meal_name,
        items,
        notes: data.estimate.notes,
        confidence: lowestConfidence(items),
      });
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
    if (!estimate || estimate.items.length === 0) {
      toast.error('Add at least one item before saving.');
      return;
    }
    setPhase('saving');
    try {
      const result = await api.saveMeal({
        meal_name: estimate.meal_name,
        items: estimate.items.map((it) => ({
          item_name: it.item_name,
          estimated_portion: it.estimated_portion,
          protein_g: it.protein_g,
          calories: it.calories,
          carbs_g: it.carbs_g,
          fat_g: it.fat_g,
          confidence: it.confidence,
        })),
        ai_notes: estimate.notes,
        photo_path: photoPath ?? undefined,
        raw_ai_response: rawAi,
        source: 'photo',
        edited_by_user: editedByUser,
      });
      toast.success(result.message);
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

  function patchMealName(name: string) {
    setEstimate((prev) => (prev ? { ...prev, meal_name: name } : prev));
    setEditedByUser(true);
  }

  function patchItem(uid: string, patch: Partial<ItemDraft>) {
    setEstimate((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((it) => (it.uid === uid ? { ...it, ...patch } : it));
      return { ...prev, items, confidence: lowestConfidence(items) };
    });
    setEditedByUser(true);
  }

  function removeItem(uid: string) {
    setEstimate((prev) => {
      if (!prev) return prev;
      const items = prev.items.filter((it) => it.uid !== uid);
      return { ...prev, items, confidence: lowestConfidence(items) };
    });
    setEditedByUser(true);
  }

  function addItem() {
    setEstimate((prev) => {
      if (!prev) return prev;
      const items = [
        ...prev.items,
        {
          uid: nextUid(),
          item_name: '',
          estimated_portion: '',
          protein_g: 0,
          calories: 0,
          carbs_g: 0,
          fat_g: 0,
          confidence: 'medium' as const,
        },
      ];
      return { ...prev, items, confidence: lowestConfidence(items) };
    });
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
              We&apos;ll identify each item and estimate macros. Costs 1 credit per scan.
            </Text>
          </View>
          <View style={styles.idleActions}>
            <Button label="Take photo" variant="amber" onPress={() => pickAndAnalyze('camera')} />
            <Button label="Pick from gallery" variant="ghost" onPress={() => pickAndAnalyze('gallery')} />
          </View>
        </View>
      )}

      {phase === 'analyzing' && (
        <View style={styles.center}>
          {localUri && <Image source={{ uri: localUri }} style={styles.previewBig} />}
          <ActivityIndicator size="large" color={colors.forest} style={{ marginTop: spacing.lg }} />
          <Text style={styles.analyzeText}>Looking at your plate…</Text>
          <Text style={styles.analyzeSub}>Identifying items, estimating macros.</Text>
        </View>
      )}

      {phase === 'reviewing' && estimate && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView contentContainerStyle={styles.reviewScroll} keyboardShouldPersistTaps="handled">
            {localUri && <Image source={{ uri: localUri }} style={styles.previewSmall} />}

            {/* TOTALS HEADER — recomputes as items change */}
            <View style={styles.resultCard}>
              <Text style={styles.resultEyebrow}>
                AI estimate · {estimate.confidence} · {estimate.items.length} {estimate.items.length === 1 ? 'item' : 'items'}
              </Text>
              <Text style={styles.resultProtein}>
                {Math.round(totals.protein_g)}
                <Text style={styles.resultUnit}> g protein</Text>
              </Text>
              <View style={styles.macroRow}>
                <Macro label="Calories" value={`${Math.round(totals.calories)}`} unit="kcal" />
                <Macro label="Carbs" value={`${Math.round(totals.carbs_g)}`} unit="g" />
                <Macro label="Fat" value={`${Math.round(totals.fat_g)}`} unit="g" />
              </View>
            </View>

            {/* MEAL NAME */}
            <View style={styles.editGroup}>
              <Text style={styles.label}>Meal name</Text>
              <TextInput
                style={styles.input}
                value={estimate.meal_name}
                onChangeText={patchMealName}
                placeholderTextColor={colors.muted}
              />
            </View>

            {/* ITEMS */}
            <Text style={[styles.label, { marginTop: spacing.sm }]}>Items</Text>
            {estimate.items.map((it, idx) => (
              <ItemCard
                key={it.uid}
                item={it}
                index={idx + 1}
                onPatch={(patch) => patchItem(it.uid, patch)}
                onRemove={() => removeItem(it.uid)}
                canRemove={estimate.items.length > 1}
              />
            ))}

            <Pressable style={styles.addBtn} onPress={addItem}>
              <Feather name="plus" size={16} color={colors.forest} />
              <Text style={styles.addBtnText}>Add another item</Text>
            </Pressable>

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

function ItemCard({
  item,
  index,
  onPatch,
  onRemove,
  canRemove,
}: {
  item: ItemDraft;
  index: number;
  onPatch: (patch: Partial<ItemDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const confColor =
    item.confidence === 'high'
      ? colors.sage
      : item.confidence === 'medium'
        ? colors.amber
        : colors.muted;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          <Text style={styles.itemNumber}>{index}</Text>
          <View style={[styles.confDot, { backgroundColor: confColor }]} />
        </View>
        {canRemove && (
          <Pressable onPress={onRemove} hitSlop={8} style={styles.removeBtn}>
            <Feather name="x" size={16} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <TextInput
        style={styles.itemNameInput}
        value={item.item_name}
        onChangeText={(t) => onPatch({ item_name: t })}
        placeholder="Item name"
        placeholderTextColor={colors.muted}
      />

      <TextInput
        style={styles.itemPortionInput}
        value={item.estimated_portion ?? ''}
        onChangeText={(t) => onPatch({ estimated_portion: t })}
        placeholder="Portion (e.g. 2 slices, 1 cup)"
        placeholderTextColor={colors.muted}
      />

      <View style={styles.itemMacroGrid}>
        <View style={styles.itemMacroCell}>
          <Text style={styles.itemMacroLabel}>Protein (g)</Text>
          <TextInput
            style={styles.itemMacroInput}
            keyboardType="numeric"
            value={`${item.protein_g}`}
            onChangeText={(t) => onPatch({ protein_g: Number(t) || 0 })}
          />
        </View>
        <View style={styles.itemMacroCell}>
          <Text style={styles.itemMacroLabel}>Calories</Text>
          <TextInput
            style={styles.itemMacroInput}
            keyboardType="numeric"
            value={`${item.calories}`}
            onChangeText={(t) => onPatch({ calories: Number(t) || 0 })}
          />
        </View>
        <View style={styles.itemMacroCell}>
          <Text style={styles.itemMacroLabel}>Carbs (g)</Text>
          <TextInput
            style={styles.itemMacroInput}
            keyboardType="numeric"
            value={`${item.carbs_g}`}
            onChangeText={(t) => onPatch({ carbs_g: Number(t) || 0 })}
          />
        </View>
        <View style={styles.itemMacroCell}>
          <Text style={styles.itemMacroLabel}>Fat (g)</Text>
          <TextInput
            style={styles.itemMacroInput}
            keyboardType="numeric"
            value={`${item.fat_g}`}
            onChangeText={(t) => onPatch({ fat_g: Number(t) || 0 })}
          />
        </View>
      </View>
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
  macroValue: {
    ...typography.bodyMedium,
    color: colors.cream,
    fontFamily: fontFamily.serif,
    fontSize: 18,
  },
  macroUnit: { ...typography.small, color: colors.cream, opacity: 0.6 },

  editGroup: { gap: spacing.xxs },
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

  itemCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemNumber: {
    ...typography.small,
    color: colors.muted,
    fontFamily: fontFamily.serifBold,
    fontSize: 14,
  },
  confDot: {
    width: 6,
    height: 6,
    borderRadius: radius.circle,
  },
  removeBtn: {
    padding: 2,
  },
  itemNameInput: {
    ...typography.bodyMedium,
    backgroundColor: 'transparent',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    paddingVertical: spacing.xs,
    color: colors.forest,
    fontFamily: fontFamily.serif,
    fontSize: 17,
  },
  itemPortionInput: {
    ...typography.small,
    backgroundColor: 'transparent',
    paddingVertical: spacing.xxs,
    color: colors.muted,
    fontStyle: 'italic',
  },
  itemMacroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  itemMacroCell: {
    flexBasis: '46%',
    flexGrow: 1,
    gap: 2,
  },
  itemMacroLabel: {
    ...typography.eyebrow,
    color: colors.muted,
    fontSize: 10,
  },
  itemMacroInput: {
    ...typography.body,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.charcoal,
    minHeight: 38,
    fontSize: 14,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    borderRadius: radius.md,
  },
  addBtnText: {
    ...typography.bodyMedium,
    color: colors.forest,
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
