import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight, withSpring, useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useReducedMotion } from '@/utils/motion';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { GlassView } from '@/components/GlassView';
import { PressableScale } from '@/components/PressableScale';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { convertAmount } from '@/data/helpers';
import { highlightCulinaryVerbs } from '@/utils/textFormatting';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/context/AppContext';

const TIMER_SIZE = 220;

export default function CookModeScreen() {
  useKeepAwake();

  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const recipe = recipes.find((r) => r.id === id);
  const session = app.activeCookSession;

  const sessionInitialized = React.useRef(false);
  useEffect(() => {
    if (sessionInitialized.current) return;
    const timer = setTimeout(() => {
      const currentSession = app.activeCookSession;
      if (recipe && (!currentSession || currentSession.recipeId !== recipe.id)) {
        app.startCookSession(recipe, recipe.servings);
      }
      sessionInitialized.current = true;
    }, 50);
    return () => clearTimeout(timer);
  }, [recipe?.id]);

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, Set<string>>>({});

  useEffect(() => {
    if (session?.activeTimerStart && session?.activeTimerDuration) {
      const elapsed = Math.floor((Date.now() - new Date(session.activeTimerStart).getTime()) / 1000);
      const remaining = Math.max(0, session.activeTimerDuration - elapsed);
      setTimerSeconds(remaining);
      setTimerRunning(remaining > 0);
      setTotalDuration(session.activeTimerDuration);
    } else {
      setTimerRunning(false);
    }
  }, [session?.activeTimerStart, session?.activeTimerDuration]);

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

  // Dinner plan awareness
  const dinnerPlan = app.activeDinnerPlan;
  const dinnerEventIndex = app.currentDinnerEventIndex;
  const isDinnerMode = dinnerPlan != null;
  const dinnerEvent = isDinnerMode ? dinnerPlan.events[dinnerEventIndex] : null;
  const dinnerTotalEvents = isDinnerMode ? dinnerPlan.events.length : 0;

  // Detect completion — navigate to dinner-complete or back
  const prevSessionRef = React.useRef(session);
  const prevDinnerRef = React.useRef(dinnerPlan);
  const hasNavigatedRef = React.useRef(false);
  const activeParty = app.activeDinnerParty;

  const [showCelebration, setShowCelebration] = useState(false);
  const reduceMotion = useReducedMotion();
  const celebrationScale = useSharedValue(0);
  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationScale.value }],
  }));
  const completedRecipeRef = useRef<{ title: string; countryId: string; countryName: string; countryFlag: string } | null>(null);
  // Capture whether this is the user's first-ever cook (before completion runs)
  const initialCookCountRef = useRef(app.totalRecipesCooked);
  const [isFirstEverCook, setIsFirstEverCook] = useState(false);

  useEffect(() => {
    if (session && recipe) {
      const country = countries.find(c => c.id === recipe.countryId);
      completedRecipeRef.current = {
        title: recipe.title,
        countryId: recipe.countryId,
        countryName: country?.name ?? '',
        countryFlag: country?.flag ?? '🌍',
      };
    }
  }, [session, recipe]);

  useEffect(() => {
    if (prevSessionRef.current && !session && !hasNavigatedRef.current && !isDinnerMode) {
      hasNavigatedRef.current = true;
      if (activeParty) {
        router.replace('/dinner-complete');
      } else {
        if (initialCookCountRef.current === 0) setIsFirstEverCook(true);
        setShowCelebration(true);
        if (!reduceMotion) {
          celebrationScale.value = withSpring(1, { damping: 12, stiffness: 180 });
        } else {
          celebrationScale.value = 1;
        }
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    }
    if (prevDinnerRef.current && !dinnerPlan && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      if (activeParty) {
        router.replace('/dinner-complete');
      } else {
        if (initialCookCountRef.current === 0) setIsFirstEverCook(true);
        setShowCelebration(true);
        if (!reduceMotion) {
          celebrationScale.value = withSpring(1, { damping: 12, stiffness: 180 });
        } else {
          celebrationScale.value = 1;
        }
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      }
    }
    prevSessionRef.current = session;
    prevDinnerRef.current = dinnerPlan;
  }, [session, dinnerPlan, isDinnerMode, activeParty, router]);

  const goNext = useCallback(() => {
    if (isDinnerMode) {
      // Dinner plan mode: advance through timeline events
      if (dinnerEventIndex < dinnerTotalEvents - 1) {
        app.advanceDinnerStep();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // Last event — complete the dinner plan
        app.completeDinnerPlan();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      return;
    }
    // Single recipe mode
    if (!recipe || !session) return;
    if (session.currentStepIndex < recipe.steps.length - 1) {
      app.advanceStep();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextStep = recipe.steps[session.currentStepIndex + 1];
      if (nextStep?.duration) {
        app.startStepTimer(nextStep.duration * 60);
        setTotalDuration(nextStep.duration * 60);
      }
    } else {
      app.advanceStep();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isDinnerMode, dinnerEventIndex, dinnerTotalEvents, session, recipe, app]);

  const goPrev = useCallback(() => {
    if (isDinnerMode) {
      if (dinnerEventIndex > 0) {
        // Go back one dinner event by decrementing index directly
        // (advanceDinnerStep only goes forward, so we set directly)
        app.setPendingDinnerPlan(null); // no-op side effect, just to trigger re-render
        // For now, single-direction only in dinner mode
      }
      return;
    }
    if (!session || session.currentStepIndex <= 0) return;
    app.previousStep();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isDinnerMode, dinnerEventIndex, session, app]);

  const toggleStepIngredient = useCallback((stepIdx: number, ingredientName: string) => {
    setCheckedIngredients(prev => {
      const stepSet = new Set(prev[stepIdx] ?? []);
      if (stepSet.has(ingredientName)) stepSet.delete(ingredientName);
      else stepSet.add(ingredientName);
      return { ...prev, [stepIdx]: stepSet };
    });
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  }, []);

  const t = {
    bg: colors.surface,
    headerBg: colors.glassOverlay,
    headerBorder: colors.outlineVariant,
    headerIcon: colors.onSurface,
    headerTitle: colors.onSurface,
    instructionColor: colors.onSurface,
    detailColor: colors.onSurfaceVariant,
    pillBg: colors.surfaceContainerHigh,
    pillBorder: colors.outlineVariant,
    pillLabelColor: colors.outlineMuted,
    pillValueColor: colors.primary,
    timerRingIdle: colors.primaryTint,
    timerDigits: colors.onSurface,
    timerLabel: colors.onSurfaceVariant,
    durationIcon: colors.outline,
    durationText: colors.outline,
    prevIcon: colors.onSurface,
    prevText: colors.onSurface,
    navDivider: colors.outlineVariant,
    donenessBg: colors.primaryTint,
    donenessBorder: colors.primarySubtle,
    donenessIconBg: colors.primarySubtle,
    donenessTitle: colors.onSurface,
    donenessText: colors.onSurfaceVariant,
    verbHighlight: isDark ? colors.inversePrimary : colors.primary,
  };

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: t.bg }]}>
        <Text style={[Typography.body, { color: t.instructionColor, textAlign: 'center', marginTop: 100 }]}>
          Recipe not found
        </Text>
      </View>
    );
  }

  // In dinner mode, read from timeline events; in single mode, read from recipe steps
  const currentStep = isDinnerMode
    ? dinnerEventIndex
    : (session?.recipeId === recipe.id ? session.currentStepIndex : 0);
  const step = isDinnerMode
    ? { instruction: dinnerEvent?.instruction ?? '', duration: dinnerEvent?.durationMinutes }
    : recipe.steps[Math.min(currentStep, recipe.steps.length - 1)];
  const totalSteps = isDinnerMode ? dinnerTotalEvents : recipe.steps.length;
  const isLastStep = isDinnerMode
    ? dinnerEventIndex >= dinnerTotalEvents - 1
    : currentStep >= recipe.steps.length - 1;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const hasTimer = step.duration && step.duration > 0;
  const timerProgress = totalDuration > 0 ? timerSeconds / totalDuration : 0;

  // Smoothly animate the step progress bar as user advances through steps
  const stepProgress = useSharedValue((currentStep + 1) / totalSteps);
  useEffect(() => {
    const target = (currentStep + 1) / totalSteps;
    if (reduceMotion) {
      stepProgress.value = target;
    } else {
      stepProgress.value = withTiming(target, { duration: 400, easing: Easing.out(Easing.cubic) });
    }
  }, [currentStep, totalSteps, reduceMotion]);
  const stepProgressBarStyle = useAnimatedStyle(() => ({
    width: `${stepProgress.value * 100}%`,
  }));

  // In dinner mode, materials come from the event; in single mode, from ingredient matching
  const matchedIngredients = isDinnerMode
    ? (dinnerEvent?.materials ?? []).map((m) => ({ name: m, amount: '' }))
    : recipe.ingredients
        .filter((ing) => step.instruction.toLowerCase().includes(ing.name.toLowerCase()))
        .slice(0, 4);

  const instructionText = step.instruction;
  const firstSentenceEnd = instructionText.indexOf('.');
  const heroText = firstSentenceEnd > 0 && firstSentenceEnd < 60
    ? instructionText.substring(0, firstSentenceEnd + 1)
    : instructionText.split(',')[0];
  const detailText = firstSentenceEnd > 0 && firstSentenceEnd < 60
    ? instructionText.substring(firstSentenceEnd + 1).trim()
    : instructionText.length > heroText.length
      ? instructionText.substring(heroText.length + 1).trim()
      : '';

  return (
    <View style={[styles.container, { backgroundColor: t.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: t.headerBg, borderBottomColor: t.headerBorder }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: OVERLAY_BUTTON.background, borderWidth: OVERLAY_BUTTON.borderWidth, borderColor: OVERLAY_BUTTON.borderColor }]}
          accessibilityRole="button"
          accessibilityLabel="Close cook mode"
        >
          <MaterialCommunityIcons name="close" size={OVERLAY_BUTTON.iconSize} color={OVERLAY_BUTTON.iconColor} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          {isDinnerMode && dinnerEvent?.recipeName && (
            <Text style={[styles.headerTitle, { color: t.headerTitle }]}>{dinnerEvent.recipeName} · </Text>
          )}
          <Text style={[styles.headerTitle, { color: t.headerTitle }]}>Step </Text>
          <AnimatedCounter
            value={currentStep + 1}
            style={[styles.headerTitle, { color: t.headerTitle }]}
          />
          <Text style={[styles.headerTitle, { color: t.headerTitle }]}> of {totalSteps}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (hasTimer && !timerRunning && timerSeconds === 0 && step.duration) {
              app.startStepTimer(step.duration * 60);
              setTotalDuration(step.duration * 60);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={[styles.headerBtn, { backgroundColor: OVERLAY_BUTTON.background, borderWidth: OVERLAY_BUTTON.borderWidth, borderColor: OVERLAY_BUTTON.borderColor }]}
          accessibilityRole="button"
          accessibilityLabel="Timer"
        >
          <MaterialCommunityIcons name="timer-outline" size={OVERLAY_BUTTON.iconSize} color={OVERLAY_BUTTON.iconColor} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
        <Animated.View style={[styles.progressFill, { backgroundColor: isLastStep ? colors.success : colors.primary }, stepProgressBarStyle]} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          key={currentStep}
          entering={reduceMotion ? undefined : SlideInRight.duration(250).easing(Easing.out(Easing.cubic))}
        >
        {/* Step image - uses recipe hero as fallback */}
        <View style={styles.stepImageWrap}>
          <Image
            source={{ uri: recipe.image }}
            style={styles.stepImage}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['transparent', t.bg]}
            style={styles.stepImageGradient}
          />
        </View>

        {matchedIngredients.length > 0 && (
          <View style={styles.ingredientSection}>
            <Text style={[styles.ingredientHeader, { color: 'rgba(255,255,255,0.4)' }]}>INGREDIENTS</Text>
            {matchedIngredients.map((ing, idx) => {
              const isChecked = checkedIngredients[currentStep]?.has(ing.name) ?? false;
              return (
                <Pressable
                  key={idx}
                  onPress={() => toggleStepIngredient(currentStep, ing.name)}
                  style={styles.ingredientRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`${convertAmount(ing.amount, app.useMetric)} ${ing.name}`}
                >
                  <View style={[styles.ingredientCheck, { backgroundColor: isChecked ? colors.primary : 'transparent', borderColor: isChecked ? colors.primary : 'rgba(255,255,255,0.3)' }]}>
                    {isChecked && <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={[styles.ingredientText, { color: isChecked ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)', textDecorationLine: isChecked ? 'line-through' : 'none' }]}>
                    {ing.amount ? `${convertAmount(ing.amount, app.useMetric)} ` : ''}{ing.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.heroSection}>
          <Text style={[styles.heroInstruction, { color: t.instructionColor }]}>
            {highlightCulinaryVerbs(heroText.toUpperCase()).map((seg, si) =>
              seg.isVerb ? (
                <Text key={si} style={{ color: t.verbHighlight }}>{seg.text}</Text>
              ) : (
                <Text key={si}>{seg.text}</Text>
              )
            )}
          </Text>
          {detailText.length > 0 && (
            <Text style={[styles.heroDetail, { color: t.detailColor }]}>
              {detailText}
            </Text>
          )}
        </View>

        {hasTimer && (
          <View style={styles.timerSection}>
            <View style={[styles.timerRing, { borderColor: timerProgress > 0 ? colors.primary : t.timerRingIdle }]}>
              <Text style={[styles.timerDigits, { color: t.timerDigits }]}>
                {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.timerLabel, { color: t.timerLabel }]}>
                {timerRunning ? 'REMAINING' : timerSeconds > 0 ? 'PAUSED' : 'READY'}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (!timerRunning && timerSeconds === 0 && step.duration) {
                  app.startStepTimer(step.duration * 60);
                  setTotalDuration(step.duration * 60);
                } else if (timerRunning) {
                  app.clearStepTimer();
                  setTimerRunning(false);
                } else {
                  app.startStepTimer(timerSeconds);
                }
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.timerActionBtn, { backgroundColor: colors.primaryFaded }]}
              accessibilityRole="button"
              accessibilityLabel={timerRunning ? 'Pause timer' : timerSeconds > 0 ? 'Resume timer' : 'Start timer'}
            >
              <MaterialCommunityIcons
                name={timerRunning ? 'pause' : 'play'}
                size={16}
                color={colors.primary}
              />
              <Text style={[styles.timerActionText, { color: colors.primary }]}>
                {timerRunning ? 'Pause' : timerSeconds > 0 ? 'Resume' : 'Start Timer'}
              </Text>
            </Pressable>
          </View>
        )}

        {step.duration && step.duration > 0 && (
          <View style={styles.stepDurationBadge}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={t.durationIcon} />
            <Text style={[styles.stepDurationText, { color: t.durationText }]}>
              {step.duration} min for this step
            </Text>
          </View>
        )}

        {step.tip && (
          <View style={[styles.donenessCard, { backgroundColor: t.donenessBg, borderColor: t.donenessBorder }]}>
            <View style={[styles.donenessIconWrap, { backgroundColor: t.donenessIconBg }]}>
              <MaterialCommunityIcons name="eye" size={20} color={colors.primary} />
            </View>
            <View style={styles.donenessContent}>
              <Text style={[styles.donenessTitle, { color: t.donenessTitle }]}>Doneness Cue</Text>
              <Text style={[styles.donenessText, { color: t.donenessText }]}>{step.tip}</Text>
            </View>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <GlassView style={[styles.bottomNavInner, !isDark && { borderWidth: 1, borderColor: t.navDivider }]} intensity={isDark ? 40 : 32}>
          <PressableScale
            onPress={goPrev}
            disabled={currentStep === 0}
            scaleDown={0.95}
            style={[styles.prevBtn, { opacity: currentStep === 0 ? 0.3 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={t.prevIcon} />
            <Text style={[styles.prevBtnText, { color: t.prevText }]}>Previous</Text>
          </PressableScale>

          <View style={[styles.navDivider, { backgroundColor: t.navDivider }]} />

          <PressableScale
            onPress={goNext}
            scaleDown={0.95}
            style={[styles.nextBtn, { backgroundColor: isLastStep ? colors.success : colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? 'Finish cooking' : 'Next step'}
          >
            <Text style={[styles.nextBtnText, { color: colors.onPrimary }]}>
              {isLastStep ? 'Finish Cooking' : 'Next'}
            </Text>
            <MaterialCommunityIcons
              name={isLastStep ? 'check' : 'arrow-right'}
              size={20}
              color={colors.onPrimary}
            />
          </PressableScale>
        </GlassView>
      </View>

      {showCelebration && (
        <View style={[StyleSheet.absoluteFill, styles.celebrationOverlay, { backgroundColor: t.bg }]}>
          <View style={styles.celebrationContent}>
            <Animated.View style={[styles.celebrationIcon, celebrationStyle]}>
              <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
            </Animated.View>
            <Animated.Text entering={reduceMotion ? undefined : FadeIn.delay(200).duration(300)} style={[Typography.display, { color: t.instructionColor, textAlign: 'center', marginTop: Spacing.lg }]}>
              Well done!
            </Animated.Text>
            {completedRecipeRef.current && (
              <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(300).duration(300)}>
                <Text style={[Typography.titleMedium, { color: t.instructionColor, textAlign: 'center', marginTop: Spacing.sm, opacity: 0.8 }]}>
                  {completedRecipeRef.current.title}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md }}>
                  <Text style={{ fontSize: 32 }}>{completedRecipeRef.current.countryFlag}</Text>
                  <Text style={[Typography.body, { color: t.instructionColor, opacity: 0.7 }]}>
                    {completedRecipeRef.current.countryName}
                  </Text>
                </View>
              </Animated.View>
            )}
            <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(500).duration(300)} style={{ alignItems: 'center', marginTop: Spacing.lg }}>
              <Text style={[Typography.titleLarge, { color: colors.warning, fontWeight: '700' }]}>+50 XP</Text>
              <Text style={[Typography.bodySmall, { color: t.instructionColor, opacity: 0.6, marginTop: Spacing.xs }]}>
                {completedRecipeRef.current?.countryName} cuisine explored 🌍
              </Text>
              {isFirstEverCook && (
                <Text style={[Typography.body, { color: t.instructionColor, opacity: 0.7, fontStyle: 'italic', textAlign: 'center', marginTop: Spacing.md }]}>
                  Your culinary journey begins!
                </Text>
              )}
            </Animated.View>
            <Animated.View entering={reduceMotion ? undefined : FadeIn.delay(700).duration(300)} style={{ marginTop: Spacing.xxl }}>
              <Pressable
                onPress={() => { setShowCelebration(false); router.back(); }}
                style={[styles.celebrationDoneBtn, { backgroundColor: colors.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Done"
              >
                <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: OVERLAY_BUTTON.size,
    height: OVERLAY_BUTTON.size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  headerTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.lg,
  },
  heroSection: {
    marginBottom: Spacing.xl,
  },
  heroInstruction: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.5,
    textTransform: 'uppercase',
  },
  heroDetail: {
    fontFamily: 'NotoSerif_400Regular',
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: 14,
  },
  pillCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  ingredientPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  timerRing: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigits: {
    fontFamily: 'Inter_700Bold',
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: -2,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  timerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  timerActionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stepDurationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  stepDurationText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  donenessCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  donenessIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donenessContent: {
    flex: 1,
    gap: 4,
  },
  donenessTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  donenessText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  bottomNav: {
    paddingHorizontal: Spacing.page,
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: Radius.full,
    height: 64,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 48,
  },
  prevBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  navDivider: {
    width: 1,
    height: 28,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: Radius.full,
    minHeight: 48,
  },
  nextBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  celebrationOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  celebrationContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  celebrationIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationDoneBtn: {
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  progressBar: {
    height: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  stepImageWrap: {
    width: '100%',
    height: 200,
    marginBottom: Spacing.md,
  },
  stepImage: {
    width: '100%',
    height: '100%',
  },
  stepImageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  ingredientSection: {
    paddingHorizontal: Spacing.page,
    paddingTop: 20,
    paddingBottom: 12,
  },
  ingredientHeader: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    gap: 12,
  },
  ingredientCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
});
