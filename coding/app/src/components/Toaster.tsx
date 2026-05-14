/**
 * Toaster — renders queued toasts as stacked cards at the top of the screen.
 * Each toast auto-dismisses after its durationMs (or stays sticky if 0).
 */
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToastStore, type ToastItem } from '../state/toast';
import { colors, typography, spacing, radius } from '../theme';

export function Toaster() {
  const items = useToastStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.wrap} edges={['top']}>
      {items.map((item, idx) => (
        <ToastCard key={item.id} item={item} index={idx} />
      ))}
    </SafeAreaView>
  );
}

function ToastCard({ item, index }: { item: ToastItem; index: number }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const translate = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translate, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();

    if (item.durationMs > 0) {
      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translate, {
            toValue: -40,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => dismiss(item.id));
      }, item.durationMs);
      return () => clearTimeout(t);
    }
    return;
  }, [item.id, item.durationMs, translate, opacity, dismiss]);

  const variantStyle =
    item.variant === 'success'
      ? styles.success
      : item.variant === 'error'
      ? styles.error
      : styles.info;

  return (
    <Animated.View
      style={[
        styles.card,
        variantStyle,
        { transform: [{ translateY: translate }], opacity, marginTop: index === 0 ? 0 : spacing.xs },
      ]}
    >
      <Pressable onPress={() => dismiss(item.id)} style={styles.cardInner} hitSlop={6}>
        <View style={[styles.pip, pipStyle(item.variant)]} />
        <Text style={[styles.text, textStyle(item.variant)]} numberOfLines={3}>
          {item.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function pipStyle(v: ToastItem['variant']) {
  return {
    backgroundColor:
      v === 'success' ? colors.success : v === 'error' ? colors.error : colors.amber,
  };
}

function textStyle(v: ToastItem['variant']) {
  return {
    color:
      v === 'error' ? colors.error : v === 'success' ? colors.forest : colors.charcoal,
  };
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    zIndex: 9999,
    elevation: 9999,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.paper,
    shadowColor: colors.forest,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pip: {
    width: 8,
    height: 8,
    borderRadius: radius.circle,
  },
  text: {
    ...typography.bodyMedium,
    flex: 1,
  },
  success: { borderColor: 'rgba(91, 138, 114, 0.4)' },
  error: { borderColor: 'rgba(184, 88, 80, 0.4)' },
  info: { borderColor: colors.line },
});
