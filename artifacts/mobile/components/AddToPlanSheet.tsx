import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';
import { GlassView } from '@/components/GlassView';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { todayLocal, addDays, getDayLabelFull, formatDateShort } from '@/utils/dates';

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={styles.sheetOuter}
        >
          <GlassView style={styles.sheet}>
            <View style={[styles.handle, { backgroundColor: colors.handleBar }]} />

            {!showDayPicker ? (
              <>
                <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: 4 }]}>
                  Add to Plan
                </Text>
                <Text style={[Typography.bodySmall, { color: colors.outline, marginBottom: Spacing.lg }]} numberOfLines={1}>
                  {recipeName}
                </Text>

                <Pressable
                  onPress={handleTonight}
                  style={[styles.optionRow, { backgroundColor: colors.surfaceContainerLow }]}
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
                  style={[styles.optionRow, { backgroundColor: colors.surfaceContainerLow }]}
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
              </>
            ) : (
              <>
                <View style={styles.dayPickerHeader}>
                  <Pressable onPress={() => setShowDayPicker(false)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back">
                    <MaterialCommunityIcons name="arrow-left" size={20} color={colors.onSurface} />
                  </Pressable>
                  <Text style={[Typography.headline, { color: colors.onSurface, flex: 1 }]}>
                    Pick a Day
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: colors.outline, marginBottom: Spacing.md }]} numberOfLines={1}>
                  {recipeName}
                </Text>
                <FlatList
                  data={planDays}
                  keyExtractor={(item) => item.date}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 360 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => handlePickDay(item.date)}
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
              </>
            )}
          </GlassView>
        </Pressable>
      </Pressable>
    </Modal>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetOuter: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheet: {
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
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
    gap: Spacing.sm,
    marginBottom: 4,
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
