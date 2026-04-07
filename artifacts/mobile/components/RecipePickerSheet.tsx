import React, { useState, useMemo } from 'react';
import { View, Text, Modal, Pressable, FlatList, TextInput, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { recipes, Recipe } from '@/data/recipes';
import { countries } from '@/data/countries';

interface RecipePickerSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (recipe: Recipe) => void;
}

export function RecipePickerSheet({ visible, onDismiss, onSelect }: RecipePickerSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <Pressable style={styles.overlayDismiss} onPress={onDismiss} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.handleBar }]} />
          <View style={styles.header}>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>Pick a Recipe</Text>
            <Pressable
              onPress={onDismiss}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={24} color={colors.outline} />
            </Pressable>
          </View>

          <View style={[styles.searchRow, { backgroundColor: colors.surfaceContainerLow }]}>
            <Feather name="search" size={18} color={colors.outline} />
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
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={[styles.row, { backgroundColor: colors.surfaceContainerLow }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.cookTime} minutes`}
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
                      {country?.flag} {country?.name} {'\u00B7'} {item.cookTime}m {'\u00B7'} {item.difficulty}
                    </Text>
                  </View>
                  <Feather name="plus" size={20} color={colors.primary} />
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.page,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
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
