import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { recipes } from '@/data/recipes';

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  checked: boolean;
  aisle?: string;
}

const CATEGORIES = [
  { emoji: '\u{1F96C}', name: 'Produce' },
  { emoji: '\u{1F969}', name: 'Protein' },
  { emoji: '\u{1F9C0}', name: 'Dairy' },
  { emoji: '\u{1F36F}', name: 'Pantry' },
  { emoji: '\u{1F9C2}', name: 'Spices' },
];

function buildGroceryList(): GroceryItem[] {
  const selectedRecipes = recipes.slice(0, 4);
  const items: GroceryItem[] = [];
  const seen = new Set<string>();

  selectedRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      if (!seen.has(ing.name)) {
        seen.add(ing.name);
        items.push({
          id: `${recipe.id}-${ing.name}`,
          name: ing.name,
          amount: ing.amount,
          category: ing.category,
          checked: false,
          aisle: `${(items.length % 12) + 1}`,
        });
      }
    });
  });
  return items;
}

export default function GroceryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'online' | 'instore'>('online');
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(buildGroceryList);

  const toggleItem = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const groupedItems = CATEGORIES.map((cat) => ({
    ...cat,
    items: groceryItems.filter((item) => item.category === cat.name),
  })).filter((group) => group.items.length > 0);

  const checkedCount = groceryItems.filter((i) => i.checked).length;
  const totalCount = groceryItems.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 16 }}
      >
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.lg }}>
          <Text style={[Typography.labelLarge, { color: colors.outline }]}>WEEKLY PROVISIONS</Text>
          <Text style={[Typography.display, { color: colors.onSurface }]}>My Groceries</Text>
        </View>

        <View style={[styles.tabToggle, { paddingHorizontal: Spacing.page }]}>
          <Pressable
            onPress={() => setActiveTab('online')}
            style={[
              styles.tabPill,
              { backgroundColor: activeTab === 'online' ? colors.surfaceContainerLowest : 'transparent' },
            ]}
          >
            <Text
              style={[
                Typography.titleSmall,
                { color: activeTab === 'online' ? colors.onSurface : colors.outline },
              ]}
            >
              Online
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('instore')}
            style={[
              styles.tabPill,
              { backgroundColor: activeTab === 'instore' ? colors.surfaceContainerLowest : 'transparent' },
            ]}
          >
            <Text
              style={[
                Typography.titleSmall,
                { color: activeTab === 'instore' ? colors.onSurface : colors.outline },
              ]}
            >
              In-Store
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipeListContainer}
        >
          {recipes.slice(0, 4).map((recipe) => (
            <View key={recipe.id} style={[styles.recipeChip, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Feather name="book-open" size={14} color={colors.onSurface} />
              <View>
                <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Text style={[Typography.caption, { color: colors.outline }]}>
                  {recipe.ingredients.length} items
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {groupedItems.map((group) => (
          <View key={group.name} style={styles.categorySection}>
            <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.sm }}>
              <Text style={[Typography.headline, { color: colors.onSurface }]}>
                {group.emoji} {group.name}
              </Text>
            </View>
            {group.items.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => toggleItem(item.id)}
                style={[
                  styles.itemRow,
                  {
                    backgroundColor: colors.surfaceContainerLow,
                    marginHorizontal: Spacing.page,
                  },
                ]}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: item.checked ? colors.success : colors.outline,
                      backgroundColor: item.checked ? colors.success : 'transparent',
                    },
                  ]}
                >
                  {item.checked && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      Typography.body,
                      {
                        color: item.checked ? colors.outline : colors.onSurface,
                        textDecorationLine: item.checked ? 'line-through' : 'none',
                      },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                    {item.amount}
                  </Text>
                </View>
                {item.checked ? (
                  <View style={[styles.pantryBadge, { backgroundColor: `${colors.success}20` }]}>
                    <Text style={[Typography.labelSmall, { color: colors.success }]}>IN PANTRY</Text>
                  </View>
                ) : (
                  <Text style={[Typography.caption, { color: colors.outline }]}>
                    Aisle {item.aisle}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.bottomBar, { bottom: 80 }]}>
        <LinearGradient
          colors={[colors.primary, '#753000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomBarGradient}
        >
          <View>
            <Text style={[Typography.labelSmall, { color: 'rgba(255,255,255,0.7)' }]}>SUBTOTAL</Text>
            <Text style={[Typography.titleMedium, { color: '#FFFFFF' }]}>
              {checkedCount}/{totalCount} items
            </Text>
          </View>
          <Pressable style={styles.orderBtn}>
            <Text style={[Typography.titleSmall, { color: colors.primary }]}>
              ORDER FROM INSTACART
            </Text>
          </Pressable>
          <Feather name="arrow-right" size={20} color="#FFFFFF" />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tabPill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  recipeListContainer: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  recipeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    marginRight: Spacing.sm,
    maxWidth: 180,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pantryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  bottomBar: {
    position: 'absolute',
    left: Spacing.page,
    right: Spacing.page,
  },
  bottomBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  orderBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
});
