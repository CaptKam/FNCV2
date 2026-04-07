import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { recipes } from '@/data/recipes';

const TECHNIQUES = [
  { title: 'Knife Skills', duration: '12 min', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', desc: 'Master the julienne and chiffonade' },
  { title: 'Sauce Making', duration: '15 min', image: 'https://images.unsplash.com/photo-1607116667981-27db83911e34?w=400&h=300&fit=crop', desc: 'The five French mother sauces' },
  { title: 'Bread Baking', duration: '20 min', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop', desc: 'Artisan sourdough fundamentals' },
  { title: 'Wok Technique', duration: '10 min', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', desc: 'High-heat stir-fry mastery' },
];

export default function CookScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const activeRecipe = recipes[3];
  const xp = 2450;
  const level = 8;
  const progress = 0.65;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 68 }}
      >
        <View style={[styles.profileSection, { paddingHorizontal: Spacing.page }]}>
          <Pressable onPress={() => router.push('/profile')} style={[styles.avatar, { backgroundColor: colors.surfaceContainerHigh }]} accessibilityRole="button" accessibilityLabel="View profile">
            <Feather name="user" size={28} color={colors.outline} />
          </Pressable>
          <View style={styles.profileInfo}>
            <Text style={[Typography.labelLarge, { color: colors.outline }]}>KITCHEN REPUTATION</Text>
            <Text style={[Typography.display, { color: colors.onSurface }]}>Home Cook</Text>
            <View style={styles.levelRow}>
              <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                Level {level}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: colors.primary, width: `${progress * 100}%` },
                  ]}
                />
              </View>
              <Text style={[Typography.caption, { color: colors.primary }]}>{xp} XP</Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xl }}>
          <Pressable
            onPress={() => router.push(`/cook-mode/${activeRecipe.id}`)}
            style={styles.activeCard}
            accessibilityRole="button"
            accessibilityLabel={`Continue cooking ${activeRecipe.title}`}
          >
            <Image
              source={{ uri: activeRecipe.image }}
              style={styles.activeImage}
              contentFit="cover"
              transition={300}
              accessible={false}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.activeGradient}
            />
            <View style={styles.activeContent}>
              <GlassView style={styles.activeGlass}>
                <Text style={[Typography.labelLarge, { color: '#FFFFFF' }]}>IN THE KITCHEN</Text>
                <Text style={[Typography.displayMedium, { color: '#FFFFFF', fontSize: 24 }]} numberOfLines={1}>
                  {activeRecipe.title}
                </Text>
                <Text style={[Typography.body, { color: 'rgba(255,255,255,0.8)', fontSize: 14 }]} numberOfLines={2}>
                  {activeRecipe.culturalNote.slice(0, 80)}...
                </Text>
                <Text style={[Typography.title, { color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', fontSize: 14 }]}>
                  Step 3 of {activeRecipe.steps.length}
                </Text>
                <Pressable style={[styles.resumeBtn, { backgroundColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Resume cooking session">
                  <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Resume Session</Text>
                </Pressable>
              </GlassView>
            </View>
          </Pressable>
        </View>

        <View style={{ marginTop: Spacing.xxl }}>
          <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.md }}>
            <Text style={[Typography.labelLarge, { color: colors.outline }]}>TECHNIQUE LIBRARY</Text>
            <Text style={[Typography.headlineLarge, { color: colors.onSurface }]}>Technique Library</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: Spacing.page, gap: Spacing.md }}
          >
            {TECHNIQUES.map((tech) => (
              <Pressable key={tech.title} style={styles.techCard} accessibilityRole="button" accessibilityLabel={`${tech.title}, ${tech.duration}`}>
                <Image
                  source={{ uri: tech.image }}
                  style={styles.techImage}
                  contentFit="cover"
                  transition={300}
                  accessible={false}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.75)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.durationBadge}>
                  <GlassView style={styles.durationGlass}>
                    <Feather name="play" size={10} color="#FFFFFF" />
                    <Text style={[Typography.labelSmall, { color: '#FFFFFF' }]}>{tech.duration}</Text>
                  </GlassView>
                </View>
                <View style={styles.techContent}>
                  <Text style={[Typography.headline, { color: '#FFFFFF', fontSize: 16 }]}>
                    {tech.title}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: 'rgba(255,255,255,0.7)' }]}>
                    {tech.desc}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xxl }}>
          <View style={[styles.classCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.labelLarge, { color: colors.primary }]}>UPCOMING CLASS</Text>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>
              Mastering Japanese Dashi
            </Text>
            <Text style={[Typography.body, { color: colors.onSurfaceVariant, fontSize: 14 }]}>
              Learn the foundation of Japanese cooking with a live masterclass on dashi stock preparation.
            </Text>
            <View style={styles.avatarStack}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.miniAvatar,
                    {
                      backgroundColor: colors.surfaceContainerHigh,
                      marginLeft: i > 1 ? -8 : 0,
                    },
                  ]}
                />
              ))}
              <Text style={[Typography.caption, { color: colors.outline, marginLeft: 8 }]}>
                +24 joined
              </Text>
            </View>
            <Pressable style={[styles.waitlistBtn, { borderColor: colors.primary }]} accessibilityRole="button" accessibilityLabel="Join waitlist for Mastering Japanese Dashi">
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>Join Waitlist</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.xl }}>
          <View style={[styles.pantryBanner, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.display, { color: colors.onSurface, fontSize: 32 }]}>73%</Text>
              <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                Pantry stocked for this week
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Scan pantry">
              <Text style={[Typography.titleSmall, { color: colors.primary }]}>Scan Pantry</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 4 },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  activeCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 320,
  },
  activeImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  activeGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  activeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  activeGlass: {
    padding: Spacing.lg,
    gap: 6,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  resumeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  techCard: {
    width: 200,
    height: 260,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  techImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  durationGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  techContent: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    gap: 4,
  },
  classCard: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#FEF9F3',
  },
  waitlistBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: 4,
  },
  pantryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
});
