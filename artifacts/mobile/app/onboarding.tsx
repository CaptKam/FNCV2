import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useApp } from '@/context/AppContext';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '\u{1F966}' },
  { id: 'vegan', label: 'Vegan', emoji: '\u{1F331}' },
  { id: 'gluten-free', label: 'Gluten-Free', emoji: '\u{1F33E}' },
  { id: 'dairy-free', label: 'Dairy-Free', emoji: '\u{1F95B}' },
  { id: 'nut-free', label: 'Nut-Free', emoji: '\u{1F95C}' },
  { id: 'halal', label: 'Halal', emoji: '\u{2728}' },
];

const COOKING_LEVELS = [
  { id: 'beginner' as const, label: 'Beginner', icon: 'pot-steam' as const, desc: 'Just getting started in the kitchen' },
  { id: 'home_cook' as const, label: 'Home Cook', icon: 'silverware-fork-knife' as const, desc: 'Comfortable with everyday recipes' },
  { id: 'chef' as const, label: 'Chef', icon: 'chef-hat' as const, desc: 'Bring on the complex techniques' },
];

const AVATAR_OPTIONS = [
  { id: 'initials', icon: null, label: 'Initials' },
  { id: 'chef', icon: 'chef-hat' as const, label: 'Chef' },
  { id: 'globe', icon: 'earth' as const, label: 'Globe' },
  { id: 'fire', icon: 'fire' as const, label: 'Fire' },
  { id: 'heart', icon: 'heart' as const, label: 'Heart' },
  { id: 'star', icon: 'star' as const, label: 'Star' },
  { id: 'compass', icon: 'compass' as const, label: 'Compass' },
];

export default function OnboardingScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('chef');
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<'beginner' | 'home_cook' | 'chef'>('home_cook');

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      if (name.trim()) app.setDisplayName(name.trim());
      app.setAvatarId(selectedAvatar);
      app.setDietaryFlags(selectedDietary);
      app.setCookingLevel(selectedLevel);
      app.setHasCompletedOnboarding(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    app.setHasCompletedOnboarding(true);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.progressRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.surfaceContainerHigh,
                  flex: i === step ? 2 : 1,
                },
              ]}
            />
          ))}
        </View>
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            hitSlop={12}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.onSurface} />
          </Pressable>
        )}
        <Pressable
          onPress={handleSkip}
          hitSlop={12}
          style={styles.skipBtn}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={[Typography.titleSmall, { color: colors.outline }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <MaterialCommunityIcons name="compass-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Welcome to{'\n'}Fork & Compass
            </Text>
            <Text style={[styles.subtitle, { color: colors.outline }]}>
              Pick a country, cook a dinner,{'\n'}feel like you traveled.
            </Text>
            <View style={{ height: Spacing.xxl }} />
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.md }]}>
              WHAT SHOULD WE CALL YOU?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name (optional)"
              placeholderTextColor={colors.outlineMuted}
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  color: colors.onSurface,
                  borderColor: name.trim() ? colors.primary : colors.outlineVariant,
                },
              ]}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={30}
            />
            <Text style={[Typography.labelLarge, { color: colors.outline, marginTop: Spacing.xl, marginBottom: Spacing.md }]}>
              PICK YOUR AVATAR
            </Text>
            <View style={styles.avatarRow}>
              {AVATAR_OPTIONS.map((av) => {
                const isActive = selectedAvatar === av.id;
                return (
                  <Pressable
                    key={av.id}
                    onPress={() => {
                      setSelectedAvatar(av.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[
                      styles.avatarOption,
                      {
                        backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainerLow,
                        borderColor: isActive ? colors.primary : 'transparent',
                        borderWidth: 2,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${av.label} avatar`}
                  >
                    {av.icon ? (
                      <MaterialCommunityIcons
                        name={av.icon}
                        size={24}
                        color={isActive ? colors.primary : colors.outline}
                      />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: '700', color: isActive ? colors.primary : colors.outline }}>
                        {(name || 'A').charAt(0).toUpperCase()}
                      </Text>
                    )}
                    <Text style={{ fontSize: 10, color: isActive ? colors.primary : colors.outline, marginTop: 2 }}>
                      {av.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <MaterialCommunityIcons name="food-apple-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Any dietary{'\n'}preferences?
            </Text>
            <Text style={[styles.subtitle, { color: colors.outline }]}>
              We'll personalize your recipe suggestions.{'\n'}You can change these anytime.
            </Text>
            <View style={{ height: Spacing.xl }} />
            <View style={styles.dietaryGrid}>
              {DIETARY_OPTIONS.map((option) => {
                const isSelected = selectedDietary.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => toggleDietary(option.id)}
                    style={[
                      styles.dietaryChip,
                      {
                        backgroundColor: isSelected ? colors.primaryMuted : colors.surfaceContainerLow,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={{ fontSize: 22 }}>{option.emoji}</Text>
                    <Text
                      style={[
                        Typography.titleSmall,
                        { color: isSelected ? colors.primary : colors.onSurface },
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: colors.primarySubtle }]}>
              <MaterialCommunityIcons name="chef-hat" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              What's your{'\n'}cooking level?
            </Text>
            <Text style={[styles.subtitle, { color: colors.outline }]}>
              This helps us suggest the right recipes.
            </Text>
            <View style={{ height: Spacing.xl }} />
            {COOKING_LEVELS.map((lvl) => {
              const isActive = selectedLevel === lvl.id;
              return (
                <Pressable
                  key={lvl.id}
                  onPress={() => {
                    setSelectedLevel(lvl.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                  style={[
                    styles.levelCard,
                    {
                      backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainerLow,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.levelIconWrap, { backgroundColor: isActive ? colors.primaryFaded : colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons
                      name={lvl.icon}
                      size={24}
                      color={isActive ? colors.primary : colors.outline}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleMedium, { color: isActive ? colors.primary : colors.onSurface }]}>
                      {lvl.label}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: colors.outline, marginTop: 2 }]}>
                      {lvl.desc}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleNext}
          style={[styles.continueBtn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={step === 2 ? 'Get started' : 'Continue'}
        >
          <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>
            {step === 2 ? "Let's Cook" : 'Continue'}
          </Text>
          <MaterialCommunityIcons
            name={step === 2 ? 'check' : 'arrow-right'}
            size={20}
            color={colors.onPrimary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.page,
    bottom: -36,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    position: 'absolute',
    right: Spacing.page,
    bottom: -36,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  content: {
    flex: 1,
    marginTop: Spacing.xl,
  },
  scrollInner: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -1,
  },
  subtitle: {
    ...Typography.body,
    lineHeight: 24,
    marginTop: Spacing.md,
  },
  nameInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 18,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dietaryGrid: {
    gap: Spacing.sm,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 16,
    borderRadius: Radius.lg,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  levelIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.md,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: Radius.full,
  },
});
