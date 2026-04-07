import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { countries } from '@/data/countries';
import { recipes, Step } from '@/data/recipes';
import { convertAmount } from '@/data/helpers';
import { highlightCulinaryVerbs } from '@/utils/textFormatting';
import { useBookmarks } from '@/context/BookmarksContext';
import { useApp } from '@/context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Helpers ───

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function getDayLabel(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

function getStepInstruction(step: Step, level: string): string {
  const s = step as any;
  if (level === 'beginner' && s.instructionFirstSteps) return s.instructionFirstSteps;
  if (level === 'chef' && s.instructionChefsTable) return s.instructionChefsTable;
  return step.instruction;
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const app = useApp();
  const recipe = recipes.find((r) => r.id === id);
  const country = recipe ? countries.find((c) => c.id === recipe.countryId) : null;
  const isSaved = recipe ? isBookmarked(recipe.id) : false;

  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [planCourseType, setPlanCourseType] = useState<'appetizer' | 'main' | 'dessert'>('main');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

  // Next recipe suggestion
  const nextRecipe = useMemo(() => {
    if (!recipe) return null;
    const countryRecipes = recipes.filter((r) => r.countryId === recipe.countryId && r.id !== recipe.id);
    return countryRecipes[0] ?? null;
  }, [recipe]);

  const planDays = useMemo(() => {
    const start = toISO(getMonday(new Date()));
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(start, i);
      return { date, label: getDayLabel(date), short: formatDateShort(date) };
    });
  }, []);

  if (!recipe || !country) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 100 }]}>
          Recipe not found
        </Text>
      </View>
    );
  }

  const currentServings = servings;
  const ingredientGroups = recipe.ingredients.reduce(
    (acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    },
    {} as Record<string, typeof recipe.ingredients>
  );

  const handleStartCooking = () => {
    app.startCookSession(recipe, currentServings);
    router.push(`/cook-mode/${recipe.id}`);
  };

  const handleAddToPlan = (date: string) => {
    app.addCourseToDay(date, planCourseType, recipe);
    setShowPlanSheet(false);
  };

  const handleAddToGrocery = () => {
    app.addToGrocery(recipe);
  };

  const toggleIngredientCheck = (globalIdx: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(globalIdx)) next.delete(globalIdx);
      else next.add(globalIdx);
      return next;
    });
  };

  // Flatten ingredients with global index for checkbox tracking
  let globalIngIdx = 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            onPress={() => router.back()}
            style={[styles.headerBtn, { top: insets.top + 8, left: Spacing.page }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <GlassView style={styles.headerBtnGlass}>
              <Feather name="arrow-left" size={20} color={colors.onSurface} />
            </GlassView>
          </Pressable>
          <Pressable
            onPress={() => toggleBookmark(recipe.id)}
            style={[styles.headerBtn, { top: insets.top + 8, right: Spacing.page }]}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Remove ${recipe.title} from bookmarks` : `Save ${recipe.title} to bookmarks`}
          >
            <GlassView style={styles.headerBtnGlass}>
              <MaterialCommunityIcons
                name={isSaved ? 'heart' : 'heart-outline'}
                size={20}
                color={isSaved ? colors.primary : colors.onSurface}
              />
            </GlassView>
          </Pressable>
        </View>

        {/* Content Canvas — overlaps hero */}
        <View style={[styles.contentCanvas, { backgroundColor: colors.surface }]}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={[styles.recipeTitle, { color: colors.onSurface }]}>
              {recipe.title}
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.secondary, letterSpacing: 0.5 }]}>
              {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)} · {country.name} {country.flag}
            </Text>
          </View>

          {/* Metadata Pills */}
          <View style={styles.metaPills}>
            <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.onSurface }]}>{recipe.prepTime} min prep</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="fire" size={16} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.onSurface }]}>{recipe.cookTime} min cook</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MaterialCommunityIcons name="chart-bar" size={16} color={colors.primary} />
              <Text style={[styles.metaPillText, { color: colors.onSurface }]}>{recipe.difficulty}</Text>
            </View>
          </View>

          {/* Serving Adjuster Card */}
          <View style={[styles.servingCard, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>Servings</Text>
            <View style={[styles.servingStepper, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
              <Pressable
                onPress={() => { if (currentServings > 1) setServings(currentServings - 1); }}
                style={[styles.servingStepBtn, { opacity: currentServings <= 1 ? 0.3 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Decrease servings"
              >
                <Feather name="minus" size={18} color={colors.primary} />
              </Pressable>
              <Text style={[Typography.titleMedium, { color: colors.onSurface, fontWeight: '700' }]}>
                {currentServings} servings
              </Text>
              <Pressable
                onPress={() => setServings(currentServings + 1)}
                style={styles.servingStepBtn}
                accessibilityRole="button"
                accessibilityLabel="Increase servings"
              >
                <Feather name="plus" size={18} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {/* Ingredients with Checkboxes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Ingredients</Text>

            {Object.entries(ingredientGroups).map(([category, ingredients]) => (
              <View key={category} style={{ marginBottom: Spacing.lg }}>
                <Text style={[styles.categoryLabel, { color: colors.secondary }]}>
                  {category}:
                </Text>
                {ingredients.map((ing, idx) => {
                  const thisIdx = globalIngIdx++;
                  const checked = checkedIngredients.has(thisIdx);
                  return (
                    <Pressable
                      key={thisIdx}
                      onPress={() => toggleIngredientCheck(thisIdx)}
                      style={styles.ingredientItem}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      accessibilityLabel={`${convertAmount(ing.amount, app.useMetric)} ${ing.name}`}
                    >
                      <View
                        style={[
                          styles.ingredientCheckbox,
                          checked
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { borderColor: `${colors.outlineVariant}66` },
                        ]}
                      >
                        {checked && (
                          <MaterialCommunityIcons name="check" size={14} color={colors.textOnImage} />
                        )}
                      </View>
                      <Text
                        style={[
                          Typography.body,
                          {
                            color: checked ? colors.onSurfaceVariant : colors.onSurface,
                            textDecorationLine: checked ? 'line-through' : 'none',
                            opacity: checked ? 0.6 : 1,
                            flex: 1,
                          },
                        ]}
                      >
                        {convertAmount(ing.amount, app.useMetric)} {ing.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Add to Grocery CTA */}
          <Pressable
            onPress={handleAddToGrocery}
            style={styles.groceryCTA}
            accessibilityRole="button"
            accessibilityLabel="Add ingredients to grocery list"
          >
            <LinearGradient
              colors={['#C75B12', colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.groceryCTAGradient}
            >
              <MaterialCommunityIcons name="basket" size={20} color={colors.onPrimary} />
              <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Add to Grocery List</Text>
            </LinearGradient>
          </Pressable>

          {/* Add to Plan */}
          <Pressable
            onPress={() => setShowPlanSheet(true)}
            style={[styles.planBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Add to meal plan"
          >
            <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.primary }]}>Add to Plan</Text>
          </Pressable>

          {/* Instructions */}
          <View style={[styles.section, { marginTop: Spacing.xxl }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Instructions</Text>

            {recipe.steps.map((step, idx) => {
              const instruction = getStepInstruction(step, app.cookingLevel);
              const matchedIngs = recipe.ingredients.filter((ing) =>
                instruction.toLowerCase().includes(ing.name.toLowerCase())
              );
              return (
                <View key={idx} style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.stepNum, { color: colors.onPrimary }]}>{idx + 1}</Text>
                    </View>
                  </View>
                  <Text style={[Typography.body, { color: colors.onSurfaceVariant, lineHeight: 26 }]}>
                    {highlightCulinaryVerbs(instruction).map((seg, si) =>
                      seg.isVerb ? (
                        <Text key={si} style={{ fontWeight: '700', color: colors.primary }}>{seg.text}</Text>
                      ) : (
                        <Text key={si}>{seg.text}</Text>
                      )
                    )}
                  </Text>
                  {(matchedIngs.length > 0 || step.duration) && (
                    <View style={[styles.stepCallout, { backgroundColor: colors.surfaceContainerLow, borderLeftColor: `${colors.primary}4D` }]}>
                      {matchedIngs.length > 0 && (
                        <>
                          <Text style={[styles.calloutLabel, { color: colors.secondary }]}>You'll need:</Text>
                          <Text style={[Typography.bodySmall, { color: colors.onSurface }]}>
                            {matchedIngs.map((i) => `${convertAmount(i.amount, app.useMetric)} ${i.name}`).join(', ')}
                          </Text>
                        </>
                      )}
                      {step.duration && (
                        <View style={styles.stepTimerRow}>
                          <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                          <Text style={[Typography.caption, { color: colors.outline }]}>{step.duration} min</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Enter Cook Mode */}
          <Pressable
            onPress={handleStartCooking}
            style={[styles.cookModeCTA, { backgroundColor: colors.inverseSurface }]}
            accessibilityRole="button"
            accessibilityLabel={`Enter cook mode for ${recipe.title}`}
          >
            <View style={styles.cookModeLeft}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={colors.inversePrimary} />
              <Text style={[Typography.titleMedium, { color: colors.inverseOnSurface }]}>Enter Cook Mode</Text>
            </View>
            <Feather name="arrow-right" size={20} color={colors.inverseOnSurface} />
          </Pressable>

          {/* Cultural Note Quote */}
          <View style={[styles.quoteCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <MaterialCommunityIcons
              name="format-quote-open"
              size={48}
              color={colors.primary}
              style={{ opacity: 0.1, position: 'absolute', top: -4, left: -4 }}
            />
            <Text style={[styles.quoteText, { color: colors.primary }]}>
              "{recipe.culturalNote}"
            </Text>
          </View>

          {/* Next Journey Card */}
          {nextRecipe && (
            <View style={styles.nextSection}>
              <Text style={[styles.nextLabel, { color: colors.secondary }]}>The Next Journey</Text>
              <Pressable
                onPress={() => router.push(`/recipe/${nextRecipe.id}`)}
                style={styles.nextCard}
                accessibilityRole="button"
                accessibilityLabel={`View ${nextRecipe.title}`}
              >
                <Image
                  source={{ uri: nextRecipe.image }}
                  style={styles.nextImage}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={styles.nextGradient}
                >
                  <Text style={[Typography.headline, { color: colors.textOnImage, fontSize: 22 }]}>
                    {nextRecipe.title}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    {nextRecipe.difficulty} · {nextRecipe.prepTime + nextRecipe.cookTime} min
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Plan sheet modal */}
      <Modal
        visible={showPlanSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanSheet(false)}
      >
        <Pressable style={styles.sheetOverlay} onPress={() => setShowPlanSheet(false)}>
          <Pressable
            style={[styles.sheetContainer, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
              Add to Plan
            </Text>
            <View style={styles.courseTypeRow}>
              {(['appetizer', 'main', 'dessert'] as const).map((ct) => {
                const isActive = planCourseType === ct;
                return (
                  <Pressable
                    key={ct}
                    onPress={() => setPlanCourseType(ct)}
                    style={[
                      styles.courseTypeChip,
                      { backgroundColor: isActive ? colors.primary : colors.surfaceContainerHigh },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${ct} course`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[Typography.titleSmall, { color: isActive ? colors.onPrimary : colors.onSurface }]}>
                      {ct.charAt(0).toUpperCase() + ct.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <FlatList
              data={planDays}
              keyExtractor={(item) => item.date}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAddToPlan(item.date)}
                  style={[styles.dayRow, { backgroundColor: colors.surfaceContainerLow }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}, ${item.short}`}
                >
                  <View>
                    <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{item.label}</Text>
                    <Text style={[Typography.caption, { color: colors.outline }]}>{item.short}</Text>
                  </View>
                  <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 397, position: 'relative' },
  headerBtn: { position: 'absolute', zIndex: 10 },
  headerBtnGlass: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCanvas: {
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.page,
    paddingTop: 40,
  },
  titleSection: {
    marginBottom: 32,
  },
  recipeTitle: {
    fontFamily: 'NotoSerif_600SemiBold',
    fontSize: 34,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 40,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  servingCard: {
    borderRadius: Radius.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 48,
  },
  servingStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  servingStepBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'NotoSerif_600SemiBold',
    fontSize: 24,
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  ingredientCheckbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
    minHeight: 44,
  },
  groceryCTA: {
    marginBottom: 12,
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  groceryCTAGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 56,
    borderRadius: Radius.xl,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  stepCard: {
    marginBottom: 48,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontWeight: '700',
    fontSize: 14,
  },
  stepCallout: {
    padding: 16,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    marginTop: 16,
    gap: 4,
  },
  calloutLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stepTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cookModeCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 64,
    borderRadius: Radius.xl,
    marginBottom: 64,
  },
  cookModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quoteCard: {
    borderRadius: 24,
    padding: 32,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 64,
  },
  quoteText: {
    fontFamily: 'NotoSerif_600SemiBold',
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 30,
  },
  nextSection: {
    marginBottom: 40,
  },
  nextLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 16,
    marginLeft: 4,
  },
  nextCard: {
    aspectRatio: 16 / 9,
    borderRadius: 24,
    overflow: 'hidden',
  },
  nextImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  nextGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 24,
    gap: 4,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  courseTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  courseTypeChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
});
