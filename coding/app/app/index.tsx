import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../src/theme';
import { api, API_URL, ApiError } from '../src/lib/api';

export default function Welcome() {
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [healthDetail, setHealthDetail] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.health();
        if (!cancelled) {
          setHealthStatus('ok');
          setHealthDetail(`v${data.version} · up ${data.uptime_s}s`);
        }
      } catch (err) {
        if (!cancelled) {
          setHealthStatus('error');
          const msg = err instanceof ApiError ? err.message : (err as Error).message;
          setHealthDetail(msg);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.brandRow}>
          <View style={styles.dot} />
          <Text style={styles.brand}>LeanScan</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.headline}>
            Snap your meal.{'\n'}
            <Text style={styles.headlineAccent}>Track your day.</Text>
          </Text>
          <Text style={styles.lede}>
            The all-in-one health tracker that puts protein first.
            Meals, weight, workouts — one tap each.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/sign-up')}
          >
            <Text style={styles.btnPrimaryText}>Create Account</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.btnGhost, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.btnGhostText}>I already have an account</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <ApiStatus status={healthStatus} detail={healthDetail} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function ApiStatus({
  status,
  detail,
}: {
  status: 'checking' | 'ok' | 'error';
  detail: string;
}) {
  if (status === 'checking') {
    return (
      <View style={styles.statusRow}>
        <ActivityIndicator size="small" color={colors.muted} />
        <Text style={styles.statusText}>Connecting to {prettyHost(API_URL)}…</Text>
      </View>
    );
  }
  if (status === 'ok') {
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusPip, { backgroundColor: colors.success }]} />
        <Text style={styles.statusText}>
          API reachable · {prettyHost(API_URL)} · {detail}
        </Text>
      </View>
    );
  }
  return (
    <View style={styles.statusRow}>
      <View style={[styles.statusPip, { backgroundColor: colors.error }]} />
      <Text style={[styles.statusText, { color: colors.error }]}>
        Cannot reach {prettyHost(API_URL)} — {detail}
      </Text>
    </View>
  );
}

function prettyHost(url: string): string {
  try {
    const u = new URL(url);
    return u.host;
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.circle,
    backgroundColor: colors.amber,
  },
  brand: {
    ...typography.h3,
    color: colors.forest,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
  },
  headline: {
    ...typography.display,
    color: colors.forest,
  },
  headlineAccent: {
    ...typography.display,
    color: colors.amber,
    fontFamily: 'Fraunces_500Medium_Italic',
  },
  lede: {
    ...typography.bodyLarge,
    color: colors.charcoal,
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  btnPrimary: {
    backgroundColor: colors.forest,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  btnPrimaryText: {
    ...typography.button,
    color: colors.cream,
  },
  btnGhost: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  btnGhostText: {
    ...typography.button,
    color: colors.forest,
  },
  pressed: {
    opacity: 0.75,
  },
  footer: {
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusPip: {
    width: 6,
    height: 6,
    borderRadius: radius.circle,
  },
  statusText: {
    ...typography.small,
    color: colors.muted,
  },
});
