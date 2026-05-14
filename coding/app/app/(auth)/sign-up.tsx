/**
 * Sign-up form.
 * Collects everything we need to skip the "Identity" step in onboarding:
 *   email, password, username, first name, last name, date of birth, sex.
 * All identity fields except email + password are optional — but they're surfaced
 * right here so users don't have to bounce into Settings later.
 */
import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type TextInput as RNTextInput,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Button, FormError } from '../../src/components/Input';
import { DatePickerField } from '../../src/components/DatePickerField';
import { colors, typography, spacing, radius } from '../../src/theme';
import { api, ApiError } from '../../src/lib/api';
import { useAuthStore } from '../../src/state/auth';
import { toast } from '../../src/state/toast';

type SexT = 'male' | 'female' | 'other' | 'prefer_not_to_say';
const SEX_OPTS: { value: SexT; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export default function SignUp() {
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState<SexT | null>(null);

  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstNameRef = useRef<RNTextInput>(null);
  const lastNameRef = useRef<RNTextInput>(null);
  const usernameRef = useRef<RNTextInput>(null);
  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);

  function setErr(k: string, msg: string | null) {
    setErrors((prev) => ({ ...prev, [k]: msg }));
  }

  function validate(): boolean {
    let ok = true;
    const next: Record<string, string | null> = {};

    // First name is required so the dashboard greeting works for every account.
    if (!firstName.trim()) {
      next.firstName = 'First name is required.';
      ok = false;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = 'Enter a valid email address.';
      ok = false;
    }
    if (password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
      ok = false;
    }
    if (username && (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username))) {
      next.username = '3+ chars, letters / numbers / _ / - only.';
      ok = false;
    }
    if (dob) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        next.dob = 'Format: YYYY-MM-DD.';
        ok = false;
      } else {
        const d = new Date(dob);
        const now = new Date();
        const minAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
        if (isNaN(d.getTime()) || d > minAge) {
          next.dob = 'You must be 13 or older.';
          ok = false;
        }
      }
    }

    setErrors(next);
    return ok;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        ...(username ? { username: username.trim().toLowerCase() } : {}),
        ...(firstName ? { first_name: firstName.trim() } : {}),
        ...(lastName ? { last_name: lastName.trim() } : {}),
        ...(dob ? { date_of_birth: dob } : {}),
        ...(sex ? { sex } : {}),
      };
      const result = await api.signup(payload);
      if (result.data) {
        await setSession(result.data);
        toast.success(result.message);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'email_in_use') {
          setErr('email', 'An account with this email already exists.');
        } else if (err.code === 'username_taken') {
          setErr('username', 'That username is taken — try another.');
        } else if (err.code === 'validation_error') {
          setFormError('Please check the fields above and try again.');
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
            <Text style={styles.eyebrow}>Create account</Text>
            <Text style={styles.title}>Let's get to know you.</Text>
            <Text style={styles.lede}>
              Fields marked * are required. The rest you can skip and edit in Settings.
            </Text>
          </View>

          <FormError message={formError} />

          {/* Step 1: who you are */}
          <SectionHeader title="Your name" />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Input
                ref={firstNameRef}
                label="First name *"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                value={firstName}
                onChangeText={(t) => {
                  setFirstName(t);
                  if (errors.firstName) setErr('firstName', null);
                }}
                error={errors.firstName}
                editable={!submitting}
                placeholder="Shashank"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                ref={lastNameRef}
                label="Last name"
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                value={lastName}
                onChangeText={setLastName}
                editable={!submitting}
                placeholder="Devadiga"
              />
            </View>
          </View>

          {/* Step 2: pick a handle */}
          <SectionHeader title="Pick a username" />
          <Input
            ref={usernameRef}
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={username}
            onChangeText={(t) => {
              setUsername(t);
              if (errors.username) setErr('username', null);
            }}
            error={errors.username}
            editable={!submitting}
            placeholder="shashank"
          />

          {/* Step 3: how you sign in */}
          <SectionHeader title="Sign-in details" />
          <Input
            ref={emailRef}
            label="Email *"
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
              if (errors.email) setErr('email', null);
            }}
            error={errors.email}
            editable={!submitting}
            placeholder="you@example.com"
          />
          <Input
            ref={passwordRef}
            label="Password *"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (errors.password) setErr('password', null);
            }}
            error={errors.password}
            editable={!submitting}
            placeholder="At least 8 characters"
          />

          {/* Step 4: optional bio */}
          <SectionHeader title="A bit more (optional)" />
          <DatePickerField
            label="Date of birth"
            value={dob}
            onChange={(v) => {
              setDob(v);
              if (errors.dob) setErr('dob', null);
            }}
            error={errors.dob}
            placeholder="Tap to pick"
          />

          <Text style={styles.subLabel}>Sex</Text>
          <View style={styles.chipsRow}>
            {SEX_OPTS.map((opt) => {
              const sel = opt.value === sex;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setSex(sel ? null : opt.value)}
                  style={[styles.chip, sel && styles.chipSelected]}
                  disabled={submitting}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextSelected]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Create account" onPress={handleSubmit} loading={submitting} />
          <View style={styles.altRow}>
            <Text style={styles.altText}>Already have one?</Text>
            <Link href="/(auth)/sign-in" replace>
              <Text style={styles.altLinkText}>Sign in</Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.md },
  eyebrow: { ...typography.eyebrow, color: colors.amber, marginBottom: spacing.xs },
  title: { ...typography.h1, color: colors.forest, marginBottom: spacing.sm },
  lede: { ...typography.body, color: colors.muted },
  sectionHeader: { marginTop: spacing.md, marginBottom: spacing.xs },
  sectionTitle: { ...typography.eyebrow, color: colors.amber },
  row2: { flexDirection: 'row', gap: spacing.sm },
  subLabel: { ...typography.eyebrow, color: colors.muted, marginBottom: spacing.xs },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
  },
  chipSelected: { backgroundColor: colors.creamDark, borderColor: colors.forest },
  chipText: { ...typography.body, color: colors.charcoal },
  chipTextSelected: { color: colors.forest, fontFamily: 'Manrope_600SemiBold' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.cream,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  altRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, gap: spacing.xs },
  altText: { ...typography.body, color: colors.muted },
  altLinkText: { ...typography.bodyMedium, color: colors.forest },
});
