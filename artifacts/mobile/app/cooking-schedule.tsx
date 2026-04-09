import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { useApp } from '@/context/AppContext';
import { TimelineEvent } from '@/types/kitchen';

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function EventCard({ event, colors }: { event: TimelineEvent; colors: ReturnType<typeof useThemeColors> }) {
  const isActive = event.type === 'active';
  const isPassive = event.type === 'passive';
  const isTransition = event.type === 'transition';
  const isFinish = event.type === 'finish';

  if (isTransition) {
    return (
      <View style={styles.transitionRow}>
        <View style={[styles.transitionLine, { backgroundColor: colors.outlineVariant }]} />
        <Text style={[Typography.caption, { color: colors.outline }]}>
          {event.instruction}
        </Text>
        <View style={[styles.transitionLine, { backgroundColor: colors.outlineVariant }]} />
      </View>
    );
  }

  if (isFinish) {
    return (
      <View style={[styles.finishCard, { backgroundColor: `${colors.success}12` }]}>
        <MaterialCommunityIcons name="check-circle" size={28} color={colors.success} />
        <View style={{ flex: 1 }}>
          <Text style={[Typography.titleMedium, { color: colors.success }]}>{event.title}</Text>
          <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>{event.instruction}</Text>
        </View>
        <Text style={[Typography.caption, { color: colors.success }]}>
          {formatTime(event.startTime)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: colors.surfaceContainerLow,
          borderLeftColor: isActive ? colors.primary : colors.outlineVariant,
          borderLeftWidth: 3,
          borderStyle: isPassive ? ('dashed' as const) : ('solid' as const),
        },
      ]}
    >
      <View style={styles.eventHeader}>
        <Text style={[Typography.caption, { color: colors.primary }]}>
          {formatTime(event.startTime)}
        </Text>
        {event.recipeName ? (
          <View style={[styles.recipePill, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[Typography.labelSmall, { color: colors.onSecondaryContainer }]}>
              {event.recipeName}
            </Text>
          </View>
        ) : null}
        {isPassive && (
          <View style={[styles.passiveBadge, { backgroundColor: `${colors.outline}15` }]}>
            <MaterialCommunityIcons name="timer-sand" size={16} color={colors.outline} />
            <Text style={[Typography.labelSmall, { color: colors.outline }]}>Hands-off</Text>
          </View>
        )}
      </View>
      <Text style={[Typography.titleMedium, { color: colors.onSurface, marginTop: Spacing.xs }]}>
        {event.title}
      </Text>
      <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: Spacing.xs, lineHeight: 22 }]}>
        {event.instruction}
      </Text>
      {event.materials.length > 0 && (
        <View style={styles.materialsRow}>
          {event.materials.slice(0, 3).map((m, i) => (
            <View key={i} style={[styles.materialChip, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{m}</Text>
            </View>
          ))}
        </View>
      )}
      <Text style={[Typography.caption, { color: colors.outline, marginTop: Spacing.xs }]}>
        {event.durationMinutes} min
      </Text>
    </View>
  );
}

export default function CookingScheduleScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const plan = app.pendingDinnerPlan;

  if (!plan || plan.events.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.emptyState, { paddingTop: insets.top + 80 }]}>
          <MaterialCommunityIcons name="calendar-blank" size={28} color={colors.outlineVariant} />
          <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
            No schedule yet
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center' }]}>
            Plan some meals and generate a cooking schedule.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={[Typography.titleSmall, { color: colors.primary }]}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const handleStartCooking = () => {
    app.startDinnerPlan();
    // Navigate to cook-mode with the first recipe
    const firstRecipe = plan.recipes[0];
    if (firstRecipe) {
      router.push(`/cook-mode/${firstRecipe.id}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Glass header */}
      <GlassView style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={OVERLAY_BUTTON.iconColor} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[Typography.display, { color: colors.onSurface, fontSize: 22 }]}>
            Your Cooking Schedule
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, marginTop: 2 }]}>
            Start at {formatTime(plan.startTime)} · Serve at {formatTime(plan.targetTime)}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </GlassView>

      {/* Timeline */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 100, paddingBottom: Spacing.tabClearance }]}
      >
        {/* Summary strip */}
        <View style={[styles.summaryStrip, { backgroundColor: colors.surfaceContainerHigh }]}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
              {plan.totalDurationMinutes} min total
            </Text>
          </View>
          <View style={[styles.summaryDot, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={16} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
              {plan.recipes.length} {plan.recipes.length === 1 ? 'recipe' : 'recipes'}
            </Text>
          </View>
          <View style={[styles.summaryDot, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="fire" size={16} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
              {plan.events.filter((e) => e.type === 'active').length} active steps
            </Text>
          </View>
        </View>

        {/* Events */}
        <View style={styles.timeline}>
          {plan.events.map((event) => (
            <EventCard key={event.id} event={event} colors={colors} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleStartCooking}
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Start cooking now"
        >
          <MaterialCommunityIcons name="play" size={20} color={colors.onPrimary} />
          <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Start Cooking Now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OVERLAY_BUTTON.background,
    borderWidth: OVERLAY_BUTTON.borderWidth,
    borderColor: OVERLAY_BUTTON.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.page,
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  timeline: {
    gap: Spacing.md,
  },
  eventCard: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  recipePill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  passiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  materialsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  materialChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  transitionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  transitionLine: {
    flex: 1,
    height: 1,
  },
  finishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.md,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  backBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: Spacing.md,
  },
});
