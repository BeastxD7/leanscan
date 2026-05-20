import { useState } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

import { colors, spacing, radius, fontFamily } from '../theme';

/**
 * Shows a non-blocking banner at the top of the screen when an EAS Update
 * has been downloaded and is ready to apply.
 *
 *   - Behavior is driven by `Updates.useUpdates()`, which `expo-updates`
 *     keeps in sync automatically once an OTA update completes.
 *   - In Expo Go / dev mode / when `Updates.isEnabled` is false the hook
 *     returns all-false flags so the banner never renders.
 *   - Tapping the banner calls `Updates.reloadAsync()` which restarts the
 *     JS context with the new bundle.
 *
 * Mounted in `app/_layout.tsx` next to <Toaster /> so it floats above
 * every screen.
 */
export function UpdateBanner() {
  const { isUpdatePending } = Updates.useUpdates();
  const [applying, setApplying] = useState(false);

  if (!isUpdatePending) return null;

  async function apply() {
    if (applying) return;
    setApplying(true);
    try {
      await Updates.reloadAsync();
    } catch {
      // reloadAsync rarely throws; if it does, the user can quit + reopen
      setApplying(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} pointerEvents="box-none">
      <Pressable onPress={apply} style={styles.banner} disabled={applying}>
        <View style={styles.dot} />
        <Text style={styles.text}>
          {applying ? 'Applying…' : 'Update ready — tap to apply'}
        </Text>
        {applying && (
          <ActivityIndicator size="small" color={colors.cream} style={styles.spinner} />
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.forest,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: colors.forestDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.circle,
    backgroundColor: colors.amber,
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    color: colors.cream,
    fontFamily: fontFamily.sansSemibold,
    fontSize: 14,
  },
  spinner: {
    marginLeft: spacing.xs,
  },
});
