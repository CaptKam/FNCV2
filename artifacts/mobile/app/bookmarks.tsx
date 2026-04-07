import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { useBookmarks } from '@/context/BookmarksContext';
import { HeaderBar } from '@/components/HeaderBar';

const FILTERS = ['All', 'Main', 'Appetizer', 'Dessert'];

export default function BookmarksScreen() {
  const colors = useThemeColors();
  const isDark = colors.isDark;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookmarkedIds, toggleBookmark } = useBookmarks();
  const [activeFilter, setActiveFilter] = useState('All');

  const savedRecipes = useMemo(() => {
    let results = recipes.filter((r) => bookmarkedIds.includes(r.id));
    if (activeFilter !== 'All') {
      results = results.filter((r) => r.category === activeFilter.toLowerCase());
    }
    return results;
  }, [bookmarkedIds, activeFilter]);

  const recentRecipes = savedRecipes.slice(0, 3);
  const archiveRecipes = savedRecipes.slice(3);

  const getCountryName = (countryId: string) => {
    const country = countries.find((c) => c.id === countryId);
    return country ? country.name : countryId;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 76 }}
      >

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: activeFilter === f ? colors.primary : colors.surfaceContainer,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === f }}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: activeFilter === f ? colors.onPrimary : colors.onSurfaceVariant },
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {savedRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="bookmark-outline" size={48} color={colors.outline} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Your collection is empty
            </Text>
            <Text style={[styles.emptyBody, { color: colors.outline }]}>
              Heart any recipe to save it here for later.
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Explore recipes"
            >
              <Text style={[styles.exploreBtnText, { color: colors.onPrimary }]}>Explore Recipes</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {recentRecipes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recently Saved</Text>
                  <Text style={[styles.sectionBadge, { color: colors.primary }]}>
                    {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.listGroup}>
                  {recentRecipes.map((recipe) => (
                    <Pressable
                      key={recipe.id}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      style={styles.itemRow}
                      accessibilityRole="button"
                      accessibilityLabel={`${recipe.title}, ${recipe.prepTime + recipe.cookTime} minutes`}
                    >
                      <View style={[styles.itemThumb, { backgroundColor: colors.surfaceContainer }]}>
                        <Image
                          source={{ uri: recipe.image }}
                          style={styles.itemImage}
                          contentFit="cover"
                          transition={200}
                          accessibilityLabel={recipe.title}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemCategory, { color: colors.primary }]}>
                          {getCountryName(recipe.countryId)}
                        </Text>
                        <Text style={[styles.itemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                          {recipe.difficulty} · {recipe.prepTime + recipe.cookTime} min · {recipe.category}
                        </Text>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleBookmark(recipe.id);
                        }}
                        hitSlop={8}
                        style={styles.heartBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${recipe.title} from bookmarks`}
                      >
                        <MaterialCommunityIcons name="heart" size={22} color={colors.primary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {archiveRecipes.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.onSurface, opacity: 0.6 }]}>From the Archives</Text>
                  <Text style={[styles.sectionBadge, { color: colors.onSurfaceVariant }]}>Older</Text>
                </View>
                <View style={styles.listGroup}>
                  {archiveRecipes.map((recipe) => (
                    <Pressable
                      key={recipe.id}
                      onPress={() => router.push(`/recipe/${recipe.id}`)}
                      style={styles.itemRow}
                      accessibilityRole="button"
                      accessibilityLabel={`${recipe.title}, ${recipe.prepTime + recipe.cookTime} minutes`}
                    >
                      <View style={[styles.itemThumb, { backgroundColor: colors.surfaceContainer }]}>
                        <Image
                          source={{ uri: recipe.image }}
                          style={styles.itemImage}
                          contentFit="cover"
                          transition={200}
                          accessibilityLabel={recipe.title}
                        />
                      </View>
                      <View style={styles.itemContent}>
                        <Text style={[styles.itemCategory, { color: colors.onSurfaceVariant }]}>
                          {getCountryName(recipe.countryId)}
                        </Text>
                        <Text style={[styles.itemTitle, { color: colors.onSurface }]} numberOfLines={1}>
                          {recipe.title}
                        </Text>
                        <Text style={[styles.itemMeta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                          {recipe.difficulty} · {recipe.prepTime + recipe.cookTime} min · {recipe.category}
                        </Text>
                      </View>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleBookmark(recipe.id);
                        }}
                        hitSlop={8}
                        style={styles.heartBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${recipe.title} from bookmarks`}
                      >
                        <MaterialCommunityIcons name="heart" size={22} color={colors.primary} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterRow: {
    paddingHorizontal: Spacing.page,
    gap: 10,
    marginBottom: Spacing.xl,
    paddingBottom: 2,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    gap: Spacing.md,
    paddingHorizontal: Spacing.page,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  exploreBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  listGroup: {
    paddingHorizontal: Spacing.page,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  itemThumb: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
    gap: 3,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  itemTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  itemMeta: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  heartBtn: {
    padding: 8,
  },
});
