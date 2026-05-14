import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';

import { colors } from '../src/theme';
import { useAuthStore } from '../src/state/auth';
import { Toaster } from '../src/components/Toaster';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 60_000 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Pull persisted tokens out of SecureStore on first launch.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const ready = (fontsLoaded || fontError) && isHydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.cream }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthGate />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.cream },
            animation: 'slide_from_right',
          }}
        />
        <Toaster />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Navigation guard: routes the user to the correct section based on auth state.
 *   - No token       → welcome / auth screens
 *   - Token, no onboarding → onboarding flow
 *   - Fully set up   → app
 */
function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;

    const inAuth = segments[0] === '(auth)';
    const inApp = segments[0] === '(app)';
    const inOnboarding = segments[0] === 'onboarding';
    const onWelcome = segments.length === 0 || segments[0] === undefined;

    if (!accessToken) {
      // Logged out — allow welcome + (auth) screens, redirect away from anything else.
      if (inApp || inOnboarding) router.replace('/');
      return;
    }

    // Logged in.
    if (user && !user.onboarding_completed) {
      if (!inOnboarding) router.replace('/onboarding/goal');
      return;
    }

    if (user?.onboarding_completed) {
      // Also redirect from onboarding → home once the flag flips.
      if (inAuth || onWelcome || inOnboarding) router.replace('/(app)/home');
    }
  }, [accessToken, user, segments, isHydrated, router]);

  return null;
}
