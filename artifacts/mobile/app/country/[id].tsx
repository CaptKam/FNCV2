import React from 'react';
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

export default function CountryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const country = countries.find((c) => c.id === id);
  const countryRecipes = recipes.filter((r) => r.countryId === id);

  if (!country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 100 }]}>
          Country not found
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: country.heroImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.4, 1]}
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
          <View style={styles.heroText}>
            <GlassView style={styles.flagPill}>
              <Text style={{ fontSize: 16 }}>{country.flag}</Text>
              <Text style={[Typography.caption, { color: '#FFFFFF' }]}>{country.region}</Text>
            </GlassView>
            <Text style={[Typography.displayMedium, { color: '#FFFFFF' }]}>{country.name}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xl }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 4 }]}>
            CULINARY HERITAGE
          </Text>
          <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            {country.cuisineLabel}
          </Text>
          <Text style={[Typography.body, { color: colors.onSurfaceVariant, marginBottom: Spacing.xl }]}>
            {country.description}
          </Text>

          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: 4 }]}>
            SIGNATURE RECIPES
          </Text>
          <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
            Signature Recipes
          </Text>

          {countryRecipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
              style={[styles.recipeRow, { backgroundColor: colors.surfaceContainerLow }]}
              accessibilityRole="button"
              accessibilityLabel={`${recipe.title}, ${recipe.cookTime} minutes, ${recipe.difficulty}`}
            >
              <Image
                source={{ uri: recipe.image }}
                style={styles.recipeThumb}
                contentFit="cover"
                transition={300}
                accessibilityLabel={recipe.title}
              />
              <View style={styles.recipeInfo}>
                <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 17 }]} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Text style={[Typography.caption, { color: colors.outline }]}>
                  {recipe.cookTime} min {'\u00B7'} {recipe.difficulty}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.outline} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: {
    height: 360,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: Spacing.page,
    zIndex: 10,
  },
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
    gap: Spacing.sm,
  },
  flagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 56,
  },
  recipeThumb: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  recipeInfo: {
    flex: 1,
    gap: 4,
  },
});
