/**
 * Reset-password screen.
 * Triggered by a deep link from the forgot-password email:
 *   leanscan://reset-password?token=<rawToken>
 */
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button, FormError } from '../../src/components/Input';
import { colors, typography, spacing } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { toast } from '../../src/state/toast';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === 'string' ? params.token : '';

  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!token) {
      setFormError('Missing reset token. Open the link from your email again.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    setPasswordError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await api.resetPassword({ token, new_password: newPassword });
      toast.success(result.message);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'invalid_reset_token') {
          setFormError('This reset link has expired. Request a new one.');
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.successContainer}>
          <View>
            <Text style={styles.eyebrow}>Done</Text>
            <Text style={styles.title}>Password reset.</Text>
            <Text style={styles.lede}>Sign in with your new password.</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Button label="Sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
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
            <Text style={styles.eyebrow}>Reset password</Text>
            <Text style={styles.title}>Pick a new one.</Text>
            <Text style={styles.lede}>You'll be signed in to all your devices again.</Text>
          </View>

          <View>
            <FormError message={formError} />
            <Input
              label="New password"
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (passwordError) setPasswordError(null);
              }}
              error={passwordError}
              editable={!submitting}
              placeholder="At least 8 characters"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Set new password" onPress={handleSubmit} loading={submitting} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: { marginBottom: spacing.lg },
  eyebrow: { ...typography.eyebrow, color: colors.amber, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.forest, marginBottom: spacing.sm },
  lede: { ...typography.body, color: colors.muted },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
