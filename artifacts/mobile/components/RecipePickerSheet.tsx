import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, FlatList, TextInput, StyleSheet } from 'react-native';
import { PressableScale } from '@/components/PressableScale';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';
import { formatCookTime } from '@/data/helpers';
import { BottomSheet } from '@/components/BottomSheet';

interface RecipePickerSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (recipe: Recipe) => void;
}

/**
 * Full-size recipe picker — Standard C (85% screen height).
 *
 * Search bar + scrollable list of all recipes. Tapping a recipe
 * calls onSelect and closes the sheet. Uses the shared BottomSheet
 * for consistent drag handle, dim overlay, spring animation, and
 * swipe-to-dismiss.
 */
export function RecipePickerSheet({ visible, onDismiss, onSelect }: RecipePickerSheetProps) {
  const colors = useThemeColors();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return recipes;
    const q = query.toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [query]);

  const handleSelect = (recipe: Recipe) => {
    onSelect(recipe);
    setQuery('');
    onDismiss();
  };

  return (
    <BottomSheet
      visible={visible}
      onDismiss={() => {
        setQuery('');
        onDismiss();
      }}
      size="full"
      title="Pick a Recipe"
      showCloseButton
    >
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceContainerHigh }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.outline} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search recipes..."
          placeholderTextColor={colors.outline}
          style={[Typography.body, { color: colors.onSurface, flex: 1 }]}
          accessibilityLabel="Search recipes"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => {
          const country = countries.find((c) => c.id === item.countryId);
          return (
            <PressableScale
              onPress={() => handleSelect(item)}
              style={[styles.row, { backgroundColor: colors.surfaceContainerHigh }]}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.cookTime} minutes`}
              scaleDown={0.98}
            >
              <Image
                source={{ uri: item.image }}
                style={styles.thumb}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.rowText}>
                <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[Typography.caption, { color: colors.outline }]}>
                  {country?.flag} {country?.name} {'\u00B7'} {formatCookTime(item.cookTime)} {'\u00B7'} {item.difficulty}
                </Text>
              </View>
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            </PressableScale>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
