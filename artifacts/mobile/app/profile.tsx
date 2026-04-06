import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { GlassView } from '@/components/GlassView';
import { recipes } from '@/data/recipes';
import { countries } from '@/data/countries';

const DIETARY_OPTIONS = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '\u{1F966}' },
  { id: 'vegan', label: 'Vegan', emoji: '\u{1F331}' },
  { id: 'gluten-free', label: 'Gluten-Free', emoji: '\u{1F33E}' },
  { id: 'dairy-free', label: 'Dairy-Free', emoji: '\u{1F95B}' },
  { id: 'nut-free', label: 'Nut-Free', emoji: '\u{1F95C}' },
  { id: 'halal', label: 'Halal', emoji: '\u{2728}' },
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);

  const toggleDietary = (id: string) => {
    setSelectedDietary((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const xp = 2450;
  const level = 8;
  const progress = 0.65;
  const recipesCooked = 23;
  const countriesExplored = 5;
  const streakDays = 12;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top }}
      >
        <View style={[styles.header, { paddingHorizontal: Spacing.page }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
          <Text style={[Typography.title, { color: colors.onSurface }]}>Profile & Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={[styles.profileCard, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.avatarLarge, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Feather name="user" size={40} color={colors.outline} />
          </View>
          <Text style={[Typography.display, { color: colors.onSurface, textAlign: 'center' }]}>
            Home Chef
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center' }]}>
            Culinary explorer since 2024
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
              550 XP to Level {level + 1}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { paddingHorizontal: Spacing.page }]}>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{recipesCooked}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Recipes{'\n'}Cooked</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{countriesExplored}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Countries{'\n'}Explored</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <Text style={[Typography.display, { color: colors.primary, fontSize: 32 }]}>{streakDays}</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Day{'\n'}Streak</Text>
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            DIETARY PREFERENCES
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            Dietary Preferences
          </Text>
          <View style={styles.dietaryGrid}>
            {DIETARY_OPTIONS.map((option) => {
              const isSelected = selectedDietary.includes(option.id);
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

        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            COOKING SETTINGS
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            Cooking Settings
          </Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              icon="scale"
              label="Measurement Units"
              subtitle={metricUnits ? 'Metric (g, ml, °C)' : 'Imperial (oz, cups, °F)'}
              colors={colors}
              trailing={
                <Pressable
                  onPress={() => setMetricUnits(!metricUnits)}
                  style={[
                    styles.unitToggle,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <Text style={[Typography.labelSmall, { color: colors.primary }]}>
                    {metricUnits ? 'METRIC' : 'IMPERIAL'}
                  </Text>
                </Pressable>
              }
            />
            <SettingRow
              icon="account-group"
              label="Default Servings"
              subtitle="4 servings"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="timer-outline"
              label="Timer Sound"
              subtitle="Gentle chime"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="vibrate"
              label="Haptic Feedback"
              subtitle="Vibrate on step transitions"
              colors={colors}
              trailing={
                <Switch
                  value={hapticEnabled}
                  onValueChange={setHapticEnabled}
                  trackColor={{ false: colors.surfaceContainerHigh, true: `${colors.primary}60` }}
                  thumbColor={colors.primary}
                />
              }
            />
          </View>
        </View>

        <View style={[styles.section, { paddingHorizontal: Spacing.page }]}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>
            NOTIFICATIONS
          </Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.md }]}>
            Notifications
          </Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              icon="bell-outline"
              label="Push Notifications"
              subtitle="Cooking reminders & tips"
              colors={colors}
              trailing={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.surfaceContainerHigh, true: `${colors.primary}60` }}
                  thumbColor={colors.primary}
                />
              }
            />
            <SettingRow
              icon="email-outline"
              label="Weekly Digest"
              subtitle="New recipes & seasonal highlights"
              colors={colors}
              trailing={
                <Switch
                  value={weeklyDigest}
                  onValueChange={setWeeklyDigest}
                  trackColor={{ false: colors.surfaceContainerHigh, true: `${colors.primary}60` }}
                  thumbColor={colors.primary}
                />
              }
            />
          </View>
        </View>

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
              subtitle="Follow system theme"
              onPress={() => {}}
              colors={colors}
            />
            <SettingRow
              icon="download-outline"
              label="Offline Recipes"
              subtitle="3 recipes saved offline"
              onPress={() => {}}
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
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text style={[Typography.titleSmall, { color: colors.error }]}>Sign Out</Text>
          </Pressable>
        </View>

        <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.lg }]}>
          Made with love for culinary explorers
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
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
});
