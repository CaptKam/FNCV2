import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { todayLocal, addDays, getDayLabelFull, formatDateShort } from '@/utils/dates';
import { BottomSheet } from '@/components/BottomSheet';

function getDayLabel(dateStr: string): string {
  const today = todayLocal();
  const tomorrow = addDays(today, 1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  return getDayLabelFull(dateStr);
}

interface AddToPlanButtonProps {
  onPress: () => void;
  recipeName: string;
  variant?: 'default' | 'overlay';
}

export function AddToPlanButton({ onPress, recipeName, variant = 'default' }: AddToPlanButtonProps) {
  const colors = useThemeColors();
  const isOverlay = variant === 'overlay';
  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); onPress(); }}
      style={[
        isOverlay ? styles.triggerBtnOverlay : styles.triggerBtn,
        { backgroundColor: isOverlay ? 'rgba(0,0,0,0.45)' : colors.primarySubtle },
        isOverlay && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Add ${recipeName} to meal plan`}
      hitSlop={4}
    >
      <MaterialCommunityIcons name="plus" size={isOverlay ? 20 : 20} color={isOverlay ? '#FFFFFF' : colors.primary} />
    </Pressable>
  );
}

interface AddToPlanSheetProps {
  visible: boolean;
  recipeName: string;
  onClose: () => void;
  onAdd: (date: string) => void;
}

/**
 * Two-step add-to-plan picker.
 *
 *   Step 1 — shortcut buttons ("Tonight" / "Pick a day") —
 *            Standard A (small).
 *   Step 2 — 14-day list (opens when Pick a day is tapped) —
 *            Standard B (medium).
 *
 * The inner state (`showDayPicker`) toggles between sizes by
 * unmounting one sheet and mounting the other so the BottomSheet
 * spring animation re-runs and the height snaps to the new value.
 */
export function AddToPlanSheet({ visible, recipeName, onClose, onAdd }: AddToPlanSheetProps) {
  const colors = useThemeColors();
  const todayDate = todayLocal();

  const planDays = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = addDays(todayDate, i);
      return { date, label: getDayLabel(date), short: formatDateShort(date) };
    });
  }, [todayDate]);

  const [showDayPicker, setShowDayPicker] = React.useState(false);

  const handleTonight = useCallback(() => {
    onAdd(todayDate);
    setShowDayPicker(false);
  }, [todayDate, onAdd]);

  const handlePickDay = useCallback((date: string) => {
    onAdd(date);
    setShowDayPicker(false);
  }, [onAdd]);

  const handleClose = useCallback(() => {
    setShowDayPicker(false);
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (!visible) setShowDayPicker(false);
  }, [visible]);

  // Step 1 — shortcuts
  if (!showDayPicker) {
    return (
      <BottomSheet
        visible={visible}
        onDismiss={handleClose}
        size="small"
        title="Add to Plan"
      >
        <Text
          style={[
            Typography.bodySmall,
            { color: colors.outline, marginBottom: Spacing.lg },
          ]}
          numberOfLines={1}
        >
          {recipeName}
        </Text>

        <Pressable
          onPress={handleTonight}
          style={[styles.optionRow, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel="Add to tonight's plan"
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySubtle }]}>
            <MaterialCommunityIcons name="weather-night" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>Tonight</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Add to today's meal plan</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
        </Pressable>

        <Pressable
          onPress={() => setShowDayPicker(true)}
          style={[styles.optionRow, { backgroundColor: colors.surfaceContainerHigh }]}
          accessibilityRole="button"
          accessibilityLabel="Pick a day to add recipe"
        >
          <View style={[styles.optionIcon, { backgroundColor: colors.primarySubtle }]}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primary} />
          </View>
          <View style={styles.optionText}>
            <Text style={[Typography.titleSmall, { color: colors.onSurface }]}>Pick a Day</Text>
            <Text style={[Typography.caption, { color: colors.outline }]}>Choose from the next 14 days</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
        </Pressable>
      </BottomSheet>
    );
  }

  // Step 2 — day list
  return (
    <BottomSheet
      visible={visible}
      onDismiss={handleClose}
      size="medium"
      title="Pick a Day"
    >
      <View style={styles.dayPickerHeader}>
        <Pressable
          onPress={() => setShowDayPicker(false)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={{ marginRight: Spacing.sm }}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
        </Pressable>
        <Text
          style={[Typography.bodySmall, { color: colors.outline, flex: 1 }]}
          numberOfLines={1}
        >
          {recipeName}
        </Text>
      </View>
      <FlatList
        data={planDays}
        keyExtractor={(item) => item.date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.md }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handlePickDay(item.date)}
            style={[styles.dayRow, { backgroundColor: colors.surfaceContainerHigh }]}
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBtnOverlay: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  dayPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
