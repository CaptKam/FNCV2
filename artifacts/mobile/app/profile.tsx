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
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { countries } from '@/data/countries';

type MCIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const THEME_OPTIONS: { id: ThemePreference; label: string; icon: MCIconName; desc: string }[] = [
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

const AVATAR_OPTIONS = [
  { id: 'initials', icon: null, label: 'Initials' },
  { id: 'chef', icon: 'chef-hat' as const, label: 'Chef' },
  { id: 'globe', icon: 'earth' as const, label: 'Globe' },
  { id: 'fire', icon: 'fire' as const, label: 'Fire' },
  { id: 'heart', icon: 'heart' as const, label: 'Heart' },
  { id: 'star', icon: 'star' as const, label: 'Star' },
  { id: 'compass', icon: 'compass' as const, label: 'Compass' },
];

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

const GROCERY_PARTNERS: { id: 'instacart' | 'kroger' | 'walmart'; label: string; icon: MCIconName }[] = [
  { id: 'instacart', label: 'Instacart', icon: 'cart' },
  { id: 'kroger', label: 'Kroger', icon: 'store' },
  { id: 'walmart', label: 'Walmart', icon: 'store-outline' },
];

interface SettingRowProps {
  icon: MCIconName;
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
      <View style={[styles.settingIcon, { backgroundColor: colors.primaryMuted }]}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>{label}</Text>
        {subtitle && (
          <Text style={[Typography.caption, { color: colors.outline }]}>{subtitle}</Text>
        )}
      </View>
      {trailing || (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const anyModalOpen = showThemeModal || showServingsModal || showPartnerModal || showProfileModal;
  const [editName, setEditName] = useState(app.displayName);
  const [editAvatar, setEditAvatar] = useState(app.avatarId);

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
    displayName,
    avatarId,
  } = app;

  const currentAvatarIcon: MCIconName | null = AVATAR_OPTIONS.find((a) => a.id === avatarId)?.icon ?? null;

  const levelName = app.getCookingLevelName();
  const progress = (xp % 300) / 300;
  const xpToNext = 300 - (xp % 300);
  const countriesExplored = Object.keys(passportStamps).filter((k) => passportStamps[k] > 0).length;

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
      {!anyModalOpen && <HeaderBar showBack />}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 76 }}
      >

        {/* ═══ PROFILE HERO ═══ */}
        <View style={[styles.profileCard, { paddingHorizontal: Spacing.page }]}>
          <View style={{ height: Spacing.xl }} />
          <Pressable
            onPress={() => {
              setEditName(displayName);
              setEditAvatar(avatarId);
              setShowProfileModal(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <View style={styles.avatarGlow}>
              <View style={[styles.avatarGlowRing, { backgroundColor: `${colors.primary}20` }]} />
              <View style={[styles.avatarLarge, { backgroundColor: colors.primarySubtle }]}>
                {currentAvatarIcon ? (
                  <MaterialCommunityIcons name={currentAvatarIcon} size={48} color={colors.primary} />
                ) : (
                  <Text style={{ fontSize: 40, fontWeight: '700', color: colors.primary }}>
                    {(displayName || 'C').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.onPrimary} />
            </View>
          </Pressable>

          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center', marginTop: Spacing.lg }]}>
            {displayName || levelName}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.labelSmall, { color: colors.onPrimary, letterSpacing: 1.5, fontSize: 10 }]}>
              {levelName.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* ═══ STATS BENTO ═══ */}
        <View style={[styles.statsRow, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.headlineLarge, { color: colors.primary }]}>{totalRecipesCooked}</Text>
            <Text style={[Typography.caption, { color: colors.outline, textAlign: 'center', fontSize: 10, letterSpacing: 0.5 }]}>
              {'RECIPES\nCOOKED'}
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardPrimary, { backgroundColor: colors.primary }]}>
            <Text style={[Typography.headlineLarge, { color: colors.onPrimary }]}>{countriesExplored}</Text>
            <Text style={[Typography.caption, { color: colors.onPrimary, textAlign: 'center', fontSize: 10, letterSpacing: 0.5, opacity: 0.8 }]}>
              {'COUNTRIES\nVISITED'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.headlineLarge, { color: colors.primary }]}>{bookmarkCount}</Text>
            <Text style={[Typography.caption, { color: colors.outline, textAlign: 'center', fontSize: 10, letterSpacing: 0.5 }]}>
              {'RECIPES\nSAVED'}
            </Text>
          </View>
        </View>

        {/* ═══ YOUR PROGRESS (Passport Stamps) ═══ */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <View style={styles.sectionHeader}>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>Your Progress</Text>
          </View>
          <Text style={[Typography.caption, { color: colors.outline, marginBottom: Spacing.md }]}>
            Earned by mastering a regional week
          </Text>
          <View style={styles.stampGrid}>
            {countries.slice(0, 3).map((c) => {
              const count = passportStamps[c.id] || 0;
              const earned = count > 0;
              return (
                <GlassView key={c.id} style={styles.stampCard} intensity={40}>
                  <View style={[styles.stampCircle, { borderColor: earned ? colors.primary : colors.outlineVariant }]}>
                    <Text style={{ fontSize: 28 }}>{c.flag}</Text>
                  </View>
                  <Text style={[Typography.titleSmall, { color: colors.onSurface, fontStyle: 'italic' }]}>{c.name}</Text>
                  <Text style={[Typography.caption, { color: colors.outline, fontSize: 8, letterSpacing: 1 }]}>
                    {earned ? `${count} COOKED` : 'LOCKED'}
                  </Text>
                </GlassView>
              );
            })}
          </View>
        </View>

        {/* ═══ SETTINGS (Grouped Card) ═══ */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.settingsCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <SettingRow
              icon="silverware-fork-knife"
              label="Dietary Preferences"
              subtitle={dietaryFlags.length > 0 ? dietaryFlags.map(d => DIETARY_OPTIONS.find(o => o.id === d)?.label).filter(Boolean).join(', ') : 'None set'}
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="palette-outline"
              label="Appearance"
              subtitle={preference === 'system' ? 'System' : preference === 'light' ? 'Light Mode' : 'Dark Mode'}
              onPress={() => setShowThemeModal(true)}
              colors={colors}
            />
            <SettingRow
              icon="bell-outline"
              label="Notifications"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="information-outline"
              label="About"
              subtitle="Version 1.0.0"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        {/* ═══ COOKING SETTINGS (Grouped Card) ═══ */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.settingsCard, { backgroundColor: colors.surfaceContainerLow }]}>
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
              subtitle={coursePreference === 'main' ? 'Main course only' : 'Full course'}
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
                    {useMetric ? 'g, ml, °C' : 'oz, cups, °F'}
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

        {/* ═══ LEGAL + SIGN OUT ═══ */}
        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.settingsCard, { backgroundColor: colors.surfaceContainerLow }]}>
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
            <SettingRow
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
              colors={colors}
            />
          </View>
        </View>

        <View style={{ paddingHorizontal: Spacing.page, marginTop: Spacing.sm }}>
          <Pressable
            onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive' },
            ])}
            style={[styles.signOutBtn, { borderColor: colors.error }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
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
                      backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainerLow,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} theme, ${option.desc}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.themeIconWrap, { backgroundColor: isActive ? colors.primaryFaded : colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={20}
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
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
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
                      backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainerLow,
                      borderColor: isActive ? colors.primary : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={partner.label}
                  accessibilityState={{ selected: isActive }}
                >
                  <View style={[styles.themeIconWrap, { backgroundColor: isActive ? colors.primaryFaded : colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons
                      name={partner.icon}
                      size={20}
                      color={isActive ? colors.primary : colors.outline}
                    />
                  </View>
                  <Text style={[Typography.titleSmall, { color: isActive ? colors.primary : colors.onSurface, flex: 1 }]}>
                    {partner.label}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showProfileModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowProfileModal(false)} accessibilityRole="button" accessibilityLabel="Close profile editor">
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>
              Edit Profile
            </Text>
            <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.sm }]}>
              YOUR NAME
            </Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor={colors.outlineMuted}
              style={[
                styles.profileNameInput,
                {
                  backgroundColor: colors.surfaceContainerLow,
                  color: colors.onSurface,
                  borderColor: colors.outlineVariant,
                },
              ]}
              autoCapitalize="words"
              maxLength={30}
            />
            <Text style={[Typography.labelLarge, { color: colors.outline, marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>
              AVATAR
            </Text>
            <View style={styles.profileAvatarGrid}>
              {AVATAR_OPTIONS.map((av) => {
                const isActive = editAvatar === av.id;
                return (
                  <Pressable
                    key={av.id}
                    onPress={() => setEditAvatar(av.id)}
                    style={[
                      styles.profileAvatarOption,
                      {
                        backgroundColor: isActive ? colors.primaryMuted : colors.surfaceContainerLow,
                        borderColor: isActive ? colors.primary : 'transparent',
                        borderWidth: 2,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${av.label} avatar`}
                    accessibilityState={{ selected: isActive }}
                  >
                    {av.icon ? (
                      <MaterialCommunityIcons
                        name={av.icon}
                        size={24}
                        color={isActive ? colors.primary : colors.outline}
                      />
                    ) : (
                      <Text style={{ fontSize: 18, fontWeight: '700', color: isActive ? colors.primary : colors.outline }}>
                        {(editName || displayName || 'A').charAt(0).toUpperCase()}
                      </Text>
                    )}
                    <Text style={{ fontSize: 10, color: isActive ? colors.primary : colors.outline, marginTop: 2 }}>
                      {av.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => {
                app.setDisplayName(editName.trim());
                app.setAvatarId(editAvatar);
                setShowProfileModal(false);
              }}
              style={[styles.profileSaveBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Save profile"
            >
              <Text style={[Typography.titleSmall, { color: colors.onPrimary }]}>Save</Text>
            </Pressable>
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
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  avatarGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  avatarLarge: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  statCardPrimary: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.xs,
  },
  stampGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stampCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    gap: 4,
  },
  stampCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  settingsCard: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    padding: Spacing.xs,
    gap: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  unitToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  editBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    paddingHorizontal: Spacing.page,
    paddingBottom: Spacing.xxl,
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
  profileNameInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  profileAvatarGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  profileAvatarOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSaveBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.full,
    marginTop: Spacing.xl,
  },
});
