import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CookModeScreen() {
  useKeepAwake();

  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const recipe = recipes.find((r) => r.id === id);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  const goNext = useCallback(() => {
    if (!recipe) return;
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const nextStep = recipe.steps[currentStep + 1];
      if (nextStep.duration) {
        setTimerSeconds(nextStep.duration * 60);
        setTimerRunning(false);
      } else {
        setTimerSeconds(0);
        setTimerRunning(false);
      }
    }
  }, [currentStep, recipe]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (recipe) {
        const prevStep = recipe.steps[currentStep - 1];
        if (prevStep.duration) {
          setTimerSeconds(prevStep.duration * 60);
          setTimerRunning(false);
        } else {
          setTimerSeconds(0);
          setTimerRunning(false);
        }
      }
    }
  }, [currentStep, recipe]);

  if (!recipe) {
    return (
      <View style={[styles.container, { backgroundColor: colors.inverseSurface }]}>
        <Text style={[Typography.body, { color: colors.inverseOnSurface, textAlign: 'center' }]}>
          Recipe not found
        </Text>
      </View>
    );
  }

  const step = recipe.steps[currentStep];
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
          {step.instruction}
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
                if (timerSeconds === 0 && step.duration) {
                  setTimerSeconds(step.duration * 60);
                }
                setTimerRunning(!timerRunning);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={[styles.timerBtn, { backgroundColor: `${colors.primary}20` }]}
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
                {ing.name}: {ing.amount}
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
          >
            <Feather name="chevron-left" size={24} color={colors.inverseOnSurface} />
            <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>Previous</Text>
          </Pressable>
          <Pressable
            onPress={goNext}
            disabled={currentStep === recipe.steps.length - 1}
            style={[
              styles.navBtn,
              { opacity: currentStep === recipe.steps.length - 1 ? 0.3 : 1 },
            ]}
          >
            <Text style={[Typography.titleSmall, { color: colors.inverseOnSurface }]}>Next</Text>
            <Feather name="chevron-right" size={24} color={colors.inverseOnSurface} />
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
