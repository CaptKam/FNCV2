import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { recipes } from '@/data/recipes';
import { convertAmount } from '@/data/helpers';
import { highlightCulinaryVerbs } from '@/utils/textFormatting';
import { useApp } from '@/context/AppContext';

export default function CookModeScreen() {
  useKeepAwake();

  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const recipe = recipes.find((r) => r.id === id);
  const session = app.activeCookSession;

  // Only start a session if none exists for this recipe.
  // Recipe detail already calls startCookSession before navigating here,
  // so this is a fallback for deep links or resume scenarios.
  const sessionInitialized = React.useRef(false);
  useEffect(() => {
    if (sessionInitialized.current) return;
    // Wait one tick for state from recipe detail's startCookSession to propagate
    const timer = setTimeout(() => {
      const currentSession = app.activeCookSession;
      if (recipe && (!currentSession || currentSession.recipeId !== recipe.id)) {
        app.startCookSession(recipe, recipe.servings);
      }
      sessionInitialized.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [recipe?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Local timer state (ticks every second, driven by session's activeTimerStart/Duration)
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Sync local timer from session state
  useEffect(() => {
    if (session?.activeTimerStart && session?.activeTimerDuration) {
      const elapsed = Math.floor((Date.now() - new Date(session.activeTimerStart).getTime()) / 1000);
      const remaining = Math.max(0, session.activeTimerDuration - elapsed);
      setTimerSeconds(remaining);
      setTimerRunning(remaining > 0);
    } else {
      setTimerRunning(false);
    }
  }, [session?.activeTimerStart, session?.activeTimerDuration]);

  // Timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            app.clearStepTimer();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds, app]);

  // Detect session completion — navigate back once
  const prevSessionRef = React.useRef(session);
  const hasNavigatedRef = React.useRef(false);
  useEffect(() => {
    if (prevSessionRef.current && !session && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      router.back();
    }
    prevSessionRef.current = session;
  }, [session, router]);

  const goNext = useCallback(() => {
    if (!recipe || !session) return;
    if (session.currentStepIndex < recipe.steps.length - 1) {
      app.advanceStep();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Set up timer for next step if it has duration
      const nextStep = recipe.steps[session.currentStepIndex + 1];
      if (nextStep?.duration) {
        app.startStepTimer(nextStep.duration * 60);
      }
    } else {
      // Last step — advance triggers completion in AppContext
      app.advanceStep();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [session, recipe, app]);

  const goPrev = useCallback(() => {
    if (!session || session.currentStepIndex <= 0) return;
    app.previousStep();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [session, app]);

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.inverseSurface }]}>
        <Text style={[Typography.body, { color: colors.inverseOnSurface, textAlign: 'center' }]}>
          Recipe not found
        </Text>
      </View>
    );
  }

  // Read step from session (fallback to 0 while session initializes)
  const currentStep = session?.recipeId === recipe.id ? session.currentStepIndex : 0;
  const step = recipe.steps[Math.min(currentStep, recipe.steps.length - 1)];
  const progress = (currentStep + 1) / recipe.steps.length;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;

  return (
    <View style={[styles.container, { backgroundColor: colors.inverseSurface }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Feather name="x" size={24} color={colors.inverseOnSurface} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <Text style={[Typography.titleMedium, { color: colors.inverseOnSurface }]} numberOfLines={1}>
            {recipe.title}
          </Text>
          <Text style={[Typography.caption, { color: 'rgba(245,240,234,0.6)' }]}>
            Step {currentStep + 1} of {recipe.steps.length}
          </Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.progressContainer}>
        <View style={[styles.progressTrack, { backgroundColor: `${colors.outline}40` }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress * 100}%` },
            ]}
          />
        </View>
      </View>

      <View style={styles.mainContent}>
        <Text style={[Typography.body, styles.instruction, { color: colors.inverseOnSurface }]}>
          {highlightCulinaryVerbs(step.instruction).map((seg, si) =>
            seg.isVerb ? (
              <Text key={si} style={{ fontWeight: '700', color: colors.inversePrimary }}>{seg.text}</Text>
            ) : (
              <Text key={si}>{seg.text}</Text>
            )
          )}
        </Text>

        {step.duration && step.duration > 0 && (
          <View style={styles.timerContainer}>
            <View style={[styles.timerCircle, { borderColor: colors.primary }]}>
              <Text style={[Typography.displayMedium, { color: colors.primary, fontSize: 36 }]}>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (!timerRunning && timerSeconds === 0 && step.duration) {
                  // Start fresh timer
                  app.startStepTimer(step.duration * 60);
                } else if (timerRunning) {
                  // Pause — clear the context timer, keep local display
                  app.clearStepTimer();
                  setTimerRunning(false);
                } else {
                  // Resume — restart context timer with remaining seconds
                  app.startStepTimer(timerSeconds);
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.timerBtn, { backgroundColor: `${colors.primary}20` }]}
              accessibilityRole="button"
              accessibilityLabel={timerRunning ? 'Pause timer' : timerSeconds > 0 ? 'Resume timer' : 'Start timer'}
            >
              <Feather
                name={timerRunning ? 'pause' : 'play'}
                size={18}
                color={colors.primary}
              />
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>
                {timerRunning ? 'Pause' : timerSeconds > 0 ? 'Resume' : 'Start Timer'}
              </Text>
            </Pressable>
          </View>
        )}

        {recipe.ingredients
          .filter((_, i) => step.instruction.toLowerCase().includes(recipe.ingredients[i].name.toLowerCase()))
          .slice(0, 3)
          .map((ing, idx) => (
            <View
              key={idx}
              style={[styles.ingredientPill, { backgroundColor: colors.secondaryContainer }]}
            >
              <Text style={[Typography.titleSmall, { color: colors.onSecondaryContainer }]}>
                {ing.name}: {convertAmount(ing.amount, app.useMetric)}
              </Text>
            </View>
          ))}
      </View>

      <View style={[styles.bottomToolbar, { paddingBottom: insets.bottom + 16 }]}>
        <GlassView style={styles.toolbarInner} intensity={40}>
          <Pressable
            onPress={goPrev}
            disabled={currentStep === 0}
            style={[
              styles.navBtn,
              { opacity: currentStep === 0 ? 0.3 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <Feather name="chevron-left" size={24} color={colors.inverseOnSurface} />
            <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>Previous</Text>
          </Pressable>
          <Pressable
            onPress={goNext}
            style={[
              styles.navBtn,
            ]}
            accessibilityRole="button"
            accessibilityLabel={currentStep >= recipe.steps.length - 1 ? 'Finish cooking' : 'Next step'}
          >
            <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>
              {currentStep >= recipe.steps.length - 1 ? 'Finish' : 'Next'}
            </Text>
            <Feather name={currentStep >= recipe.steps.length - 1 ? 'check' : 'chevron-right'} size={24} color={colors.inverseOnSurface} />
          </Pressable>
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  progressContainer: {
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.xl,
  },
  progressTrack: {
    height: 3,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: Spacing.page,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  instruction: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: Radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  ingredientPill: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  bottomToolbar: {
    paddingHorizontal: Spacing.page,
  },
  toolbarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.full,
    height: 52,
    alignItems: 'center',
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
  },
});
