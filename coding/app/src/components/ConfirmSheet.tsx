/**
 * Branded confirmation sheet — slides up from the bottom, replaces the native
 * `Alert.alert` for destructive / important confirmations.
 *
 * Why custom: the platform alert is generic, ignores the LeanScan palette, and
 * doesn't let us use Fraunces for the title. This component keeps the whole UI
 * cohesive: cream background, forest title, amber accent, error tint for the
 * destructive action.
 *
 * Usage:
 *   <ConfirmSheet
 *     visible={open}
 *     title="Delete this meal?"
 *     body="You can re-log it later."
 *     confirmLabel="Delete"
 *     destructive
 *     onConfirm={() => deleteMeal.mutate(id)}
 *     onCancel={() => setOpen(false)}
 *   />
 */
import { Modal, Pressable, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

interface Props {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm action in the error palette instead of the forest one. */
  destructive?: boolean;
  /** Shows a spinner inside the confirm button and disables both buttons. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Tap-outside-to-close scrim */}
      <Pressable style={styles.scrim} onPress={loading ? undefined : onCancel}>
        {/* Stop propagation so taps inside the sheet don't close it */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />

          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}

          <View style={styles.row}>
            <Pressable
              onPress={onCancel}
              disabled={loading}
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnCancelText}>{cancelLabel}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.btn,
                destructive ? styles.btnDestructive : styles.btnPrimary,
                pressed && styles.btnPressed,
                loading && styles.btnDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color={destructive ? colors.error : colors.cream} />
              ) : (
                <Text
                  style={[
                    styles.btnConfirmText,
                    destructive && styles.btnDestructiveText,
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
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
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    // Subtle elevation so the sheet feels lifted off the scrim
    shadowColor: colors.forestDeep,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 16,
    elevation: 8,
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
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
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
  btnPrimary: {
    backgroundColor: colors.forest,
  },
  btnDestructive: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.6 },
  btnCancelText: { ...typography.button, color: colors.charcoal, fontSize: 15 },
  btnConfirmText: { ...typography.button, color: colors.cream, fontSize: 15 },
  btnDestructiveText: { color: colors.error },
});
