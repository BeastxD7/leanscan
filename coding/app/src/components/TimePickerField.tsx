/**
 * Native time picker wrapped to match the rest of the form components.
 *
 * Android: tap the field → system native clock dialog opens, closes on Done.
 * iOS:     tap the field → spinner-wheel inside a fade-in modal sheet.
 *
 * Value in/out is a plain "HH:MM" string (24-hour) so it round-trips cleanly
 * with the API (which also stores HH:MM in the Postgres TIME column).
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
  /** Time as "HH:MM" (24-hour). Empty string = unset; falls back to 08:00. */
  value: string;
  onChange: (hhmm: string) => void;
  error?: string | null;
  placeholder?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function fromHHMM(v: string): Date {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  const d = new Date();
  d.setSeconds(0, 0);
  if (m) {
    d.setHours(Number(m[1]));
    d.setMinutes(Number(m[2]));
  } else {
    d.setHours(8);
    d.setMinutes(0);
  }
  return d;
}

function toHHMM(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pretty(v: string): string {
  if (!/^\d{2}:\d{2}$/.test(v)) return v;
  const d = fromHHMM(v);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function TimePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select time',
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const currentDate = fromHHMM(value);

  function handleChange(_e: DateTimePickerEvent, selectedDate?: Date) {
    // Android closes the picker automatically; iOS stays open until "Done".
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (selectedDate) onChange(toHHMM(selectedDate));
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

      {/* Android: inline native dialog */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={currentDate}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={handleChange}
        />
      )}

      {/* iOS: wheel picker inside a modal sheet */}
      {Platform.OS === 'ios' && (
        <Modal transparent visible={showPicker} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{label ?? 'Pick a time'}</Text>
                <Pressable onPress={() => setShowPicker(false)} hitSlop={8}>
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={currentDate}
                mode="time"
                display="spinner"
                onChange={handleChange}
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
