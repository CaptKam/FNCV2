import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';

interface PlanAddMethodSheetProps {
  visible: boolean;
  onClose: () => void;
  bookmarkCount: number;
  onSelectSaved: () => void;
  onSelectAll: () => void;
}

export function PlanAddMethodSheet({
  visible,
  onClose,
  bookmarkCount,
  onSelectSaved,
  onSelectAll,
}: PlanAddMethodSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const hasSaved = bookmarkCount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.handleBar }]} />

          <View style={styles.header}>
            <Text style={[Typography.headline, { color: colors.onSurface }]}>
              Add Recipe
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcons name="close" size={20} color={colors.outline} />
            </Pressable>
          </View>

          <Pressable
            onPress={hasSaved ? onSelectSaved : undefined}
            style={[
              styles.optionRow,
              {
                backgroundColor: colors.surfaceContainerLow,
                opacity: hasSaved ? 1 : 0.5,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="From saved recipes"
            accessibilityState={{ disabled: !hasSaved }}
          >
            <View
              style={[
                styles.optionIcon,
                {
                  backgroundColor: hasSaved
                    ? `${colors.primary}18`
                    : `${colors.outline}14`,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="heart-outline"
                size={22}
                color={hasSaved ? colors.primary : colors.outline}
              />
            </View>
            <View style={styles.optionText}>
              <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
                From Saved Recipes
              </Text>
              <Text style={[Typography.caption, { color: colors.outline, marginTop: 2 }]}>
                {hasSaved
                  ? 'Pick from your bookmarked dishes'
                  : 'No saved recipes yet — bookmark some!'}
              </Text>
            </View>
            {hasSaved && (
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
            )}
          </Pressable>

          <Pressable
            onPress={onSelectAll}
            style={[styles.optionRow, { backgroundColor: colors.surfaceContainerLow }]}
            accessibilityRole="button"
            accessibilityLabel="Search all recipes"
          >
            <View style={[styles.optionIcon, { backgroundColor: `${colors.primary}18` }]}>
              <MaterialCommunityIcons name="magnify" size={22} color={colors.primary} />
            </View>
            <View style={styles.optionText}>
              <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>
                Search All Recipes
              </Text>
              <Text style={[Typography.caption, { color: colors.outline, marginTop: 2 }]}>
                Browse all 97 recipes
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.page,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
  },
});
