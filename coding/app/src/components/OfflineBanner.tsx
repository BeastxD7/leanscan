import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import { colors, spacing, radius, fontFamily } from '../theme';

/**
 * Shows a banner at the top of the screen when the device has no internet.
 *
 *   - `isConnected: false` covers airplane mode and no carrier signal.
 *   - `isInternetReachable: false` covers "connected to a wifi network with
 *     no actual internet" (captive portals, broken WiFi).
 *   - Treats `null` (unknown / not yet determined) as "online" to avoid
 *     a false-positive banner during app boot.
 *
 * Stacks below the UpdateBanner via marginTop, but in practice these almost
 * never appear together — if you're offline, EAS Update can't fetch.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const noNetwork = state.isConnected === false;
      const noInternet = state.isInternetReachable === false;
      setOffline(noNetwork || noInternet);
    });
    return unsubscribe;
  }, []);

  if (!offline) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea} pointerEvents="box-none">
      <View style={styles.banner}>
        <View style={styles.dot} />
        <Text style={styles.text}>You&apos;re offline — some features won&apos;t work</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    // Stacks below the UpdateBanner if both ever show at once.
    marginTop: 56,
    zIndex: 999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    shadowColor: '#000',
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
});
