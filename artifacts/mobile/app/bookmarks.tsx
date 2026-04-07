import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { useBookmarks } from '@/context/BookmarksContext';

export default function BookmarksScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();

  const savedRecipes = recipes.filter((r) => bookmarkedIds.includes(r.id));

  const groupedByCountry = savedRecipes.reduce(
    (acc, recipe) => {
      if (!acc[recipe.countryId]) acc[recipe.countryId] = [];
      acc[recipe.countryId].push(recipe);
      return acc;
    },
    {} as Record<string, typeof savedRecipes>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}
      >
        <View style={[styles.header, { paddingHorizontal: Spacing.page }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={[Typography.title, { color: colors.onSurface }]}>Saved Recipes</Text>
          <View style={{ width: 24 }} />
        </View>

        {savedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="bookmark-outline" size={48} color={colors.outline} />
            </View>
            <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
              No saved recipes yet
            </Text>
            <Text
              style={[
                Typography.body,
                { color: colors.outline, textAlign: 'center', paddingHorizontal: Spacing.xl },
              ]}
            >
              Tap the heart on any recipe to save it here for easy access later.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Explore recipes"
            >
              <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>Explore Recipes</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
              <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''} saved
              </Text>
            </View>

            {Object.entries(groupedByCountry).map(([countryId, countryRecipes]) => {
              const country = countries.find((c) => c.id === countryId);
              if (!country) return null;
              return (
                <View key={countryId} style={styles.countrySection}>
                  <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
                    <Text style={[Typography.labelLarge, { color: colors.outline }]}>
                      {country.flag} {country.name.toUpperCase()}
                    </Text>
                  </View>
                  {countryRecipes.map((recipe) => (
                    <Pressable
                      key={recipe.id}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      style={[
                        styles.recipeRow,
                        {
                          backgroundColor: colors.surfaceContainerLow,
                          marginHorizontal: Spacing.page,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${recipe.title}, ${recipe.prepTime + recipe.cookTime} minutes, ${recipe.difficulty}`}
                    >
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.recipeThumb}
                        contentFit="cover"
                        transition={200}
                        accessibilityLabel={recipe.title}
                      />
                      <View style={styles.recipeInfo}>
                        <Text
                          style={[Typography.titleSmall, { color: colors.onSurface }]}
                          numberOfLines={1}
                        >
                          {recipe.title}
                        </Text>
                        <View style={styles.metaRow}>
                          <Feather name="clock" size={12} color={colors.outline} />
                          <Text style={[Typography.caption, { color: colors.outline }]}>
                            {recipe.prepTime + recipe.cookTime} min
                          </Text>
                          <View style={styles.dot} />
                          <Text style={[Typography.caption, { color: colors.outline }]}>
                            {recipe.difficulty}
                          </Text>
                          <View style={styles.dot} />
                          <Text style={[Typography.caption, { color: colors.outline }]}>
                            {recipe.category}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleBookmark(recipe.id);
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${recipe.title} from bookmarks`}
                      >
                        <MaterialCommunityIcons name="heart" size={22} color={colors.primary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  exploreBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: Spacing.md,
  },
  countrySection: {
    marginBottom: Spacing.lg,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  recipeThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  recipeInfo: {
    flex: 1,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
  },
});
