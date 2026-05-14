/**
 * Native date picker wrapped to fit the rest of the form components.
 *
 * Android: tap the field → system native date dialog opens, closes on Done.
 * iOS: tap the field → spinner-wheel inside a fade-in modal sheet, closes on Done.
 *
 * Value in/out is a plain `YYYY-MM-DD` string so it round-trips cleanly with
 * the API and lives nicely in form state.
 */
import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { colors, typography, spacing, radius } from '../theme';

interface Props {
  label?: string;
  /** Date as YYYY-MM-DD. Empty string = unset. */
  value: string;
  onChange: (yyyyMmDd: string) => void;
  error?: string | null;
  placeholder?: string;
  /** Minimum age in years allowed; defaults to 13 to satisfy the backend rule. */
  minAge?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromYmd = (s: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

function pretty(s: string): string {
  const d = fromYmd(s);
  if (!d) return s;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
  minAge = 13,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
  const minDate = new Date(1900, 0, 1);
  const currentDate = fromYmd(value) ?? new Date(2000, 0, 1);

  function handleChange(_event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selectedDate) onChange(toYmd(selectedDate));
  }

  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        onPress={() => setShowPicker(true)}
        style={[styles.input, error ? styles.inputError : null]}
      >
        <Text style={value ? styles.text : styles.placeholder}>
          {value ? pretty(value) : placeholder}
        </Text>
      </Pressable>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Android: inline native dialog when showPicker is true */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleChange}
          maximumDate={maxDate}
          minimumDate={minDate}
        />
      )}

      {/* iOS: wheel picker inside a modal sheet */}
      {Platform.OS === 'ios' && (
        <Modal transparent visible={showPicker} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label ?? 'Pick a date'}</Text>
                <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleChange}
                maximumDate={maxDate}
                minimumDate={minDate}
                themeVariant="light"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    ...typography.eyebrow,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  text: { ...typography.body, color: colors.charcoal },
  placeholder: { ...typography.body, color: colors.muted },
  errorText: { ...typography.small, color: colors.error, marginTop: spacing.xxs },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingBottom: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  sheetTitle: { ...typography.bodyMedium, color: colors.forest },
  doneText: { ...typography.bodyMedium, color: colors.amber },
});
