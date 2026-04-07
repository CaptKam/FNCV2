import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { GlassView } from '@/components/GlassView';
import { recipes } from '@/data/recipes';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  checked: boolean;
  recipeCount: number;
}

interface Category {
  icon: IconName;
  name: string;
  color: string;
}

interface Retailer {
  name: string;
  icon: IconName;
}

const CATEGORIES: Category[] = [
  { icon: 'leaf', name: 'Produce', color: '#4CAF50' },
  { icon: 'food-steak', name: 'Protein', color: '#E57373' },
  { icon: 'cheese', name: 'Dairy', color: '#FFD54F' },
  { icon: 'package-variant-closed', name: 'Pantry', color: '#A1887F' },
  { icon: 'shaker-outline', name: 'Spices', color: '#FF8A65' },
  { icon: 'dots-horizontal', name: 'Other', color: '#90A4AE' },
];

const RETAILERS: Retailer[] = [
  { name: 'Walmart', icon: 'store' },
  { name: 'Amazon Fresh', icon: 'truck-delivery' },
  { name: 'Instacart', icon: 'cart' },
  { name: 'Target', icon: 'bullseye' },
];

function buildGroceryList(sourceRecipes: typeof recipes): GroceryItem[] {
  const items: GroceryItem[] = [];
  const seen = new Map<string, number>();

  sourceRecipes.forEach((recipe) => {
    recipe.ingredients.forEach((ing) => {
      const existing = seen.get(ing.name);
      if (existing !== undefined) {
        items[existing].recipeCount += 1;
      } else {
        seen.set(ing.name, items.length);
        items.push({
          id: `${recipe.id}-${ing.name}`,
          name: ing.name,
          amount: ing.amount,
          category: ing.category,
          checked: false,
          recipeCount: 1,
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
  const [selectedRetailer, setSelectedRetailer] = useState(2);
  const [zipCode, setZipCode] = useState('10001');
  const [activeRecipes, setActiveRecipes] = useState(() => recipes.slice(0, 4));
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const groceryItems = useMemo(() => {
    const items = buildGroceryList(activeRecipes);
    return items.map((item) => ({ ...item, checked: checkedIds.has(item.name) }));
  }, [activeRecipes, checkedIds]);

  const toggleItem = (name: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const removeRecipe = (recipeId: string) => {
    setActiveRecipes((prev) => prev.filter((r) => r.id !== recipeId));
  };

  const groupedItems = useMemo(() => {
    return CATEGORIES.map((cat) => ({
      ...cat,
      items: groceryItems.filter((item) => item.category === cat.name),
    }));
  }, [groceryItems]);

  const checkedCount = groceryItems.filter((i) => i.checked).length;
  const totalCount = groceryItems.length;
  const recipeCount = activeRecipes.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: insets.top + 16 }}
      >
        <View style={styles.titleSection}>
          <Text style={[Typography.labelLarge, { color: colors.outline, textAlign: 'center', marginBottom: Spacing.xs }]}>
            WEEKLY PROVISIONS
          </Text>
          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center' }]}>
            My Groceries
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.xs }]}>
            {recipeCount} Recipes  •  {totalCount} Items
          </Text>
        </View>

        <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceContainerLow }]}>
          <Pressable
            onPress={() => setActiveTab('online')}
            style={[
              styles.togglePill,
              activeTab === 'online' && { backgroundColor: colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="truck-delivery-outline"
              size={16}
              color={activeTab === 'online' ? colors.onPrimary : colors.outline}
            />
            <Text
              style={[
                Typography.titleSmall,
                { color: activeTab === 'online' ? colors.onPrimary : colors.outline },
              ]}
            >
              Online
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('instore')}
            style={[
              styles.togglePill,
              activeTab === 'instore' && { backgroundColor: colors.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="store-outline"
              size={16}
              color={activeTab === 'instore' ? colors.onPrimary : colors.outline}
            />
            <Text
              style={[
                Typography.titleSmall,
                { color: activeTab === 'instore' ? colors.onPrimary : colors.outline },
              ]}
            >
              In-Store
            </Text>
          </Pressable>
        </View>

        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={[Typography.headline, { color: colors.onSurface, paddingHorizontal: Spacing.page, marginBottom: Spacing.md }]}>
            Active Recipe Sources
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recipeCarousel}
          >
            {activeRecipes.map((recipe) => (
              <GlassView
                key={recipe.id}
                style={[styles.recipeCard, { borderRadius: Radius.lg }]}
              >
                <View style={styles.recipeImageWrap}>
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.recipeImage}
                  />
                  <View style={[styles.servingBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                    <MaterialCommunityIcons name="account-group-outline" size={12} color="#FFFFFF" />
                    <Text style={[Typography.labelSmall, { color: '#FFFFFF' }]}>
                      {recipe.servings} servings
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeRecipe(recipe.id)}
                    style={[styles.recipeCloseBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                  >
                    <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
                <View style={styles.recipeCardContent}>
                  <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
                    {recipe.title}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.outline }]}>
                    {recipe.ingredients.length} ingredients
                  </Text>
                  <Pressable>
                    <Text style={[Typography.caption, { color: colors.primary, marginTop: 2 }]}>
                      View Recipe
                    </Text>
                  </Pressable>
                </View>
              </GlassView>
            ))}
          </ScrollView>
        </View>

        {activeTab === 'online' && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
            <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center', marginBottom: Spacing.md }]}>
              Select Retailer
            </Text>
            <View style={[styles.zipInputContainer, { backgroundColor: colors.surfaceContainerLow, borderRadius: Radius.md }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.outline} />
              <TextInput
                value={zipCode}
                onChangeText={setZipCode}
                style={[Typography.body, { flex: 1, color: colors.onSurface, paddingVertical: Spacing.sm }]}
                placeholder="Enter zip code"
                placeholderTextColor={colors.outline}
                keyboardType="number-pad"
              />
              <MaterialCommunityIcons name="magnify" size={20} color={colors.primary} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.retailerRow}
            >
              {RETAILERS.map((retailer, index) => (
                <Pressable
                  key={retailer.name}
                  onPress={() => setSelectedRetailer(index)}
                  style={styles.retailerItem}
                >
                  <View
                    style={[
                      styles.retailerCircle,
                      {
                        backgroundColor: selectedRetailer === index
                          ? `${colors.primary}15`
                          : colors.surfaceContainerLow,
                      },
                      selectedRetailer === index && {
                        ...Shadows.subtle,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={retailer.icon}
                      size={28}
                      color={selectedRetailer === index ? colors.primary : colors.outline}
                    />
                  </View>
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color: selectedRetailer === index ? colors.primary : colors.outline,
                        textAlign: 'center',
                        marginTop: Spacing.xs,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {retailer.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {groupedItems.map((group) => (
          <View key={group.name} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconCircle, { backgroundColor: `${group.color}20` }]}>
                <MaterialCommunityIcons name={group.icon} size={18} color={group.color} />
              </View>
              <Text style={[Typography.headline, { color: colors.onSurface, flex: 1 }]}>
                {group.name}
              </Text>
              {group.items.length > 0 && (
                <Text style={[Typography.caption, { color: colors.outline }]}>
                  {group.items.filter((i) => i.checked).length}/{group.items.length}
                </Text>
              )}
            </View>

            {group.items.length === 0 ? (
              <View
                style={[
                  styles.emptyCategory,
                  {
                    borderColor: colors.outlineVariant,
                    marginHorizontal: Spacing.page,
                  },
                ]}
              >
                <MaterialCommunityIcons name={group.icon} size={24} color={colors.outlineVariant} />
                <Text style={[Typography.bodySmall, { color: colors.outline, marginTop: Spacing.xs }]}>
                  No {group.name.toLowerCase()} items needed
                </Text>
              </View>
            ) : (
              group.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => toggleItem(item.name)}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      marginHorizontal: Spacing.page,
                    },
                  ]}
                >
                  <View style={[styles.ingredientThumb, { backgroundColor: `${group.color}25` }]}>
                    <MaterialCommunityIcons name={group.icon} size={16} color={group.color} />
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
                    <View style={styles.itemMetaRow}>
                      <Text style={[Typography.caption, { color: colors.outline }]}>
                        {item.amount}
                      </Text>
                      {item.recipeCount > 1 && (
                        <View style={[styles.recipeCountBadge, { backgroundColor: `${colors.primary}15` }]}>
                          <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                            Used in {item.recipeCount} Recipes
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: item.checked ? colors.success : 'transparent',
                        borderColor: item.checked ? colors.success : colors.outlineVariant,
                      },
                    ]}
                  >
                    {item.checked && (
                      <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                    )}
                  </View>
                </Pressable>
              ))
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.stickyBottom, { bottom: 80, paddingHorizontal: Spacing.page }]}>
        <GlassView style={[styles.stickyBottomInner, { borderRadius: Radius.lg }]}>
          <View style={[styles.ecoBanner, { backgroundColor: `${colors.success}12` }]}>
            <MaterialCommunityIcons name="leaf" size={16} color={colors.success} />
            <Text style={[Typography.caption, { color: colors.success, flex: 1 }]}>
              Shopping locally saves ~2.4 lbs of CO₂ per trip
            </Text>
          </View>
          <View style={styles.orderSection}>
            <View style={styles.orderStats}>
              <Text style={[Typography.caption, { color: colors.outline }]}>
                {checkedCount}/{totalCount} items  •  Est. $47.50
              </Text>
            </View>
            <Pressable
              style={[styles.orderButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>
                Order from {RETAILERS[selectedRetailer].name}  •  $47.50
              </Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.onPrimary} />
            </Pressable>
          </View>
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  titleSection: {
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.page,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  togglePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  recipeCarousel: {
    paddingHorizontal: Spacing.page,
    gap: Spacing.md,
  },
  recipeCard: {
    width: 200,
    overflow: 'hidden',
  },
  recipeImageWrap: {
    position: 'relative',
  },
  recipeImage: {
    width: 200,
    height: 130,
  },
  recipeCardContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  servingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  recipeCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zipInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  retailerRow: {
    gap: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  retailerItem: {
    alignItems: 'center',
    width: 72,
  },
  retailerCircle: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.sm,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCategory: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.sm,
    marginBottom: Spacing.sm,
  },
  ingredientThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  recipeCountBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: Radius.xs,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  stickyBottomInner: {
    overflow: 'hidden',
  },
  ecoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  orderSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  orderStats: {
    alignItems: 'center',
  },
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
});
