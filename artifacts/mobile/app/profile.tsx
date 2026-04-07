import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { HeaderBar } from '@/components/HeaderBar';
import { useThemePreference, ThemePreference } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import { useBookmarks } from '@/context/BookmarksContext';

const THEME_OPTIONS: { id: ThemePreference; label: string; icon: string; desc: string }[] = [
  { id: 'system', label: 'System', icon: 'cellphone-cog', desc: 'Match your device settings' },
  { id: 'light', label: 'Light', icon: 'white-balance-sunny', desc: 'Always use light mode' },
  { id: 'dark', label: 'Dark', icon: 'moon-waning-crescent', desc: 'Always use dark mode' },
];

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '\u{1F966}' },
  { id: 'vegan', label: 'Vegan', emoji: '\u{1F331}' },
  { id: 'gluten-free', label: 'Gluten-Free', emoji: '\u{1F33E}' },
  { id: 'dairy-free', label: 'Dairy-Free', emoji: '\u{1F95B}' },
  { id: 'nut-free', label: 'Nut-Free', emoji: '\u{1F95C}' },
  { id: 'halal', label: 'Halal', emoji: '\u{2728}' },
];

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const GROCERY_PARTNERS: { id: 'instacart' | 'kroger' | 'walmart'; label: string; icon: string }[] = [
  { id: 'instacart', label: 'Instacart', icon: 'cart' },
  { id: 'kroger', label: 'Kroger', icon: 'store' },
  { id: 'walmart', label: 'Walmart', icon: 'store-outline' },
];

interface SettingRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}

