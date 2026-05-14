/**
 * Meal detail screen — full photo, macros, notes, delete action.
 * Route: /(app)/meal/<mealId>
 */
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { colors, typography, spacing, radius } from '../../../src/theme';
import { Button } from '../../../src/components/Input';
import { api, API_URL, ApiError, type MealRecord } from '../../../src/lib/api';
import { useAuthStore } from '../../../src/state/auth';
import { toast } from '../../../src/state/toast';

export default function MealDetail() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const mealId = typeof params.id === 'string' ? params.id : '';
  const accessToken = useAuthStore((s) => s.accessToken);

  // Try cache first, then fetch fresh
  const detail = useQuery({
    queryKey: ['meal', mealId],
    queryFn: async () => {
      const res = await api.listMeals();
      const found = res.meals.find((m) => m.id === mealId);
      return found ?? null;
    },
    enabled: !!mealId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteMeal(mealId),
    onSuccess: (result) => {
      toast.success(result.message);
      qc.invalidateQueries({ queryKey: ['meals'] });
      router.back();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not delete meal.';
      toast.error(msg);
    },
  });

  function confirmDelete() {
    Alert.alert('Delete this meal?', 'You can re-log it later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  }

  if (detail.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.forest} />
        </View>
      </SafeAreaView>
    );
  }

  if (!detail.data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.close}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Meal</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.center}>
          <Text style={styles.bodyText}>Meal not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const m: MealRecord = detail.data;
  const time = new Date(m.logged_at).toLocaleString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.close}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Meal</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {m.photo_path && accessToken ? (
          <Image
            source={{
              uri: `${API_URL}/v1/meals/${m.id}/photo?token=${encodeURIComponent(accessToken)}`,
            }}
            style={styles.bigPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bigPhoto, styles.photoFallback]}>
            <Text style={styles.photoFallbackIcon}>✎</Text>
            <Text style={styles.photoFallbackText}>Manual entry — no photo</Text>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.mealName}>{m.meal_name}</Text>
          <Text style={styles.timeText}>{time}</Text>
          {m.estimated_portion ? (
            <Text style={styles.portionText}>{m.estimated_portion}</Text>
          ) : null}
        </View>

        <View style={styles.proteinCard}>
          <Text style={styles.proteinEyebrow}>Protein</Text>
          <Text style={styles.proteinValue}>
            {Math.round(m.protein_g)}
            <Text style={styles.proteinUnit}> g</Text>
          </Text>
        </View>

        <View style={styles.macroRow}>
          <Macro label="Calories" value={`${m.calories ?? '—'}`} unit="kcal" />
          <Macro label="Carbs" value={m.carbs_g != null ? `${Math.round(m.carbs_g)}` : '—'} unit="g" />
          <Macro label="Fat" value={m.fat_g != null ? `${Math.round(m.fat_g)}` : '—'} unit="g" />
        </View>

        <View style={styles.metaCard}>
          <MetaRow label="Source" value={prettySource(m.source)} />
          {m.confidence ? <MetaRow label="AI confidence" value={m.confidence} /> : null}
          {m.edited_by_user ? <MetaRow label="Status" value="Edited by you" /> : null}
        </View>

        {m.ai_notes ? <Text style={styles.aiNotes}>{m.ai_notes}</Text> : null}

        <View style={styles.danger}>
          <Button
            label={deleteMutation.isPending ? 'Deleting…' : 'Delete meal'}
            variant="ghost"
            onPress={confirmDelete}
            loading={deleteMutation.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Macro({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View style={styles.macroCol}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {value}
        <Text style={styles.macroUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function prettySource(source: MealRecord['source']) {
  switch (source) {
    case 'photo': return 'Photo scan';
    case 'manual': return 'Manual entry';
    case 'quick_add': return 'Quick add';
    default: return source;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  close: { ...typography.bodyMedium, color: colors.forest },
  title: { ...typography.h3, color: colors.forest },
  bodyText: { ...typography.body, color: colors.muted },

  scroll: { paddingBottom: spacing.xxl, gap: spacing.md },

  bigPhoto: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.creamDark,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoFallbackIcon: { fontSize: 48, color: colors.muted },
  photoFallbackText: { ...typography.small, color: colors.muted },

  header: { paddingHorizontal: spacing.lg, gap: spacing.xxs },
  mealName: { ...typography.h1, color: colors.forest },
  timeText: { ...typography.small, color: colors.muted },
  portionText: { ...typography.body, color: colors.charcoal },

  proteinCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.forest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  proteinEyebrow: { ...typography.eyebrow, color: colors.amber },
  proteinValue: {
    color: colors.amber,
    fontFamily: 'Fraunces_500Medium',
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -1,
  },
  proteinUnit: {
    ...typography.bodyMedium,
    color: colors.cream,
    opacity: 0.7,
  },

  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  macroCol: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
  },
  macroLabel: { ...typography.eyebrow, color: colors.muted, marginBottom: spacing.xxs },
  macroValue: { color: colors.forest, fontFamily: 'Fraunces_500Medium', fontSize: 22 },
  macroUnit: { ...typography.small, color: colors.muted, fontFamily: 'Manrope_400Regular' },

  metaCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  metaLabel: { ...typography.small, color: colors.muted },
  metaValue: { ...typography.bodyMedium, color: colors.charcoal },

  aiNotes: {
    ...typography.body,
    color: colors.muted,
    fontStyle: 'italic',
    paddingHorizontal: spacing.lg,
    textAlign: 'center',
  },

  danger: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
});
