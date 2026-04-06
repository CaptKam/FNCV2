import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { Shadows } from '@/constants/shadows';
import { GlassView } from '@/components/GlassView';
import { SectionHeader } from '@/components/SectionHeader';
import { RecipeCard } from '@/components/RecipeCard';
import { DestinationCard } from '@/components/DestinationCard';
import { countries } from '@/data/countries';
import { recipes } from '@/data/recipes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 480;

export default function DiscoverScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeHero, setActiveHero] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const heroCountries = countries.slice(0, 5);
  const tonightsRecipe = recipes[0];
  const curatedCountries = countries.slice(0, 4);
  const trendingRecipes = recipes.slice(0, 6);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveHero(idx);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <View style={styles.topBarLeft}>
            <Pressable onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Feather name="user" size={18} color={colors.outline} />
            </Pressable>
            <Text style={[Typography.title, { color: colors.onSurface, fontStyle: 'italic' }]}>
              Fork & Compass
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <Pressable hitSlop={12} onPress={() => router.push('/bookmarks')}>
              <Feather name="bookmark" size={22} color={colors.onSurface} />
            </Pressable>
            <Pressable hitSlop={12}>
              <Feather name="shopping-bag" size={22} color={colors.onSurface} />
            </Pressable>
          </View>
        </View>

        {/* Hero Carousel */}
        <View style={styles.heroContainer}>
          <FlatList
            ref={flatListRef}
            data={heroCountries}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width: SCREEN_WIDTH, height: HERO_HEIGHT }}>
                <Image
                  source={{ uri: item.heroImage }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={300}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']}
                  locations={[0, 0.4, 1]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.heroContent}>
                  <GlassView style={styles.flagBadge}>
                    <Text style={{ fontSize: 14 }}>{item.flag}</Text>
                    <Text style={[Typography.caption, { color: '#FFFFFF' }]}>{item.region}</Text>
                  </GlassView>
                  <Text style={[Typography.displayMedium, styles.heroTitle]}>
                    {item.name}
                  </Text>
                  <Pressable
                    onPress={() => router.push(`/country/${item.id}`)}
                    style={[styles.exploreCTA, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>
                      Explore {item.name}
                    </Text>
                    <Feather name="arrow-right" size={18} color={colors.onPrimary} />
                  </Pressable>
                </View>
              </View>
            )}
          />
          {/* Vertical Pagination Dots */}
          <View style={styles.paginationDots}>
            {heroCountries.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeHero ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Tonight's Plan Strip */}
        <View style={{ paddingHorizontal: Spacing.page, marginTop: -Spacing.xxl }}>
          <GlassView style={[styles.tonightCard, { ...Shadows.ambient }]}>
            <Image
              source={{ uri: tonightsRecipe.image }}
              style={styles.tonightImage}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.tonightContent}>
              <Text style={[Typography.labelLarge, { color: colors.primary }]}>
                TONIGHT'S PLAN
              </Text>
              <Text style={[Typography.headline, { color: colors.onSurface, fontSize: 18 }]} numberOfLines={1}>
                {tonightsRecipe.title}
              </Text>
              <Pressable onPress={() => router.push(`/recipe/${tonightsRecipe.id}`)}>
                <Text style={[Typography.titleSmall, { color: colors.primary }]}>
                  Cook Tonight
                </Text>
              </Pressable>
            </View>
          </GlassView>
        </View>

        {/* Curated Regions */}
        <View style={{ marginTop: Spacing.xxl }}>
          <SectionHeader label="CURATED REGIONS" title="Curated Regions" actionText="View All" onAction={() => {}} />
          <View style={styles.grid}>
            {curatedCountries.map((country) => (
              <DestinationCard key={country.id} country={country} />
            ))}
          </View>
        </View>

        {/* Trending Bites */}
        <View style={{ marginTop: Spacing.xl }}>
          <SectionHeader label="TRENDING BITES" title="Trending Bites" actionText="View All" onAction={() => {}} />
          <View style={styles.grid}>
            {trendingRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.sm,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
  },
  heroContent: {
    position: 'absolute',
    bottom: 60,
    left: Spacing.page,
    right: Spacing.page,
    gap: Spacing.md,
  },
  heroTitle: {
    color: '#FFFFFF',
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  exploreCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  paginationDots: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    borderRadius: Radius.full,
  },
  dotActive: {
    width: 4,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
  },
  dotInactive: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: Radius.full,
  },
  tonightCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tonightImage: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
  },
  tonightContent: {
    flex: 1,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
  },
});
