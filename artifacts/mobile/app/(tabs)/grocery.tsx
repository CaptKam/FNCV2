import React, { useState, useMemo, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { PressableScale } from '@/components/PressableScale';
import { useApp, GroceryItem } from '@/context/AppContext';
import { recipes as allRecipes } from '@/data/recipes';
import { convertAmount } from '@/data/helpers';
import { computeScaledAmount } from '@/utils/groceryScaling';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

function parseAmountForDisplay(amount: string): { qty: number; unit: string } | null {
  const match = amount.trim().match(/^([\d./]+)\s*(.*)/);
  if (!match) return null;
  const fracMatch = match[1].match(/^(\d+)\/(\d+)$/);
  const qty = fracMatch
    ? parseInt(fracMatch[1], 10) / parseInt(fracMatch[2], 10)
    : parseFloat(match[1]);
  if (isNaN(qty)) return null;
  return { qty, unit: match[2].trim().toLowerCase() };
}

function normalizeDisplayUnit(u: string): string {
  const map: Record<string, string> = {
    g: 'g', gram: 'g', grams: 'g', kg: 'kg',
    ml: 'ml', l: 'l', cup: 'cup', cups: 'cup',
    tbsp: 'tbsp', tsp: 'tsp', oz: 'oz', lb: 'lb', lbs: 'lb',
    piece: 'piece', pieces: 'piece', clove: 'clove', cloves: 'clove',
  };
  return map[u] ?? u;
}

function fmtQty(n: number): string {
  const r = Math.round(n * 10) / 10;
  return r === Math.floor(r) ? String(Math.floor(r)) : r.toFixed(1);
}

function aggregateDisplayAmounts(a: string, b: string): string {
  const pa = parseAmountForDisplay(a);
  const pb = parseAmountForDisplay(b);
  if (!pa || !pb) return a + ', ' + b;
  const uA = normalizeDisplayUnit(pa.unit);
  const uB = normalizeDisplayUnit(pb.unit);
  if (uA === uB) {
    const displayUnit = pa.unit || pb.unit;
    return `${fmtQty(pa.qty + pb.qty)}${displayUnit ? (displayUnit.match(/^[a-zA-Z]/) ? ' ' : '') + displayUnit : ''}`;
  }
  if ((uA === 'g' && uB === 'kg') || (uA === 'kg' && uB === 'g')) {
    const totalG = (uA === 'kg' ? pa.qty * 1000 : pa.qty) + (uB === 'kg' ? pb.qty * 1000 : pb.qty);
    return totalG >= 1000 ? `${fmtQty(totalG / 1000)}kg` : `${fmtQty(totalG)}g`;
  }
  if ((uA === 'ml' && uB === 'l') || (uA === 'l' && uB === 'ml')) {
    const totalMl = (uA === 'l' ? pa.qty * 1000 : pa.qty) + (uB === 'l' ? pb.qty * 1000 : pb.qty);
    return totalMl >= 1000 ? `${fmtQty(totalMl / 1000)}l` : `${fmtQty(totalMl)}ml`;
  }
  return a + ', ' + b;
}

interface CategoryDef {
  icon: IconName;
  key: GroceryItem['category'];
  label: string;
}

const CATEGORY_ORDER: CategoryDef[] = [
  { icon: 'leaf', key: 'produce', label: 'Produce' },
  { icon: 'food-steak', key: 'protein', label: 'Protein' },
  { icon: 'cheese', key: 'dairy', label: 'Dairy' },
  { icon: 'shaker-outline', key: 'spice', label: 'Spices' },
  { icon: 'package-variant-closed', key: 'pantry', label: 'Pantry' },
];

interface Retailer {
  id: 'instacart' | 'walmart' | 'amazon_fresh';
  name: string;
  icon: IconName;
  url: string;
}

const RETAILERS: Retailer[] = [
  { id: 'instacart', name: 'Instacart', icon: 'cart', url: 'https://www.instacart.com/store' },
  { id: 'walmart', name: 'Walmart', icon: 'store', url: 'https://www.walmart.com/grocery' },
  { id: 'amazon_fresh', name: 'Amazon Fresh', icon: 'truck-delivery', url: 'https://www.amazon.com/alm/storefront' },
];

export default function GroceryScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const [activeTab, setActiveTab] = useState<'online' | 'instore'>('online');
  const [manualItemName, setManualItemName] = useState('');

  const [servingsOverrides, setServingsOverrides] = useState<Record<string, number>>({});

  const setRecipeServings = useCallback((recipeId: string, servings: number) => {
    setServingsOverrides((prev) => ({ ...prev, [recipeId]: Math.max(1, servings) }));
  }, []);

  const categoryColors: Record<string, string> = {
    produce: colors.categoryProduce,
    protein: colors.categoryProtein,
    dairy: colors.categoryDairy,
    spice: colors.categorySpice,
    pantry: colors.categoryPantry,
  };

  const { groceryItems } = app;
  const uncheckedCount = app.getUncheckedCount();
  const totalCount = groceryItems.length;
  const checkedCount = groceryItems.filter((i) => i.checked).length;

  // Derive unique recipe names from grocery items
  const recipeSourceNames = useMemo(() => {
    const names = new Set<string>();
    groceryItems.forEach((item) => item.recipeNames.forEach((n) => names.add(n)));
    return Array.from(names);
  }, [groceryItems]);

  // Match recipe names to actual recipe objects for the carousel
  const recipeCards = useMemo(() => {
    return recipeSourceNames
      .map((name) => allRecipes.find((r) => r.title === name))
      .filter((r): r is (typeof allRecipes)[0] => r != null);
  }, [recipeSourceNames]);

  // Build a map of recipe title → { baseServings, targetServings } for scaling
  const recipeServingsMap = useMemo(() => {
    const map: Record<string, { base: number; target: number }> = {};
    recipeCards.forEach((r) => {
      map[r.title] = {
        base: r.servings,
        target: servingsOverrides[r.id] ?? r.servings,
      };
    });
    return map;
  }, [recipeCards, servingsOverrides]);

  const getScaledAmount = useCallback(
    (item: GroceryItem): string => {
      if (!item.amount) return '';
      const sources = item.sourceAmounts ?? {};
      if (Object.keys(sources).length > 0) {
        const scaledParts = Object.entries(sources).map(([recipeName, amt]) => {
          const info = recipeServingsMap[recipeName];
          if (info) return computeScaledAmount(amt, info.base, info.target);
          return amt;
        });
        const aggregated = scaledParts.length > 1
          ? scaledParts.reduce((a, b) => aggregateDisplayAmounts(a, b))
          : scaledParts[0];
        return convertAmount(aggregated, app.useMetric);
      }
      return convertAmount(item.amount, app.useMetric);
    },
    [recipeServingsMap, app.useMetric]
  );

  // Group items by category in specified order, sorted: unchecked first
  const groupedItems = useMemo(() => {
    return CATEGORY_ORDER
      .map((cat) => {
        const items = groceryItems
          .filter((item) => item.category === cat.key)
          .sort((a, b) => (a.checked === b.checked ? 0 : a.checked ? 1 : -1));
        return { ...cat, color: categoryColors[cat.key], items };
      })
      .filter((group) => group.items.length > 0);
  }, [groceryItems, colors]);

  const handleAddManualItem = useCallback(() => {
    if (!manualItemName.trim()) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    app.addManualGroceryItem(manualItemName.trim());
    setManualItemName('');
  }, [manualItemName, app]);

  const handleClearChecked = () => {
    app.clearCheckedItems();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Grocery List',
      "Remove all grocery items? This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
          app.clearAllGroceryItems();
        } },
      ]
    );
  };

  if (groceryItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <HeaderBar />
        <View style={styles.emptyRoot}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.primarySubtle }]}>
            <MaterialCommunityIcons name="cart-outline" size={48} color={colors.accentSage} />
          </View>
          <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center' }]}>
            No ingredients yet
          </Text>
          <Text style={[Typography.body, { color: colors.outline, textAlign: 'center', paddingHorizontal: Spacing.xl }]}>
            Plan some meals or add items manually.
          </Text>
          <View style={[styles.manualInputWrap, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant, marginHorizontal: Spacing.xl, marginTop: Spacing.md }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.outline} />
            <TextInput
              value={manualItemName}
              onChangeText={setManualItemName}
              placeholder="Add item (eggs, bread...)"
              placeholderTextColor={colors.outline}
              style={[Typography.body, { flex: 1, color: colors.onSurface, padding: 0 }]}
              returnKeyType="done"
              onSubmitEditing={handleAddManualItem}
            />
            {manualItemName.trim().length > 0 && (
              <Pressable onPress={handleAddManualItem} accessibilityRole="button" accessibilityLabel="Add item">
                <View style={[styles.addBtn, { backgroundColor: colors.accentSage }]}>
                  <Text style={[Typography.titleSmall, { color: '#FFFFFF' }]}>Add</Text>
                </View>
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            style={[styles.emptyBtn, { backgroundColor: colors.accentSage }]}
            accessibilityRole="button"
            accessibilityLabel="Browse recipes"
          >
            <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>Browse Recipes</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: insets.top + 76 }}
      >
        <View style={styles.titleSection}>
          <Text style={[Typography.labelLarge, { color: colors.outline, textAlign: 'center', marginBottom: Spacing.xs }]}>
            WEEKLY PROVISIONS
          </Text>
          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center' }]}>
            My Groceries
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.xs }]}>
            {recipeCards.length > 0 ? `${recipeCards.length} Recipes  •  ` : ''}{totalCount} Items
          </Text>
        </View>

        <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceContainerLow }]}>
          <PressableScale
            onPress={() => setActiveTab('online')}
            style={[
              styles.togglePill,
              activeTab === 'online' && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Online shopping"
            accessibilityState={{ selected: activeTab === 'online' }}
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
          </PressableScale>
          <PressableScale
            onPress={() => setActiveTab('instore')}
            style={[
              styles.togglePill,
              activeTab === 'instore' && { backgroundColor: colors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="In-store shopping"
            accessibilityState={{ selected: activeTab === 'instore' }}
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
          </PressableScale>
        </View>

        {/* Manual item entry */}
        <View style={[styles.manualEntryRow, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.manualInputWrap, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.outline} />
            <TextInput
              value={manualItemName}
              onChangeText={setManualItemName}
              placeholder="Add item (eggs, bread, paper towels...)"
              placeholderTextColor={colors.outline}
              style={[Typography.body, { flex: 1, color: colors.onSurface, padding: 0 }]}
              returnKeyType="done"
              onSubmitEditing={handleAddManualItem}
            />
            {manualItemName.trim().length > 0 && (
              <Pressable onPress={handleAddManualItem} accessibilityRole="button" accessibilityLabel="Add item">
                <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>Add</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Recipe source strip with serving stepper */}
        {recipeCards.length > 0 && (
          <View style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.headline, { color: colors.onSurface, paddingHorizontal: Spacing.page, marginBottom: Spacing.md }]}>
              Active Recipe Sources
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipeCarousel}
            >
              {recipeCards.map((recipe) => {
                const currentServings = servingsOverrides[recipe.id] ?? recipe.servings;
                return (
                  <GlassView
                    key={recipe.id}
                    style={[styles.recipeCard, { borderRadius: Radius.lg }]}
                  >
                    <View style={styles.recipeImageWrap}>
                      <Image
                        source={{ uri: recipe.image }}
                        style={styles.recipeImage}
                        accessible={false}
                      />
                      <Pressable
                        onPress={() => app.removeGroceryItemsByRecipe(recipe.title)}
                        style={[styles.recipeCloseBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${recipe.title} from grocery list`}
                      >
                        <MaterialCommunityIcons name="close" size={14} color={colors.textOnImage} />
                      </Pressable>
                    </View>
                    <View style={styles.recipeCardContent}>
                      <Text style={[Typography.titleSmall, { color: colors.onSurface }]} numberOfLines={1}>
                        {recipe.title}
                      </Text>
                      {/* Serving stepper */}
                      <View style={styles.servingStepper}>
                        <Pressable
                          onPress={() => setRecipeServings(recipe.id, currentServings - 1)}
                          style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerHigh, opacity: currentServings <= 1 ? 0.3 : 1 }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Decrease servings for ${recipe.title}`}
                        >
                          <MaterialCommunityIcons name="minus" size={14} color={colors.primary} />
                        </Pressable>
                        <View style={styles.stepperCount}>
                          <MaterialCommunityIcons name="account-outline" size={12} color={colors.outline} />
                          <Text style={[Typography.caption, { color: colors.onSurface }]}>
                            {currentServings}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setRecipeServings(recipe.id, currentServings + 1)}
                          style={[styles.stepperBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                          accessibilityRole="button"
                          accessibilityLabel={`Increase servings for ${recipe.title}`}
                        >
                          <MaterialCommunityIcons name="plus" size={14} color={colors.primary} />
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => router.push(`/recipe/${recipe.id}`)}
                        accessibilityRole="button"
                        accessibilityLabel={`View recipe ${recipe.title}`}
                      >
                        <Text style={[Typography.titleSmall, { color: colors.primary, marginTop: 2 }]}>
                          View Recipe
                        </Text>
                      </Pressable>
                    </View>
                  </GlassView>
                );
              })}
            </ScrollView>
          </View>
        )}

        {activeTab === 'online' && (
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
            <GlassView style={{ padding: Spacing.xl, alignItems: 'center', borderRadius: Radius.lg }}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.primarySubtle, marginBottom: Spacing.md }]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[Typography.headline, { color: colors.onSurface, textAlign: 'center', marginBottom: Spacing.xs }]}>
                Coming Soon
              </Text>
              <Text style={[Typography.body, { color: colors.outline, textAlign: 'center', marginBottom: Spacing.lg }]}>
                We're working on connecting your favorite grocery delivery services.
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg }}>
                {RETAILERS.map((retailer) => (
                  <View key={retailer.id} style={{ alignItems: 'center', opacity: 0.5 }}>
                    <View
                      style={[
                        styles.retailerCircle,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderWidth: 1,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name={retailer.icon} size={28} color={colors.outline} />
                    </View>
                    <Text style={[Typography.caption, { color: colors.outline, textAlign: 'center', marginTop: Spacing.xs }]} numberOfLines={1}>
                      {retailer.name}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassView>
          </View>
        )}

        {checkedCount > 0 && (
          <View style={[styles.clearRow, { paddingHorizontal: Spacing.page }]}>
            <PressableScale
              onPress={handleClearChecked}
              style={[styles.clearBtn, { borderColor: colors.outlineVariant }]}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${checkedCount} completed items`}
            >
              <MaterialCommunityIcons name="check-all" size={16} color={colors.outline} />
              <Text style={[Typography.titleSmall, { color: colors.outline }]}>
                Clear Completed ({checkedCount})
              </Text>
            </PressableScale>
            <PressableScale
              onPress={handleClearAll}
              style={[styles.clearBtn, { borderColor: colors.error }]}
              accessibilityRole="button"
              accessibilityLabel="Clear all items"
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={[Typography.titleSmall, { color: colors.error }]}>
                Clear All
              </Text>
            </PressableScale>
          </View>
        )}

        {/* Categorized grocery items with scaled amounts */}
        {groupedItems.map((group) => (
          <View key={group.key} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconCircle, { backgroundColor: `${group.color}20` }]}>
                <MaterialCommunityIcons name={group.icon} size={18} color={group.color} />
              </View>
              <Text style={[Typography.headline, { color: colors.onSurface, flex: 1 }]}>
                {group.label}
              </Text>
              <Text style={[Typography.caption, { color: colors.outline }]}>
                {group.items.filter((i) => i.checked).length}/{group.items.length}
              </Text>
            </View>

            {group.items.map((item) => {
              const scaledAmount = getScaledAmount(item);
              const isManual = item.recipeNames.length === 0;
              return (
                <PressableScale
                  key={item.id}
                  haptic="light"
                  onPress={() => {
                    app.toggleGroceryItem(item.id);
                  }}
                  style={[
                    styles.itemRow,
                    {
                      backgroundColor: colors.surfaceContainerLow,
                      marginHorizontal: Spacing.page,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`${item.name}${scaledAmount ? ', ' + scaledAmount : ''}`}
                  accessibilityState={{ checked: item.checked }}
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
                      {scaledAmount ? (
                        <Text style={[Typography.bodySmall, { color: colors.outline }]}>
                          {scaledAmount}
                        </Text>
                      ) : null}
                      {isManual && (
                        <View style={[styles.recipeCountBadge, { backgroundColor: `${colors.outline}18` }]}>
                          <Text style={[Typography.labelSmall, { color: colors.outline }]}>
                            Added manually
                          </Text>
                        </View>
                      )}
                      {item.recipeNames.length > 1 && (
                        <View style={[styles.recipeCountBadge, { backgroundColor: colors.primaryMuted }]}>
                          <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                            Used in {item.recipeNames.length} Recipes
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {isManual && (
                    <Pressable
                      onPress={() => app.removeGroceryItem(item.id)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.name}`}
                    >
                      <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.outline} />
                    </Pressable>
                  )}
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
                      <MaterialCommunityIcons name="check" size={14} color={colors.textOnImage} />
                    )}
                  </View>
                </PressableScale>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Sticky bottom order bar */}
      <View style={[styles.stickyBottom, { bottom: 80, paddingHorizontal: Spacing.page }]}>
        <GlassView style={[styles.stickyBottomInner, { borderRadius: Radius.lg }]}>
          {activeTab === 'online' ? (
            <View style={styles.orderSection}>
              <View style={styles.orderStats}>
                <Text style={[Typography.caption, { color: colors.outline }]}>
                  Online ordering coming soon
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.ecoBanner, { backgroundColor: `${colors.success}12` }]}>
                <MaterialCommunityIcons name="leaf" size={16} color={colors.success} />
                <Text style={[Typography.caption, { color: colors.success, flex: 1 }]}>
                  Shopping locally saves ~2.4 lbs of CO₂ per trip
                </Text>
              </View>
              <View style={styles.orderSection}>
                <View style={styles.orderStats}>
                  <Text style={[Typography.caption, { color: colors.outline }]}>
                    {checkedCount}/{totalCount} items  •  {uncheckedCount} remaining
                  </Text>
                </View>
              </View>
            </>
          )}
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
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
  clearRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
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
  emptyRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingBottom: 100,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: Spacing.md,
  },
  manualEntryRow: {
    marginBottom: Spacing.lg,
  },
  manualInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
});
