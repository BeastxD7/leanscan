/**
 * Tap-to-select option list for single-select onboarding questions.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface OptionListProps<T extends string> {
  value: T | null;
  options: Option<T>[];
  onChange: (value: T) => void;
}

export function OptionList<T extends string>({ value, options, onChange }: OptionListProps<T>) {
  return (
    <View style={styles.list}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={({ pressed }) => [
              styles.opt,
              selected && styles.optSelected,
              pressed && !selected && styles.optPressed,
            ]}
          >
            <View style={styles.optTextWrap}>
              <Text style={[styles.optLabel, selected && styles.optLabelSelected]}>
                {opt.label}
              </Text>
              {opt.hint ? (
                <Text style={[styles.optHint, selected && styles.optHintSelected]}>
                  {opt.hint}
                </Text>
              ) : null}
            </View>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  optSelected: {
    backgroundColor: colors.creamDark,
    borderColor: colors.forest,
  },
  optPressed: { opacity: 0.7 },
  optTextWrap: { flex: 1, gap: spacing.xxs },
  optLabel: { ...typography.bodyMedium, color: colors.charcoal },
  optLabelSelected: { color: colors.forest },
  optHint: { ...typography.small, color: colors.muted },
  optHintSelected: { color: colors.muted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.circle,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.forest },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.circle,
    backgroundColor: colors.amber,
  },
});
