import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button, FormError } from '../../src/components/Input';
import { colors, typography, spacing } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(null);
    setFormError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'network_error') {
        setFormError('Network error. Try again.');
      } else {
        setFormError('Something went wrong. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.successContainer}>
          <View>
            <Text style={styles.eyebrow}>Check your inbox</Text>
            <Text style={styles.title}>Email sent.</Text>
            <Text style={styles.lede}>
              If an account exists for {email}, you'll get a reset link within a minute. The link
              expires in an hour.
            </Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Button label="Back to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
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
            <Text style={styles.eyebrow}>Forgot password</Text>
            <Text style={styles.title}>No problem.</Text>
            <Text style={styles.lede}>Enter your email and we'll send a reset link.</Text>
          </View>

          <View>
            <FormError message={formError} />
            <Input
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError(null);
              }}
              error={emailError}
              editable={!submitting}
              placeholder="you@example.com"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Send reset link" onPress={handleSubmit} loading={submitting} />
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
