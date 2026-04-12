import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AnimatedHeart } from '@/components/AnimatedHeart';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { BottomSheet } from '@/components/BottomSheet';
import { SelectionPill } from '@/components/SelectionPill';
import { countries } from '@/data/countries';
import { recipes, Step } from '@/data/recipes';
import { convertAmount, formatCookTime } from '@/data/helpers';
import { getSubstitutions } from '@/data/substitutions';
import { ALLERGEN_INFO, AllergenType, getDietaryConflicts } from '@/utils/allergens';
import { highlightCulinaryVerbs } from '@/utils/textFormatting';
import { useBookmarks } from '@/context/BookmarksContext';
import { useApp } from '@/context/AppContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { HeaderBar } from '@/components/HeaderBar';
import { CheckRow } from '@/components/CheckRow';
import { PressableScale } from '@/components/PressableScale';
import { OVERLAY_BUTTON } from '@/constants/icons';
import { dateToLocal, addDays, getMonday, getDayLabelFull as getDayLabel, formatDateShort } from '@/utils/dates';

const CULTURAL_TEASER_LENGTH = 160;

function getStepInstruction(step: Step, level: string): string {
  if (level === 'beginner' && step.instructionFirstSteps) return step.instructionFirstSteps;
  if (level === 'chef' && step.instructionChefsTable) return step.instructionChefsTable;
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

  const scrollRef = useRef<ScrollView>(null);
  const culturalNoteY = useRef<number>(0);

  const [servings, setServings] = useState(recipe?.servings ?? 1);
  const [showPlanSheet, setShowPlanSheet] = useState(false);
  const [planCourseType, setPlanCourseType] = useState<'appetizer' | 'main' | 'dessert'>('main');
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  const planDays = useMemo(() => {
    const start = dateToLocal(getMonday(new Date()));
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
  const recipeAllergens = recipe.allergens as AllergenType[];
  const dietaryConflicts = useMemo(
    () => getDietaryConflicts(recipeAllergens, app.dietaryFlags),
    [recipeAllergens, app.dietaryFlags]
  );

  const culturalTeaser = recipe.culturalNote.length > CULTURAL_TEASER_LENGTH
    ? recipe.culturalNote.slice(0, CULTURAL_TEASER_LENGTH).replace(/\s+\S*$/, '') + '…'
    : recipe.culturalNote;
  const hasTeaserTruncation = recipe.culturalNote.length > CULTURAL_TEASER_LENGTH;

  const ingredientGroups = recipe.ingredients.reduce(
    (acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    },
    {} as Record<string, typeof recipe.ingredients>
  );

  const toggleIngredient = useCallback((key: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSub = useCallback((key: string) => {
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleStartCooking = () => {
    app.startCookSession(recipe, currentServings);
    router.push(`/cook-mode/${recipe.id}`);
  };

  const handleAddToPlan = (date: string) => {
    app.addCourseToDay(date, planCourseType, recipe);
    setShowPlanSheet(false);
  };

  const scrollToCulturalNote = () => {
    scrollRef.current?.scrollTo({ y: culturalNoteY.current - 24, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar
        transparent
        showBack
        rightAction={
          <View style={{ width: OVERLAY_BUTTON.size, height: OVERLAY_BUTTON.size, borderRadius: 20, backgroundColor: OVERLAY_BUTTON.background, borderWidth: OVERLAY_BUTTON.borderWidth, borderColor: OVERLAY_BUTTON.borderColor, alignItems: 'center', justifyContent: 'center' }}>
            <AnimatedHeart
              filled={isSaved}
              onToggle={() => toggleBookmark(recipe.id)}
              size={OVERLAY_BUTTON.iconSize}
              filledColor={colors.primary}
              outlineColor={OVERLAY_BUTTON.iconColor}
              accessibilityLabel={isSaved ? `Remove ${recipe.title} from bookmarks` : `Save ${recipe.title} to bookmarks`}
              hitSlop={12}
            />
          </View>
        }
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 88 + Spacing.lg }}
      >
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: recipe.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            accessible={false}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.65)']}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <Text style={[Typography.labelSmall, { color: 'rgba(255,255,255,0.8)' }]}>
              {country.flag} {country.name}
            </Text>
            <Text style={[Typography.display, { color: colors.textOnImage }]}>{recipe.title}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.lg }}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>Prep {formatCookTime(recipe.prepTime)}</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="thermometer" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>Cook {formatCookTime(recipe.cookTime)}</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="chart-bar" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>{recipe.difficulty}</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="account-group-outline" size={16} color={colors.outline} />
              <Text style={[Typography.caption, { color: colors.outline }]}>{currentServings}</Text>
            </View>
          </View>

          {/* Cultural teaser — above the fold, between stats and ingredients */}
          <Pressable
            onPress={hasTeaserTruncation ? scrollToCulturalNote : undefined}
            style={[styles.culturalTeaser, { backgroundColor: `${colors.primary}10`, borderLeftColor: colors.primary }]}
            accessibilityRole={hasTeaserTruncation ? 'button' : 'text'}
            accessibilityLabel={hasTeaserTruncation ? 'Read cultural note' : recipe.culturalNote}
          >
            <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }]}>
              Cultural Note
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, lineHeight: 20 }]}>
              {culturalTeaser}
              {hasTeaserTruncation && (
                <Text style={{ color: colors.primary, fontWeight: '600' }}>
                  {' '}Read more ↓
                </Text>
              )}
            </Text>
          </Pressable>

          {recipe.nutrition && (
            <View style={[styles.nutritionRow, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={styles.nutritionItem}>
                <Text style={[Typography.caption, { color: colors.primary, fontWeight: '700' }]}>{recipe.nutrition.calories}</Text>
                <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>kcal</Text>
              </View>
              <View style={[styles.nutritionDot, { backgroundColor: colors.outlineVariant }]} />
              <View style={styles.nutritionItem}>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{recipe.nutrition.protein}g</Text>
                <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>P</Text>
              </View>
              <View style={[styles.nutritionDot, { backgroundColor: colors.outlineVariant }]} />
              <View style={styles.nutritionItem}>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{recipe.nutrition.carbs}g</Text>
                <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>C</Text>
              </View>
              <View style={[styles.nutritionDot, { backgroundColor: colors.outlineVariant }]} />
              <View style={styles.nutritionItem}>
                <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{recipe.nutrition.fat}g</Text>
                <Text style={[Typography.caption, { color: colors.outline, fontSize: 10 }]}>F</Text>
              </View>
            </View>
          )}

          <View style={styles.servingsAdjuster}>
            <Pressable
              onPress={() => { if (currentServings > 1) setServings(currentServings - 1); }}
              style={[styles.servingBtn, { backgroundColor: OVERLAY_BUTTON.background, opacity: currentServings <= 1 ? 0.3 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Decrease servings"
            >
              <MaterialCommunityIcons name="minus" size={20} color={OVERLAY_BUTTON.iconColor} />
            </Pressable>
            <Text style={[Typography.titleMedium, { color: colors.onSurface }]}>
              {currentServings} servings
            </Text>
            <Pressable
              onPress={() => setServings(currentServings + 1)}
              style={[styles.servingBtn, { backgroundColor: OVERLAY_BUTTON.background }]}
              accessibilityRole="button"
              accessibilityLabel="Increase servings"
            >
              <MaterialCommunityIcons name="plus" size={20} color={OVERLAY_BUTTON.iconColor} />
            </Pressable>
          </View>


          {recipeAllergens.length > 0 && (
            <View style={styles.allergenSection}>
              <Text style={[Typography.labelLarge, { color: colors.outline, letterSpacing: 1, marginBottom: Spacing.sm }]}>
                ALLERGENS
              </Text>
              <View style={styles.allergenRow}>
                {recipeAllergens.map((a) => {
                  const info = ALLERGEN_INFO[a];
                  const isUserAllergen = app.allergens.includes(a);
                  return (
                    <View
                      key={a}
                      style={[
                        styles.allergenPill,
                        {
                          backgroundColor: isUserAllergen ? `${colors.error}18` : colors.surfaceContainerHigh,
                          borderWidth: isUserAllergen ? 1 : 0,
                          borderColor: isUserAllergen ? colors.error : 'transparent',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={info.icon}
                        size={16}
                        color={isUserAllergen ? colors.error : colors.onSurfaceVariant}
                      />
                      <Text
                        style={[
                          Typography.caption,
                          { color: isUserAllergen ? colors.error : colors.onSurfaceVariant, fontWeight: isUserAllergen ? '700' : '500' },
                        ]}
                      >
                        {info.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {dietaryConflicts.length > 0 && (
                <View style={[styles.warningBanner, { backgroundColor: `${colors.warning}15` }]}>
                  <MaterialCommunityIcons name="alert-outline" size={16} color={colors.warning} />
                  <Text style={[Typography.caption, { color: colors.warning, flex: 1 }]}>
                    Contains ingredients that conflict with your {dietaryConflicts.map((c) => c.flag).join(', ')} preferences
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
              WHAT YOU NEED
            </Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Ingredients
            </Text>

            {Object.entries(ingredientGroups).map(([category, ingredients]) => (
              <View key={category} style={{ marginBottom: Spacing.lg }}>
                <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: Spacing.sm }]}>
                  {category.toUpperCase()}
                </Text>
                {ingredients.map((ing, idx) => {
                  const ingKey = `${category}-${idx}`;
                  const isChecked = checkedIngredients.has(ingKey);
                  const subs = ing.substitutions ?? getSubstitutions(ing.name);
                  const isSubExpanded = expandedSubs.has(ingKey);
                  return (
                    <View key={idx}>
                      <CheckRow
                        checked={isChecked}
                        onToggle={() => toggleIngredient(ingKey)}
                        label={ing.name}
                        checkboxSize="sm"
                        accessibilityLabel={`${ing.name}, ${convertAmount(ing.amount, app.useMetric)}`}
                        trailing={
                          <>
                            <Text
                              style={[
                                Typography.bodySmall,
                                {
                                  color: colors.outline,
                                  opacity: isChecked ? 0.55 : 1,
                                  textDecorationLine: isChecked ? 'line-through' : 'none',
                                },
                              ]}
                            >
                              {convertAmount(ing.amount, app.useMetric)}
                            </Text>
                            {subs && subs.length > 0 && (
                              <Pressable
                                onPress={() => toggleSub(ingKey)}
                                hitSlop={8}
                                style={styles.subButton}
                                accessibilityRole="button"
                                accessibilityLabel={`Substitutions for ${ing.name}`}
                              >
                                <View
                                  style={[
                                    styles.subButtonPill,
                                    { backgroundColor: isSubExpanded ? colors.primary : OVERLAY_BUTTON.background },
                                  ]}
                                >
                                  <MaterialCommunityIcons
                                    name="swap-horizontal"
                                    size={16}
                                    color={OVERLAY_BUTTON.iconColor}
                                  />
                                  <Text style={{ fontSize: 10, color: '#FFFFFF', fontWeight: '700', letterSpacing: 0.3 }}>
                                    Swap
                                  </Text>
                                </View>
                              </Pressable>
                            )}
                          </>
                        }
                      />
                      {subs && subs.length > 0 && isSubExpanded && (
                        <View style={[styles.substitutionHint, { backgroundColor: colors.surfaceContainerLow }]}>
                          <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
                          <View style={{ flex: 1 }}>
                            {subs.map((sub, si) => (
                              <Text key={si} style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                                {sub}
                              </Text>
                            ))}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={{ marginTop: Spacing.xl }}>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
              STEP BY STEP
            </Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface, marginBottom: Spacing.md }]}>
              Instructions
            </Text>

            {app.cookingLevel !== 'home_cook' && recipe.steps.some((s) =>
              (app.cookingLevel === 'beginner' && s.instructionFirstSteps) ||
              (app.cookingLevel === 'chef' && s.instructionChefsTable)
            ) && (
              <View style={[styles.levelPill, { backgroundColor: colors.surfaceContainerHigh }]}>
                <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {app.cookingLevel === 'beginner' ? '🌱 Showing beginner-friendly instructions' : '👨‍🍳 Showing professional instructions'}
                </Text>
              </View>
            )}

            {recipe.steps.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[Typography.caption, { color: colors.onPrimary }]}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.body, { color: colors.onSurface }]}>
                    {highlightCulinaryVerbs(getStepInstruction(step, app.cookingLevel)).map((seg, si) =>
                      seg.isVerb ? (
                        <Text key={si} style={{ fontWeight: '700', color: colors.primary }}>{seg.text}</Text>
                      ) : (
                        <Text key={si}>{seg.text}</Text>
                      )
                    )}
                  </Text>
                  {step.duration && (
                    <View style={styles.timerRow}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={colors.outline} />
                      <Text style={[Typography.caption, { color: colors.outline }]}>
                        {step.duration} min
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Full cultural note section */}
          <View
            onLayout={(e) => { culturalNoteY.current = e.nativeEvent.layout.y; }}
            style={[
              styles.culturalNote,
              {
                backgroundColor: colors.surfaceContainerLow,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[Typography.labelLarge, { color: colors.primary, marginBottom: Spacing.xs }]}>
              CULTURAL NOTE
            </Text>
            <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              {recipe.culturalNote}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky bottom CTA: Plan This (secondary) + Start Cooking (primary) */}
      <GlassView style={[styles.cookCTA, { bottom: 0, paddingBottom: insets.bottom + 16, paddingTop: Spacing.md, paddingHorizontal: Spacing.page }]}>
        <View style={styles.ctaRow}>
          <PressableScale
            onPress={() => setShowPlanSheet(true)}
            haptic="light"
            style={[styles.planButton, { borderColor: colors.primary, borderWidth: 1.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Plan this recipe"
          >
            <MaterialCommunityIcons name="calendar-plus" size={18} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.primary }]}>Plan This</Text>
          </PressableScale>

          <PressableScale
            onPress={handleStartCooking}
            haptic="medium"
            style={[styles.cookButton, { backgroundColor: colors.primary, flex: 1 }]}
            accessibilityRole="button"
            accessibilityLabel={`Start cooking ${recipe.title}`}
          >
            <MaterialCommunityIcons name="play" size={20} color={colors.onPrimary} />
            <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Start Cooking</Text>
          </PressableScale>
        </View>
      </GlassView>

      {/* Add to Plan — Standard B (medium) */}
      <BottomSheet
        visible={showPlanSheet}
        onDismiss={() => setShowPlanSheet(false)}
        size="medium"
        title="Add to Plan"
      >
        <View style={styles.courseTypeRow}>
          {(['appetizer', 'main', 'dessert'] as const).map((ct) => (
            <SelectionPill
              key={ct}
              label={ct.charAt(0).toUpperCase() + ct.slice(1)}
              selected={planCourseType === ct}
              onPress={() => setPlanCourseType(ct)}
            />
          ))}
        </View>

        <FlatList
          data={planDays}
          keyExtractor={(item) => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.md }}
          renderItem={({ item }) => {
            const dayIt = app.itinerary.find((d) => d.date === item.date);
            const existingMain = dayIt?.courses?.main;
            return (
              <Pressable
                onPress={() => handleAddToPlan(item.date)}
                style={[styles.dayRow, { backgroundColor: colors.surfaceContainerHigh }]}
                accessibilityRole="button"
                accessibilityLabel={`${item.label}, ${item.short}${existingMain ? `, has ${existingMain.recipeName}` : ''}`}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{item.label}</Text>
                    {existingMain && (
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                    )}
                  </View>
                  <Text style={[Typography.caption, { color: colors.outline }]}>{item.short}</Text>
                  {existingMain && (
                    <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                      {existingMain.recipeName}
                    </Text>
                  )}
                </View>
                <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
              </Pressable>
            );
          }}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { height: 360, position: 'relative' },
  heroText: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.page,
    right: Spacing.page,
    gap: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  stat: { alignItems: 'center', gap: 4 },
  culturalTeaser: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderLeftWidth: 3,
    marginBottom: Spacing.lg,
  },
  nutritionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  nutritionItem: {
    alignItems: 'center',
    gap: 1,
  },
  nutritionDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  servingsAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  servingBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subButton: {
    marginLeft: Spacing.sm,
  },
  subButtonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  substitutionHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginLeft: 28,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
  },
  levelPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  culturalNote: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    borderLeftWidth: 4,
    marginTop: Spacing.xl,
  },
  cookCTA: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: 'transparent',
  },
  cookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 52,
    borderRadius: Radius.full,
  },
  allergenSection: {
    marginTop: Spacing.md,
  },
  allergenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allergenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.xxl,
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
