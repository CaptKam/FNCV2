import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useThemeColors } from '@/hooks/useThemeColors';
import { GlassView } from './GlassView';
import { Recipe } from '@/data/recipes';

const CARD_WIDTH = (Dimensions.get('window').width - Spacing.page * 2 - Spacing.md) / 2;

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const [isFav, setIsFav] = useState(false);

  return (
    <Pressable
      onPress={() => router.push(`/recipe/${recipe.id}`)}
      style={[styles.card, { backgroundColor: colors.surfaceContainer, width: CARD_WIDTH }]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: recipe.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <Pressable
          onPress={(e) => { e.stopPropagation(); setIsFav(!isFav); }}
          style={styles.heartButton}
          hitSlop={8}
        >
          <GlassView style={styles.heartGlass}>
            <Feather
              name={isFav ? 'heart' : 'heart'}
              size={16}
              color={isFav ? colors.primary : '#FFFFFF'}
            />
          </GlassView>
        </Pressable>
      </View>
      <View style={styles.content}>
        <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 16 }]} numberOfLines={2}>
          {recipe.title}
        </Text>
        <View style={[styles.timeBadge, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Feather name="clock" size={10} color={colors.outline} />
          <Text style={[Typography.caption, { color: colors.outline }]}>
            {recipe.prepTime + recipe.cookTime} min
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    height: 192,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  heartGlass: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
});
