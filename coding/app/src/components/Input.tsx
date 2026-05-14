/**
 * Branded text input + button + form error display.
 * Used in the auth + onboarding screens.
 */
import { forwardRef } from 'react';
import {
  TextInput,
  type TextInputProps,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type GestureResponderEvent,
} from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...props }, ref) => {
  return (
    <View style={styles.field}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.muted}
        style={[styles.input, error ? styles.inputError : undefined, style]}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});
Input.displayName = 'Input';

interface ButtonProps {
  label: string;
  onPress: (e: GestureResponderEvent) => void;
  variant?: 'primary' | 'ghost' | 'amber';
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && styles.btnPrimary,
        variant === 'ghost' && styles.btnGhost,
        variant === 'amber' && styles.btnAmber,
        isDisabled && styles.btnDisabled,
        pressed && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.forest : colors.cream} />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'ghost' && styles.btnTextGhost,
            variant === 'amber' && styles.btnTextAmber,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <View style={styles.formError}>
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
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
    color: colors.charcoal,
    minHeight: 48,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xxs,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnPrimary: { backgroundColor: colors.forest },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  btnAmber: { backgroundColor: colors.amber },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.75 },
  btnText: { ...typography.button, color: colors.cream },
  btnTextGhost: { color: colors.forest },
  btnTextAmber: { color: colors.forestDeep },
  formError: {
    backgroundColor: colors.errorBg,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  formErrorText: {
    ...typography.small,
    color: colors.error,
  },
});
