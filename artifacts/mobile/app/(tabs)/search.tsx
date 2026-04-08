import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { DestinationCard } from '@/components/DestinationCard';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MOODS = ['All Moods', 'Quick & Easy', 'Comfort Food', 'Date Night', 'Adventurous', 'Healthy', 'Sweet'];

export default function SearchScreen() {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - Spacing.md) / 2;
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeMood, setActiveMood] = useState('All Moods');

  const filteredRecipes = useMemo(() => {
    let results = recipes;

    if (activeMood !== 'All Moods') {
      const moodMap: Record<string, (r: typeof recipes[0]) => boolean> = {
        'Quick & Easy': (r) => r.prepTime + r.cookTime <= 30 && r.difficulty === 'Easy',
        'Comfort Food': (r) => r.category === 'main' && r.cookTime >= 30,
        'Date Night': (r) => r.difficulty === 'Hard' || r.cookTime >= 60,
        'Adventurous': (r) => ['japan', 'thailand', 'morocco', 'india', 'mexico'].includes(r.countryId),
        'Healthy': (r) => r.ingredients.some((i) => i.category === 'Produce'),
        'Sweet': (r) => r.category === 'dessert',
      };
      const filter = moodMap[activeMood];
      if (filter) results = results.filter(filter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }

    return results;
  }, [query, activeMood]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 76 }}
      >
        <View style={{ paddingHorizontal: Spacing.page }}>
          <Text style={[Typography.displayLarge, { color: colors.onSurface, fontSize: 42 }]}>
            Search
          </Text>
        </View>

        <View style={[styles.searchContainer, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.searchInput, { backgroundColor: colors.surfaceContainerLow }]}>
            <Feather name="search" size={20} color={colors.outline} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Ingredients, dishes, or moods..."
              placeholderTextColor={colors.outline}
              style={[Typography.body, { color: colors.onSurface, flex: 1 }]}
              accessibilityLabel="Search recipes or countries"
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {MOODS.map((mood) => (
            <Pressable
              key={mood}
              onPress={() => setActiveMood(mood)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    activeMood === mood ? colors.primary : colors.surfaceContainerHigh,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${mood}`}
              accessibilityState={{ selected: activeMood === mood }}
            >
              <Text
                style={[
                  Typography.titleSmall,
                  {
                    color: activeMood === mood ? colors.onPrimary : colors.onSurface,
                  },
                ]}
              >
                {mood}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Result count */}
        {query.trim().length > 0 && filteredRecipes.length > 0 && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
              {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}

        {/* Empty state when searching with no results */}
        {query.trim().length > 0 && filteredRecipes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="magnify" size={32} color={colors.onSurfaceVariant} />
            </View>
            <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
              No matches found
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Try different keywords or browse by mood
            </Text>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginTop: Spacing.xl }]}>
              OR EXPLORE THESE COUNTRIES
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.md, paddingHorizontal: Spacing.page, paddingTop: Spacing.md }}>
              {countries.slice(0, 4).map((country) => (
                <DestinationCard key={country.id} country={country} />
              ))}
            </ScrollView>
          </View>
        ) : (
        <View style={styles.grid}>
          {filteredRecipes.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() => router.push(`/recipe/${recipe.id}`)}
              style={[styles.card, { width: CARD_WIDTH }]}
              accessibilityRole="button"
              accessibilityLabel={`${recipe.title}, ${recipe.prepTime + recipe.cookTime} minutes, ${recipe.difficulty}`}
            >
              <Image
                source={{ uri: recipe.image }}
                style={styles.cardImage}
                contentFit="cover"
                transition={300}
                accessibilityLabel={recipe.title}
              />
              <View style={styles.cardContent}>
                <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18 }]} numberOfLines={2}>
                  {recipe.title}
                </Text>
                <Text style={[Typography.labelSmall, { color: colors.outline }]}>
                  {recipe.difficulty} {'\u00B7'} {recipe.prepTime + recipe.cookTime} min
                </Text>
                <Pressable
                  onPress={() => router.push(`/recipe/${recipe.id}`)}
                  style={styles.addButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${recipe.title}`}
                >
                  <Text style={[Typography.titleSmall, { color: colors.primary }]}>ADD +</Text>
                </Pressable>
              </View>
              <Pressable style={styles.heartBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Save ${recipe.title} to bookmarks`}>
                <GlassView style={styles.heartGlass}>
                  <Feather name="heart" size={14} color={colors.textOnImage} />
                </GlassView>
              </Pressable>
            </Pressable>
          ))}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { marginTop: Spacing.md, marginBottom: Spacing.md },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.sm,
  },
  chipContainer: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
  },
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: Spacing.md,
    gap: 6,
  },
  addButton: {
    marginTop: 4,
  },
  heartBtn: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  heartGlass: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingHorizontal: Spacing.page,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
});
