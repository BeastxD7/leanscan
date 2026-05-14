/**
 * Quick weigh-in sheet — bottom modal with a single numeric input and Save.
 * Mirrors ConfirmSheet styling so it feels native to the rest of the app.
 *
 * Saves by PATCHing /v1/profile with the new weight_kg, then patches the auth
 * store so the home screen's weight-progress strip updates immediately.
 *
 * This is the minimal v1 — overwrites the user's current weight in place. No
 * history table, no trend chart. Adding those is Tier 3 work.
 */
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';
import { api, ApiError } from '../lib/api';
import { useAuthStore } from '../state/auth';
import { toast } from '../state/toast';

interface Props {
  visible: boolean;
  /** Pre-fill value, usually the user's last recorded weight. */
  initialKg: number | null;
  onClose: () => void;
}

export function WeighInSheet({ visible, initialKg, onClose }: Props) {
  const patchUser = useAuthStore((s) => s.patchUser);
  const [value, setValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset the input every time the sheet opens — pre-fills the user's last
  // weight so they only have to type the delta, not the whole number.
  useEffect(() => {
    if (visible) {
      setValue(initialKg != null ? String(initialKg) : '');
      setError(null);
      setSaving(false);
    }
  }, [visible, initialKg]);

  async function handleSave() {
    setError(null);
    const n = Number(value);
    if (!Number.isFinite(n) || n < 30 || n > 300) {
      setError('Enter a weight in kg (30–300).');
      return;
    }
    setSaving(true);
    try {
      const result = await api.patchProfile({ weight_kg: n });
      const u = result.data as { weight_kg?: number | null; protein_target_g?: number | null; calorie_target_kcal?: number | null; tdee_kcal?: number | null };
      // Patch only the fields that actually changed downstream. The server
      // recomputes protein + calorie targets when weight changes, so we sync
      // those too so the home ring + calorie strip update instantly.
      await patchUser({
        weight_kg: u.weight_kg ?? n,
        protein_target_g: u.protein_target_g ?? null,
        calorie_target_kcal: u.calorie_target_kcal ?? null,
        tdee_kcal: u.tdee_kcal ?? null,
      });
      toast.success('Weight saved.');
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={saving ? undefined : onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.scrim} onPress={saving ? undefined : onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbWrap}
          pointerEvents="box-none"
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <Text style={styles.title}>Today&apos;s weight</Text>
            <Text style={styles.body}>Logged in kilograms. Targets update automatically.</Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={value}
                onChangeText={(t) => {
                  setValue(t);
                  if (error) setError(null);
                }}
                placeholder="80.5"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
                editable={!saving}
                autoFocus
              />
              <Text style={styles.unit}>kg</Text>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.row}>
              <Pressable
                onPress={onClose}
                disabled={saving}
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.btnPressed]}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                style={({ pressed }) => [styles.btn, styles.btnSave, pressed && styles.btnPressed, saving && { opacity: 0.6 }]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.cream} />
                ) : (
                  <Text style={styles.btnSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(17, 39, 32, 0.45)',
    justifyContent: 'flex-end',
  },
  kbWrap: { width: '100%' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.forest,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  body: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.charcoal,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 28,
  },
  inputError: { color: colors.error },
  unit: { ...typography.bodyMedium, color: colors.muted },
  errorText: { ...typography.small, color: colors.error, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnCancel: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  btnSave: { backgroundColor: colors.forest },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  btnCancelText: { ...typography.button, color: colors.charcoal, fontSize: 15 },
  btnSaveText: { ...typography.button, color: colors.cream, fontSize: 15 },
});
