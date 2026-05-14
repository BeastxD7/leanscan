import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTintColor: colors.forest,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}
