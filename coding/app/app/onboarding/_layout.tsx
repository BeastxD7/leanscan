import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
        gestureEnabled: false, // prevent swipe-back during onboarding
      }}
    />
  );
}
