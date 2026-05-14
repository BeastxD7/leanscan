import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  type TextInput as RNTextInput,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button, FormError } from '../../src/components/Input';
import { colors, typography, spacing } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { useAuthStore } from '../../src/state/auth';
import { toast } from '../../src/state/toast';

export default function SignIn() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordRef = useRef<RNTextInput>(null);

  function validate(): boolean {
    setEmailError(null);
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return false;
    }
    if (!password) return false;
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await api.login({ email: email.trim().toLowerCase(), password });
      if (result.data) {
        await setSession(result.data);
        toast.success(result.message);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'invalid_credentials') {
          setFormError('Email or password is incorrect.');
        } else if (err.code === 'account_suspended') {
          setFormError('This account has been suspended. Contact support.');
        } else if (err.code === 'rate_limited') {
          setFormError('Too many attempts. Wait a few minutes and try again.');
        } else if (err.code === 'network_error') {
          setFormError('Network error. Check your connection and try again.');
        } else {
          setFormError(err.message || 'Something went wrong.');
        }
      } else {
        setFormError('Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
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
            <Text style={styles.eyebrow}>Sign in</Text>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.lede}>Pick up where you left off.</Text>
          </View>

          <View style={styles.form}>
            <FormError message={formError} />
            <Input
              label="Email"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (emailError) setEmailError(null);
              }}
              error={emailError}
              editable={!submitting}
              placeholder="you@example.com"
            />
            <Input
              ref={passwordRef}
              label="Password"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              value={password}
              onChangeText={setPassword}
              editable={!submitting}
              placeholder="Your password"
            />
            <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>Forgot password?</Text>
            </Link>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Sign in" onPress={handleSubmit} loading={submitting} />
          <View style={styles.altRow}>
            <Text style={styles.altText}>New here?</Text>
            <Link href="/(auth)/sign-up" replace>
              <Text style={styles.altLinkText}>Create account</Text>
            </Link>
          </View>
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
  header: { marginBottom: spacing.lg },
  eyebrow: { ...typography.eyebrow, color: colors.amber, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.forest, marginBottom: spacing.sm },
  lede: { ...typography.body, color: colors.muted },
  form: {},
  forgotLink: { alignSelf: 'flex-end', marginTop: -spacing.xs },
  forgotLinkText: { ...typography.small, color: colors.forest },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  altText: { ...typography.body, color: colors.muted },
  altLinkText: { ...typography.bodyMedium, color: colors.forest },
});
