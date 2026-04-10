import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { HeaderBar } from '@/components/HeaderBar';
import { useApp } from '@/context/AppContext';
import { countries } from '@/data/countries';

export default function PassportScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  const explored = Object.keys(app.passportStamps).length;
  const total = countries.length;
  const progress = total > 0 ? explored / total : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <HeaderBar showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.tabClearance, paddingTop: insets.top + 76 }}
      >
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.display, { color: colors.onSurface, marginBottom: Spacing.xs }]}>
            Your Passport
          </Text>
          <Text style={[Typography.bodySmall, { color: colors.onSurfaceVariant, marginBottom: Spacing.lg }]}>
            {explored} of {total} cuisines explored
          </Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.stampGrid}>
          {countries.map((country) => {
            const count = app.passportStamps[country.id] ?? 0;
            const visited = count > 0;
            return (
              <Pressable
                key={country.id}
                onPress={() => router.push(`/country/${country.id}`)}
                style={[
                  styles.stampCard,
                  {
                    backgroundColor: visited ? colors.surfaceContainerLow : colors.surfaceContainerHigh,
                    borderWidth: visited ? 2 : 1,
                    borderColor: visited ? colors.primary : colors.outlineVariant,
                    opacity: visited ? 1 : 0.5,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${country.name}, ${count} recipes cooked`}
              >
                <Text style={{ fontSize: 32 }}>{country.flag}</Text>
                <Text style={[Typography.titleSmall, { color: visited ? colors.onSurface : colors.outline, textAlign: 'center' }]}>
                  {country.name}
                </Text>
                {visited && (
                  <Text style={[Typography.caption, { color: colors.primary }]}>
                    {count} recipe{count !== 1 ? 's' : ''} cooked
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stampGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.page,
    gap: 12,
  },
  stampCard: {
    width: '47%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.xl,
    gap: Spacing.xs,
  },
});
