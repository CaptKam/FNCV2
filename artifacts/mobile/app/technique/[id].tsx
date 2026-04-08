import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { RecipeCard } from '@/components/RecipeCard';
import { TECHNIQUES } from '@/data/techniques';
import { recipes } from '@/data/recipes';

const DIFFICULTY_COLORS = {
  beginner: '#2D6A4F',
  intermediate: '#BA7517',
  advanced: '#BA1A1A',
};

const CATEGORY_ICONS: Record<string, string> = {
  knife: 'knife',
  heat: 'fire',
  prep: 'food-variant',
  finishing: 'silverware-fork-knife',
};

export default function TechniqueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const technique = TECHNIQUES.find((t) => t.id === id);

  if (!technique) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 200 }]}>
          Technique not found
        </Text>
      </View>
    );
  }

  const relatedRecipeObjects = technique.relatedRecipes
    .map((rid) => recipes.find((r) => r.id === rid))
    .filter((r): r is (typeof recipes)[0] => r != null);

  const difficultyColor = DIFFICULTY_COLORS[technique.difficulty];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          {technique.image ? (
            <Image source={{ uri: technique.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} accessible={false} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surfaceContainerHigh }]} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.3)' }]} />
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 8 }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <GlassView style={styles.backBtnGlass}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnImage} />
            </GlassView>
          </Pressable>
        </View>

        {/* Content */}
        <View style={[styles.content, { marginTop: -32, backgroundColor: colors.surface }]}>
          <Text style={[Typography.display, { color: colors.onSurface, marginBottom: Spacing.xs }]}>
            {technique.title}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: Spacing.lg }]}>
            {technique.subtitle}
          </Text>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: `${difficultyColor}15` }]}>
              <Text style={[Typography.labelSmall, { color: difficultyColor }]}>
                {technique.difficulty.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
              <Text style={[Typography.labelSmall, { color: colors.outline }]}>{technique.duration}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name={(CATEGORY_ICONS[technique.category] ?? 'food-variant') as any} size={14} color={colors.outline} />
              <Text style={[Typography.labelSmall, { color: colors.outline }]}>{technique.category}</Text>
            </View>
          </View>

          {/* Description */}
          {technique.description.split('\n\n').map((paragraph, i) => (
            <Text key={i} style={[Typography.body, { color: colors.onSurfaceVariant, marginBottom: Spacing.md, lineHeight: 26 }]}>
              {paragraph}
            </Text>
          ))}

          {/* Key Steps */}
          <View style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
              KEY STEPS
            </Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              How It's Done
            </Text>

            {technique.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNum, { color: colors.onPrimary }]}>{idx + 1}</Text>
                </View>
                <Text style={[Typography.body, { color: colors.onSurface, flex: 1, lineHeight: 24 }]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>

          {/* Related Recipes */}
          {relatedRecipeObjects.length > 0 && (
            <View style={{ marginTop: Spacing.xxl }}>
              <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
                RECIPES THAT USE THIS
              </Text>
              <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
                Put It Into Practice
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md }}>
                {relatedRecipeObjects.map((recipe) => (
                  <View key={recipe.id} style={{ width: 180 }}>
                    <RecipeCard recipe={recipe} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.page,
    zIndex: 10,
  },
  backBtnGlass: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.page,
    paddingTop: 32,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNum: {
    fontWeight: '700',
    fontSize: 13,
  },
});
