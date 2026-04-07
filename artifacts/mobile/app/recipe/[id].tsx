import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { countries } from '@/data/countries';
import { recipes } from '@/data/recipes';
import { useBookmarks } from '@/context/BookmarksContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const recipe = recipes.find((r) => r.id === id);
  const country = recipe ? countries.find((c) => c.id === recipe.countryId) : null;
  const isSaved = recipe ? isBookmarked(recipe.id) : false;

  const [servings, setServings] = useState(recipe?.servings ?? 1);

  if (!recipe || !country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 100 }]}>
          Recipe not found
        </Text>
      </View>
    );
  }

  const currentServings = servings;
  const ingredientGroups = recipe.ingredients.reduce(
    (acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    },
    {} as Record<string, typeof recipe.ingredients>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.65)']}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 8 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <GlassView style={styles.backGlass}>
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </GlassView>
          </Pressable>
          <Pressable
            onPress={() => toggleBookmark(recipe.id)}
            style={[styles.bookmarkButton, { top: insets.top + 8 }]}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Remove ${recipe.title} from bookmarks` : `Save ${recipe.title} to bookmarks`}
          >
            <GlassView style={styles.backGlass}>
              <MaterialCommunityIcons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? colors.primary : '#FFFFFF'}
              />
            </GlassView>
          </Pressable>
          <View style={styles.heroText}>
            <Text style={[Typography.labelSmall, { color: 'rgba(255,255,255,0.8)' }]}>
              {country.flag} {country.name}
            </Text>
            <Text style={[Typography.display, { color: '#FFFFFF' }]}>{recipe.title}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.lg }}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Feather name="clock" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>Prep {recipe.prepTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Feather name="thermometer" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>Cook {recipe.cookTime}m</Text>
            </View>
            <View style={styles.stat}>
              <Feather name="bar-chart-2" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>{recipe.difficulty}</Text>
            </View>
            <View style={styles.stat}>
              <Feather name="users" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>{currentServings}</Text>
            </View>
          </View>

          <View style={styles.servingsAdjuster}>
            <Pressable
              onPress={() => { if (currentServings > 1) setServings(currentServings - 1); }}
              style={[styles.servingBtn, { borderColor: colors.primary, opacity: currentServings <= 1 ? 0.3 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Decrease servings"
            >
              <Feather name="minus" size={18} color={colors.primary} />
            </Pressable>
            <Text style={[Typography.titleMedium, { color: colors.onSurface }]}>
              {currentServings} servings
            </Text>
            <Pressable
              onPress={() => setServings(currentServings + 1)}
              style={[styles.servingBtn, { borderColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Increase servings"
            >
              <Feather name="plus" size={18} color={colors.primary} />
            </Pressable>
          </View>

          <View style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 4 }]}>
              WHAT YOU NEED
            </Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Ingredients
            </Text>

            {Object.entries(ingredientGroups).map(([category, ingredients]) => (
              <View key={category} style={{ marginBottom: Spacing.lg }}>
                <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: Spacing.sm }]}>
                  {category.toUpperCase()}
                </Text>
                {ingredients.map((ing, idx) => (
                  <View key={idx} style={styles.ingredientRow}>
                    <Text style={[Typography.body, { color: colors.onSurface, flex: 1 }]}>
                      {ing.name}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: colors.outline }]}>{ing.amount}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 4 }]}>
              STEP BY STEP
            </Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Instructions
            </Text>

            {recipe.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[Typography.caption, { color: colors.onPrimary }]}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.body, { color: colors.onSurface }]}>
                    {step.instruction}
                  </Text>
                  {step.duration && (
                    <View style={styles.timerRow}>
                      <Feather name="clock" size={12} color={colors.outline} />
                      <Text style={[Typography.caption, { color: colors.outline }]}>
                        {step.duration} min
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.culturalNote,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: 4 }]}>
              CULTURAL NOTE
            </Text>
            <Text style={[Typography.body, { color: colors.onSurfaceVariant, fontSize: 15 }]}>
              {recipe.culturalNote}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.cookCTA, { bottom: insets.bottom + 16, paddingHorizontal: Spacing.page }]}>
        <Pressable
          onPress={() => router.push(`/cook-mode/${recipe.id}`)}
          style={[styles.cookButton, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel={`Start cooking ${recipe.title}`}
        >
          <Feather name="play" size={20} color={colors.onPrimary} />
          <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Start Cooking</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 380, position: 'relative' },
  backButton: { position: 'absolute', left: Spacing.page, zIndex: 10 },
  bookmarkButton: { position: 'absolute', right: Spacing.page, zIndex: 10 },
  backGlass: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.page,
    right: Spacing.page,
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  stat: { alignItems: 'center', gap: 4 },
  servingsAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  servingBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  culturalNote: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    marginTop: Spacing.xl,
  },
  cookCTA: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.full,
  },
});
