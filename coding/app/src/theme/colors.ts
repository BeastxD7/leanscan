/**
 * LeanScan brand colors.
 * Single source of truth — do not hardcode hex values in component styles.
 */
export const colors = {
  forest: '#1a3a2e',
  forestDeep: '#112720',
  cream: '#f5f1ea',
  creamDark: '#ebe5d6',
  paper: '#faf7f0',
  charcoal: '#2a2a2a',
  muted: '#6b6b6b',
  amber: '#c8975b',
  amberDeep: '#b88748',
  sage: '#8fa899',
  line: 'rgba(26, 58, 46, 0.12)',
  lineStrong: 'rgba(26, 58, 46, 0.24)',
  error: '#b85850',
  errorBg: 'rgba(184, 88, 80, 0.08)',
  success: '#5b8a72',
  white: '#ffffff',
} as const;

export type ColorName = keyof typeof colors;
