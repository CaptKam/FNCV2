import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
      const nextStep = recipe.steps[session.currentStepIndex + 1];
      if (nextStep?.duration) {
        app.startStepTimer(nextStep.duration * 60);
        setTotalDuration(nextStep.duration * 60);
      }
    } else {
      app.advanceStep();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [session, recipe, app]);

  const goPrev = useCallback(() => {
    if (!session || session.currentStepIndex <= 0) return;
    app.previousStep();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [session, app]);

  const t = isDark
    ? {
        bg: '#1C1A17',
        headerBg: 'rgba(28,26,23,0.7)',
        headerBorder: 'rgba(255,255,255,0.1)',
        headerIcon: '#F2EDE7',
        headerTitle: 'rgba(245,240,234,0.85)',
        instructionColor: '#F2EDE7',
        detailColor: 'rgba(245,240,234,0.4)',
        pillBg: 'rgba(51,48,44,0.5)',
        pillBorder: 'rgba(255,255,255,0.05)',
        pillLabelColor: 'rgba(245,240,234,0.35)',
        pillValueColor: '#C5702A',
        ingredientCardBg: 'rgba(51,48,44,0.5)',
        ingredientCardBorder: 'rgba(255,255,255,0.05)',
        ingredientCardLabel: 'rgba(245,240,234,0.5)',
        timerRingIdle: 'rgba(255,255,255,0.08)',
        timerDigits: '#F2EDE7',
        timerLabel: 'rgba(245,240,234,0.35)',
        durationIcon: 'rgba(245,240,234,0.4)',
        durationText: 'rgba(245,240,234,0.4)',
        prevIcon: 'rgba(245,240,234,0.6)',
        prevText: 'rgba(245,240,234,0.5)',
        navDivider: 'rgba(255,255,255,0.1)',
        donenessBg: 'rgba(154,65,0,0.08)',
        donenessBorder: 'rgba(154,65,0,0.15)',
        donenessIconBg: 'rgba(154,65,0,0.15)',
        donenessTitle: '#F2EDE7',
        donenessText: 'rgba(245,240,234,0.7)',
      }
    : {
        bg: '#FEF9F3',
        headerBg: 'rgba(255,255,255,0.6)',
        headerBorder: 'rgba(0,0,0,0.05)',
        headerIcon: '#9A4100',
        headerTitle: '#9A4100',
        instructionColor: '#1C1917',
        detailColor: '#57534e',
        pillBg: 'rgba(255,255,255,0.8)',
        pillBorder: 'rgba(154,65,0,0.1)',
        pillLabelColor: 'rgba(154,65,0,0.8)',
        pillValueColor: '#1C1917',
        ingredientCardBg: 'rgba(255,255,255,0.6)',
        ingredientCardBorder: 'rgba(154,65,0,0.1)',
        ingredientCardLabel: 'rgba(154,65,0,0.8)',
        timerRingIdle: 'rgba(154,65,0,0.15)',
        timerDigits: '#1C1917',
        timerLabel: '#78716c',
        durationIcon: '#78716c',
        durationText: '#78716c',
        prevIcon: '#78716c',
        prevText: '#78716c',
        navDivider: 'rgba(154,65,0,0.1)',
        donenessBg: 'rgba(154,65,0,0.05)',
        donenessBorder: 'rgba(154,65,0,0.1)',
        donenessIconBg: 'rgba(154,65,0,0.1)',
        donenessTitle: '#1C1917',
        donenessText: '#57534e',
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

  const currentStep = session?.recipeId === recipe.id ? session.currentStepIndex : 0;
  const step = recipe.steps[Math.min(currentStep, recipe.steps.length - 1)];
  const isLastStep = currentStep >= recipe.steps.length - 1;
  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const hasTimer = step.duration && step.duration > 0;
  const timerProgress = totalDuration > 0 ? timerSeconds / totalDuration : 0;

  const matchedIngredients = recipe.ingredients
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
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Close cook mode"
        >
          <MaterialCommunityIcons name="close" size={22} color={t.headerIcon} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: t.headerTitle }]}>
          Step {currentStep + 1} of {recipe.steps.length}
        </Text>
        <Pressable
          onPress={() => {
            if (hasTimer && !timerRunning && timerSeconds === 0 && step.duration) {
              app.startStepTimer(step.duration * 60);
              setTotalDuration(step.duration * 60);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel="Timer"
        >
          <MaterialCommunityIcons name="timer-outline" size={22} color={t.headerIcon} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          {isDark ? (
            <>
              <Text style={[styles.heroInstructionDark, { color: t.instructionColor }]}>
                {heroText.toUpperCase()}
              </Text>
              {detailText.length > 0 && (
                <Text style={[styles.heroDetailDark, { color: t.detailColor }]}>
                  {detailText}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.heroInstructionLight, { color: t.instructionColor }]}>
              {instructionText}
            </Text>
          )}
        </View>

        {matchedIngredients.length > 0 && (
          isDark ? (
            <View style={styles.pillCluster}>
              {matchedIngredients.map((ing, idx) => (
                <View key={idx} style={[styles.ingredientPillDark, { backgroundColor: t.pillBg, borderTopColor: t.pillBorder }]}>
                  <Text style={[styles.pillLabelDark, { color: t.pillLabelColor }]}>Ingredient</Text>
                  <Text style={[styles.pillValueDark, { color: t.pillValueColor }]}>{convertAmount(ing.amount, app.useMetric)} {ing.name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.ingredientCard, { backgroundColor: t.ingredientCardBg, borderColor: t.ingredientCardBorder }]}>
              <View style={styles.ingredientCardHeader}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.primary} />
                <Text style={[styles.ingredientCardTitle, { color: t.ingredientCardLabel }]}>Ingredients for this step</Text>
              </View>
              <View style={styles.ingredientPillsRow}>
                {matchedIngredients.map((ing, idx) => (
                  <View key={idx} style={[styles.ingredientPillLight, { backgroundColor: t.pillBg, borderColor: t.pillBorder }]}>
                    <Text style={[styles.pillValueLight, { color: t.pillValueColor }]}>{convertAmount(ing.amount, app.useMetric)} {ing.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )
        )}

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
              style={[styles.timerActionBtn, { backgroundColor: `${colors.primary}25` }]}
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
            <MaterialCommunityIcons name="clock-outline" size={14} color={t.durationIcon} />
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
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 16 }]}>
        <GlassView style={[styles.bottomNavInner, !isDark && { borderWidth: 1, borderColor: t.navDivider }]} intensity={isDark ? 40 : 32}>
          <Pressable
            onPress={goPrev}
            disabled={currentStep === 0}
            style={[styles.prevBtn, { opacity: currentStep === 0 ? 0.3 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel="Previous step"
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={t.prevIcon} />
            <Text style={[styles.prevBtnText, { color: t.prevText }]}>Previous</Text>
          </Pressable>

          <View style={[styles.navDivider, { backgroundColor: t.navDivider }]} />

          <Pressable
            onPress={goNext}
            style={[styles.nextBtn, { backgroundColor: isLastStep ? colors.success : colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={isLastStep ? 'Finish cooking' : 'Next step'}
          >
            <Text style={styles.nextBtnText}>
              {isLastStep ? 'Finish' : 'Next'}
            </Text>
            <MaterialCommunityIcons
              name={isLastStep ? 'check' : 'arrow-right'}
              size={20}
              color="#FFFFFF"
            />
          </Pressable>
        </GlassView>
      </View>
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
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
  heroInstructionDark: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  heroDetailDark: {
    fontFamily: 'NotoSerif_400Regular',
    fontSize: 18,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: 14,
  },
  heroInstructionLight: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 22,
    lineHeight: 32,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  pillCluster: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.xl,
  },
  ingredientPillDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pillLabelDark: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pillValueDark: {
    fontSize: 13,
    fontWeight: '700',
  },
  ingredientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: Spacing.xl,
    borderWidth: 1,
  },
  ingredientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  ingredientCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  ingredientPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ingredientPillLight: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillValueLight: {
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 9,
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
    color: '#FFFFFF',
  },
});
