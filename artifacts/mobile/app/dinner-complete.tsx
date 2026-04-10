import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { useApp } from '@/context/AppContext';
import { countries } from '@/data/countries';

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

export default function DinnerCompleteScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();
  const reduceMotion = useReducedMotion();

  const party = app.activeDinnerParty;
  const country = party ? countries.find((c) => c.id === party.cuisineCountryId) : null;
  const acceptedGuests = useMemo(() => party?.guests.filter((g) => g.rsvpStatus === 'accepted') ?? [], [party]);
  const courseCount = useMemo(() => party ? Object.values(party.menu).filter(Boolean).length : 0, [party]);
  const isFirstParty = app.dinnerParties.filter((p) => p.status === 'completed' || p.id === party?.id).length <= 1;

  // Animations
  const stampScale = useSharedValue(reduceMotion ? 1 : 0.8);
  const statsOpacity = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!reduceMotion) {
      stampScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      statsOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    }
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  }, []);

  const stampStyle = useAnimatedStyle(() => ({
    transform: [{ scale: stampScale.value }],
  }));

  const statsStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const handleDone = () => {
    if (party) {
      app.completeDinnerParty(party.id);
    }
    router.replace('/(tabs)/cook');
  };

  if (!party) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 80 }]}>
          <Text style={[Typography.headline, { color: colors.onSurface }]}>No active dinner</Text>
          <Pressable onPress={() => router.replace('/(tabs)/cook')} style={[styles.doneBtn, { backgroundColor: colors.primary, marginTop: Spacing.xl }]}>
            <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 40, paddingBottom: 120, paddingHorizontal: Spacing.page }}
      >
        {/* Passport Stamp Hero */}
        <Animated.View style={[styles.stampSection, stampStyle]}>
          <GlassView style={styles.stampCircle}>
            <Text style={styles.flagEmoji}>{country?.flag ?? '🌍'}</Text>
          </GlassView>
          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center', marginTop: Spacing.xl }]}>
            You hosted an authentic{'\n'}
            <Text style={{ color: colors.primary }}>{country?.name ?? 'International'}</Text> dinner!
          </Text>
          {isFirstParty && (
            <Text style={[Typography.body, { color: colors.primary, textAlign: 'center', marginTop: Spacing.md, fontStyle: 'italic' }]}>
              Your first dinner party! The tradition begins.
            </Text>
          )}
          <Text style={[Typography.caption, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: Spacing.md }]}>
            Each country you cook from earns a passport stamp 🌍
          </Text>
        </Animated.View>

        {/* Session Stats */}
        <Animated.View style={[styles.statsCard, { backgroundColor: colors.surfaceContainer }, statsStyle]}>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={colors.outline} />
            <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>Total cook time</Text>
            <Text style={[Typography.titleMedium, { color: colors.primary }]}>
              {party.totalCookMinutes ?? '—'} min
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.outline} />
            <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>Courses served</Text>
            <Text style={[Typography.titleMedium, { color: colors.primary }]}>{courseCount}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="account-group" size={20} color={colors.outline} />
            <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>Guests</Text>
            <Text style={[Typography.titleMedium, { color: colors.primary }]}>{acceptedGuests.length}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.outlineVariant }]} />
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="fire" size={20} color={colors.outline} />
            <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>XP earned</Text>
            <Text style={[Typography.titleMedium, { color: colors.primary }]}>+100</Text>
          </View>
        </Animated.View>

        {/* Menu Recap */}
        <View style={styles.section}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>TONIGHT'S MENU</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menuScroll}>
            {(['appetizer', 'main', 'dessert'] as const).map((courseType) => {
              const course = party.menu[courseType];
              if (!course) return null;
              return (
                <View key={courseType} style={[styles.menuCard, { backgroundColor: colors.surfaceContainerLow }]}>
                  <Image source={{ uri: course.recipeImage }} style={styles.menuImage} contentFit="cover" transition={200} />
                  <Text style={[Typography.labelSmall, { color: colors.outline, marginTop: Spacing.sm }]}>{courseType.toUpperCase()}</Text>
                  <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={2}>{course.recipeName}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Guest Highlights */}
        {acceptedGuests.length > 0 && (
          <View style={styles.section}>
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>Your guests tonight</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestScroll}>
              {acceptedGuests.map((guest) => (
                <View key={guest.id} style={styles.guestItem}>
                  <View style={[styles.guestAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Text style={[Typography.titleSmall, { color: colors.primary }]}>{getInitials(guest.name)}</Text>
                  </View>
                  <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{guest.name.split(' ')[0]}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <PressableScale onPress={handleDone} style={[styles.doneBtn, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Done" scaleDown={0.95} haptic="medium">
          <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Done</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stampSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  stampCircle: {
    width: 120,
    height: 120,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 64,
  },
  statsCard: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: 48,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.xs,
  },
  section: {
    marginBottom: 40,
  },
  menuScroll: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  menuCard: {
    width: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    padding: Spacing.sm,
  },
  menuImage: {
    width: '100%',
    height: 100,
    borderRadius: Radius.md,
  },
  guestScroll: {
    gap: Spacing.lg,
  },
  guestItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: 64,
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.md,
  },
  doneBtn: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