function SettingRow({ icon, label, subtitle, onPress, trailing, colors }: SettingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingRow,
        {
          backgroundColor: colors.surfaceContainerLow,
          opacity: pressed && onPress ? 0.8 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${label}, ${subtitle}` : label}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${colors.primary}15` }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{label}</Text>
        {subtitle && (
          <Text style={[Typography.bodySmall, { color: colors.outline, fontSize: 12 }]}>{subtitle}</Text>
        )}
      </View>
      {trailing || (
        <Feather name="chevron-right" size={18} color={colors.outline} />
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { preference, setPreference } = useThemePreference();
  const app = useApp();
  const { bookmarkCount } = useBookmarks();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showServingsModal, setShowServingsModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Read all state from AppContext
  const {
    xp,
    level,
    totalRecipesCooked,
    passportStamps,
    dietaryFlags,
    allergens,
    cookingLevel,
    coursePreference,
    groceryPartner,
    useMetric,
  } = app;

  const levelName = app.getCookingLevelName();
  const progress = (xp % 300) / 300;
  const xpToNext = 300 - (xp % 300);
  const countriesExplored = Object.keys(passportStamps).length;

  const toggleDietary = (id: string) => {
    const next = dietaryFlags.includes(id)
      ? dietaryFlags.filter((d) => d !== id)
      : [...dietaryFlags, id];
    app.setDietaryFlags(next);
  };

  // Default servings derived from coursePreference context (main = standard, full = larger)
  const [defaultServings, setDefaultServings] = useState(4);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 76 }}
      >

        {/* Profile card — wired to AppContext XP/level */}
        <View style={[styles.profileCard, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Feather name="user" size={40} color={colors.outline} />
          </View>
          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center' }]}>
            {levelName}
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center' }]}>
            Culinary explorer · Level {level}
          </Text>

          <View style={styles.levelContainer}>
            <View style={styles.levelRow}>
              <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>
                Level {level}
              </Text>
              <Text style={[Typography.caption, { color: colors.primary }]}>{xp} XP</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surfaceContainerHigh }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: 4 }]}>
              {xpToNext} XP to Level {level + 1}
            </Text>
          </View>
        </View>

        {/* Stats — wired to AppContext */}
        <View style={[styles.statsRow, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{totalRecipesCooked}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Recipes{'\n'}Cooked</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{countriesExplored}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Countries{'\n'}Explored</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{bookmarkCount}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Recipes{'\n'}Saved</Text>
          </View>
        </View>

        {/* Dietary preferences — wired to AppContext */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            DIETARY PREFERENCES
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            Dietary Preferences
          </Text>
          <View style={styles.dietaryGrid}>
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = dietaryFlags.includes(option.id);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => toggleDietary(option.id)}
                  style={[
                    styles.dietaryChip,
                    {
                      backgroundColor: isSelected ? `${colors.primary}18` : colors.surfaceContainerLow,
                      borderColor: isSelected ? colors.primary : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} diet`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={{ fontSize: 18 }}>{option.emoji}</Text>
                  <Text
                    style={[
                      Typography.titleSmall,
                      { color: isSelected ? colors.primary : colors.onSurface, fontSize: 13 },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Cooking settings — wired to AppContext */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            COOKING SETTINGS
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            Cooking Settings
          </Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              icon="chef-hat"
              label="Cooking Level"
              subtitle={cookingLevel === 'beginner' ? 'Beginner' : cookingLevel === 'home_cook' ? 'Home Cook' : 'Chef'}
              colors={colors}
              trailing={
                <Pressable
                  onPress={() => {
                    const levels = ['beginner', 'home_cook', 'chef'] as const;
                    const idx = levels.indexOf(cookingLevel);
                    app.setCookingLevel(levels[(idx + 1) % levels.length]);
                  }}
                  style={[styles.unitToggle, { backgroundColor: colors.surfaceContainerHigh }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Change cooking level, currently ${cookingLevel}`}
                >
                  <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                    {cookingLevel === 'beginner' ? 'BEGINNER' : cookingLevel === 'home_cook' ? 'HOME COOK' : 'CHEF'}
                  </Text>
                </Pressable>
              }
            />
            <SettingRow
              icon="silverware-fork-knife"
              label="Course Preference"
              subtitle={coursePreference === 'main' ? 'Main course only' : 'Full course (appetizer + main + dessert)'}
              colors={colors}
              trailing={
                <Pressable
                  onPress={() => app.setCoursePreference(coursePreference === 'main' ? 'full' : 'main')}
                  style={[styles.unitToggle, { backgroundColor: colors.surfaceContainerHigh }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch course preference, currently ${coursePreference}`}
                >
                  <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                    {coursePreference === 'main' ? 'MAIN ONLY' : 'FULL COURSE'}
                  </Text>
                </Pressable>
              }
            />
            <SettingRow
              icon="scale"
              label="Measurement Units"
              subtitle={useMetric ? 'Metric (g, ml, °C)' : 'Imperial (oz, cups, °F)'}
              colors={colors}
              trailing={
                <Pressable
                  onPress={() => app.setUseMetric(!useMetric)}
                  style={[styles.unitToggle, { backgroundColor: colors.surfaceContainerHigh }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Switch to ${useMetric ? 'imperial' : 'metric'} units`}
                >
                  <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                    {useMetric ? 'METRIC' : 'IMPERIAL'}
                  </Text>
                </Pressable>
              }
            />
            <SettingRow
              icon="account-group"
              label="Default Servings"
              subtitle={`${defaultServings} servings`}
              onPress={() => setShowServingsModal(true)}
              colors={colors}
            />
            <SettingRow
              icon="truck-delivery-outline"
              label="Grocery Partner"
              subtitle={GROCERY_PARTNERS.find((p) => p.id === groceryPartner)?.label ?? 'Instacart'}
              onPress={() => setShowPartnerModal(true)}
              colors={colors}
            />
          </View>
        </View>

        {/* General */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            GENERAL
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            General
          </Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              icon="palette-outline"
              label="Appearance"
              subtitle={preference === 'system' ? 'Follow system theme' : preference === 'light' ? 'Light mode' : 'Dark mode'}
              onPress={() => setShowThemeModal(true)}
              colors={colors}
            />
            <SettingRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="information-outline"
              label="About Fork & Compass"
              subtitle="Version 1.0.0"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <View style={styles.settingsGroup}>
            <SettingRow
              icon="shield-check-outline"
              label="Privacy Policy"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="file-document-outline"
              label="Terms of Service"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.md }}>
          <Pressable
            onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' },
            ])}
            style={[styles.signOutBtn, { borderColor: colors.error }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text style={[Typography.titleSmall, { color: colors.error }]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.lg }]}>
          Made with love for culinary explorers
        </Text>
      </ScrollView>

      {/* Theme picker modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowThemeModal(false)} accessibilityRole="button" accessibilityLabel="Close appearance settings">
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Appearance
            </Text>
            {THEME_OPTIONS.map((option) => {
              const isActive = preference === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => {
                    setPreference(option.id);
                    setShowThemeModal(false);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive ? `${colors.primary}15` : colors.surfaceContainerLow,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} theme, ${option.desc}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.themeIconWrap, { backgroundColor: isActive ? `${colors.primary}20` : colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={22}
                      color={isActive ? colors.primary : colors.outline}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.titleSmall, { color: isActive ? colors.primary : colors.onSurface }]}>
                      {option.label}
                    </Text>
                    <Text style={[Typography.bodySmall, { color: colors.outline, fontSize: 12 }]}>
                      {option.desc}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Servings picker modal */}
      <Modal
        visible={showServingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowServingsModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowServingsModal(false)} accessibilityRole="button" accessibilityLabel="Close servings picker">
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Default Servings
            </Text>
            <View style={styles.servingsGrid}>
              {SERVING_OPTIONS.map((n) => {
                const isActive = defaultServings === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => {
                      setDefaultServings(n);
                      setShowServingsModal(false);
                    }}
                    style={[
                      styles.servingOption,
                      {
                        backgroundColor: isActive ? colors.primary : colors.surfaceContainerLow,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${n} servings`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[Typography.titleMedium, { color: isActive ? colors.onPrimary : colors.onSurface }]}>
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Grocery partner picker modal */}
      <Modal
        visible={showPartnerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPartnerModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPartnerModal(false)} accessibilityRole="button" accessibilityLabel="Close grocery partner picker">
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Grocery Partner
            </Text>
            {GROCERY_PARTNERS.map((partner) => {
              const isActive = groceryPartner === partner.id;
              return (
                <Pressable
                  key={partner.id}
                  onPress={() => {
                    app.setGroceryPartner(partner.id);
                    setShowPartnerModal(false);
                  }}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive ? `${colors.primary}15` : colors.surfaceContainerLow,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={partner.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.themeIconWrap, { backgroundColor: isActive ? `${colors.primary}20` : colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons
                      name={partner.icon as any}
                      size={22}
                      color={isActive ? colors.primary : colors.outline}
                    />
                  </View>
                  <Text style={[Typography.titleSmall, { color: isActive ? colors.primary : colors.onSurface, flex: 1 }]}>
                    {partner.label}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  levelContainer: {
    width: '100%',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    gap: 4,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  dietaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  settingsGroup: {
    gap: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  unitToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  themeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  servingOption: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
