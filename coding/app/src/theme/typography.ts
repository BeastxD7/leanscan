/**
 * LeanScan typography tokens.
 * Fraunces for headlines (serif, editorial), Manrope for body (sans, clean).
 * Fonts are loaded in app/_layout.tsx via @expo-google-fonts.
 */
import { Platform } from 'react-native';

export const fontFamily = {
  serif: 'Fraunces_500Medium',
  serifBold: 'Fraunces_600SemiBold',
  serifItalic: 'Fraunces_500Medium_Italic',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemibold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
} as const;

const baseLetter = Platform.OS === 'ios' ? -0.2 : 0;

export const typography = {
  display: {
    fontFamily: fontFamily.serif,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: baseLetter - 0.8,
  },
  h1: {
    fontFamily: fontFamily.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: baseLetter - 0.5,
  },
  h2: {
    fontFamily: fontFamily.serif,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: baseLetter - 0.3,
  },
  h3: {
    fontFamily: fontFamily.serif,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: baseLetter - 0.2,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    lineHeight: 26,
  },
  small: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
  },
  eyebrow: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 15,
    lineHeight: 20,
  },
} as const;

export type TypographyVariant = keyof typeof typography;
