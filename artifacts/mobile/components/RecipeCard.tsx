import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useThemeColors } from '@/hooks/useThemeColors';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { Recipe } from '@/data/recipes';
import { formatCookTime } from '@/data/helpers';
import { ALLERGEN_INFO, AllergenType, getDietaryConflicts } from '@/utils/allergens';
import { useBookmarks } from '@/context/BookmarksContext';
import { useApp } from '@/context/AppContext';
import { AnimatedHeart } from './AnimatedHeart';
import { AddToPlanButton } from './AddToPlanSheet';

interface RecipeCardProps {
  recipe: Recipe;
  onAdd?: () => void;
}

export function RecipeCard({ recipe, onAdd }: RecipeCardProps) {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = (width - Spacing.page * 2 - 12) / 2;
  const colors = useThemeColors();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { allergens: userAllergens, dietaryFlags } = useApp();
  const isFav = isBookmarked(recipe.id);
  const recipeAllergens = recipe.allergens as AllergenType[];
  const hasUserAllergenConflict = userAllergens.length > 0 && recipeAllergens.some((a) => userAllergens.includes(a));
  const hasDietaryConflict = getDietaryConflicts(recipeAllergens, dietaryFlags).length > 0;
  const hasConflict = hasUserAllergenConflict || hasDietaryConflict;

  return (
    <PressableScale
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      style={[styles.card, { backgroundColor: colors.surfaceContainer, width: CARD_WIDTH }]}
      accessibilityRole="button"
      accessibilityLabel={`${recipe.title}, ${formatCookTime(recipe.prepTime + recipe.cookTime)}, ${recipe.difficulty}`}
      scaleDown={0.97}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
          accessibilityLabel={recipe.title}
        />
        <View style={styles.overlayStack}>
          <Pressable
            onPress={(e) => { e.stopPropagation(); toggleBookmark(recipe.id); }}
            style={[styles.overlayBtn, {
              backgroundColor: OVERLAY_BUTTON.background,
              borderWidth: OVERLAY_BUTTON.borderWidth,
              borderColor: OVERLAY_BUTTON.borderColor,
            }]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isFav ? `Remove ${recipe.title} from bookmarks` : `Save ${recipe.title} to bookmarks`}
          >
            <AnimatedHeart
              filled={isFav}
              onToggle={() => toggleBookmark(recipe.id)}
              size={OVERLAY_BUTTON.iconSize}
              filledColor={colors.primary}
              outlineColor={OVERLAY_BUTTON.iconColor}
              hitSlop={0}
            />
          </Pressable>
          {onAdd && (
            <AddToPlanButton onPress={onAdd} recipeName={recipe.title} variant="overlay" />
          )}
        </View>
      </View>
      <View style={styles.content}>
        <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18 }]} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={styles.badgeRow}>
          <View style={[styles.timeBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.outline} />
            <Text style={[Typography.caption, { color: colors.outline }]}>
              {formatCookTime(recipe.prepTime + recipe.cookTime)}
            </Text>
          </View>
          {hasConflict && (
            <View style={[styles.allergenBadge, { backgroundColor: `${colors.error}18` }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[Typography.caption, { color: colors.error, fontSize: 10 }]}>Allergen</Text>
            </View>
          )}
        </View>
        {recipeAllergens.length > 0 && (
          <View style={styles.allergenDotsRow}>
            {recipeAllergens.slice(0, 4).map((a) => {
              const info = ALLERGEN_INFO[a];
              if (!info) return null;
              const isConflict = userAllergens.includes(a);
              return (
                <View
                  key={a}
                  style={[
                    styles.allergenDot,
                    {
                      backgroundColor: isConflict ? `${colors.error}18` : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={info.icon}
                    size={16}
                    color={isConflict ? colors.error : colors.outline}
                  />
                  <Text style={[Typography.caption, { fontSize: 9, color: isConflict ? colors.error : colors.outline }]}>
                    {info.label}
                  </Text>
                </View>
              );
            })}
            {recipeAllergens.length > 4 && (
              <Text style={[Typography.caption, { fontSize: 9, color: colors.outline }]}>
                +{recipeAllergens.length - 4}
              </Text>
            )}
          </View>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageContainer: {
    height: 160,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayStack: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    gap: 6,
    alignItems: 'center',
  },
  overlayBtn: {
    width: OVERLAY_BUTTON.size,
    height: OVERLAY_BUTTON.size,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    gap: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  allergenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  allergenDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  allergenDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
});
