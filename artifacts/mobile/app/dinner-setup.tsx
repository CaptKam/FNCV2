import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal, Alert, Share } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Typography } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Radius } from '@/constants/radius';
import { useApp } from '@/context/AppContext';
import { DinnerParty, DinnerGuest, DietaryConflict } from '@/types/dinnerParty';
import { countries } from '@/data/countries';

// ─── Helpers ───

function getDayName(dateStr: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

function formatTime(hours: number, mins: number): string {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2);
}

function formatPhoneNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+')) return raw; // international — leave as-is
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const RSVP_ORDER: Array<'pending' | 'accepted' | 'maybe' | 'declined'> = ['pending', 'accepted', 'maybe', 'declined'];

const RSVP_CONFIG = {
  pending: { label: 'Awaiting RSVP', bg: 'transparent', border: true, color: 'outline' },
  accepted: { label: 'Attending', bg: 'success', border: false, color: 'success' },
  maybe: { label: 'Maybe', bg: 'warning', border: false, color: 'warning' },
  declined: { label: "Can't make it", bg: 'error', border: false, color: 'error' },
} as const;

export default function DinnerSetupScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const app = useApp();

  // ─── Initialize or load party ───
  const [partyId, setPartyId] = useState<string | null>(null);
  const [servingHour, setServingHour] = useState(19);
  const [servingMinute, setServingMinute] = useState(0);
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDietary, setGuestDietary] = useState<string[]>([]);
  const [guestAllergens, setGuestAllergens] = useState('');

  useEffect(() => {
    if (!date) return;
    const existing = app.getDinnerPartyForDate(date);
    if (existing) {
      setPartyId(existing.id);
      const [h, m] = existing.targetServingTime.split(':').map(Number);
      setServingHour(h ?? 19);
      setServingMinute(m ?? 0);
    } else {
      // Auto-create
      const itDay = app.itinerary.find((d) => d.date === date);
      const mainRecipe = itDay?.courses.main;
      const countryId = mainRecipe ? (countries.find((c) => {
        const { recipes } = require('@/data/recipes');
        const recipe = recipes.find((r: any) => r.id === mainRecipe.recipeId);
        return recipe?.countryId === c.id;
      })?.id ?? '') : '';
      const country = countries.find((c) => c.id === countryId);
      const dayName = getDayName(date);
      const title = `${dayName} Night ${country?.name ?? 'Dinner'}`;
      const party = app.createDinnerParty({ date, title, targetServingTime: '19:00', cuisineCountryId: countryId });
      setPartyId(party.id);
    }
  }, [date]);

  const party = useMemo(() => {
    if (!partyId) return null;
    return app.dinnerParties.find((p) => p.id === partyId) ?? null;
  }, [partyId, app.dinnerParties]);

  const conflicts = useMemo(() => {
    if (!partyId) return [];
    return app.checkDietaryConflicts(partyId);
  }, [partyId, app.dinnerParties]);

  const guestCounts = useMemo(() => {
    if (!partyId) return { total: 0, accepted: 0, maybe: 0, declined: 0, pending: 0 };
    return app.getGuestCount(partyId);
  }, [partyId, app.dinnerParties]);

  // Estimate cook start time
  const totalCookMinutes = useMemo(() => {
    if (!party) return 0;
    const { recipes } = require('@/data/recipes');
    let total = 0;
    for (const course of Object.values(party.menu)) {
      if (course) {
        const recipe = recipes.find((r: any) => r.id === course.recipeId);
        if (recipe) total += recipe.prepTime + recipe.cookTime;
      }
    }
    return total;
  }, [party]);

  const startTimeStr = useMemo(() => {
    const totalMins = servingHour * 60 + servingMinute - totalCookMinutes;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return formatTime(h < 0 ? h + 24 : h, m < 0 ? m + 60 : m);
  }, [servingHour, servingMinute, totalCookMinutes]);

  const adjustTime = (delta: number) => {
    let totalMins = servingHour * 60 + servingMinute + delta;
    if (totalMins < 17 * 60) totalMins = 17 * 60; // min 5:00 PM
    if (totalMins > 23 * 60) totalMins = 23 * 60; // max 11:00 PM
    setServingHour(Math.floor(totalMins / 60));
    setServingMinute(totalMins % 60);
    if (partyId) {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      app.updateDinnerParty(partyId, { targetServingTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
    }
  };

  const handleAddGuest = () => {
    if (!partyId || !guestName.trim()) return;
    const allergenList = guestAllergens.trim()
      ? guestAllergens.split(',').map((a) => a.trim()).filter(Boolean)
      : [];
    app.addGuest(partyId, {
      name: guestName.trim(),
      phone: guestPhone.trim() || undefined,
      email: guestEmail.trim() || undefined,
      dietaryRestrictions: guestDietary,
      allergens: allergenList,
    });
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    setGuestName('');
    setGuestPhone('');
    setGuestEmail('');
    setGuestDietary([]);
    setGuestAllergens('');
    setShowAddGuest(false);
  };

  const handleRemoveGuest = (guestId: string, name: string) => {
    Alert.alert('Remove Guest', `Remove ${name} from the guest list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => partyId && app.removeGuest(partyId, guestId) },
    ]);
  };

  const handleCycleRsvp = (guestId: string, currentStatus: typeof RSVP_ORDER[number]) => {
    if (!partyId) return;
    const idx = RSVP_ORDER.indexOf(currentStatus);
    const next = RSVP_ORDER[(idx + 1) % RSVP_ORDER.length];
    app.updateGuestRsvp(partyId, guestId, { rsvpStatus: next });
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  };

  const handleSendInvites = async () => {
    if (!partyId || !party) return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}

    const country = countries.find((c) => c.id === party.cuisineCountryId);
    const dateDisplay = formatDateDisplay(party.date);
    const timeDisplay = formatTime(servingHour, servingMinute);
    let sentCount = 0;

    for (const guest of party.guests) {
      if (!guest.phone) continue;
      const inviteText = `🍽️ You're invited to dinner!\n\n${party.title} — ${country?.name ?? ''} cuisine\n📅 ${dateDisplay} at ${timeDisplay}\n\nLet me know about any dietary needs!\n\n— Sent via Fork & Compass`;

      try {
        await Share.share({ message: inviteText, title: 'Dinner Invite' });
        app.updateGuestRsvp(partyId, guest.id, { rsvpStatus: guest.rsvpStatus });
        sentCount++;
      } catch {}
    }

    app.updateDinnerParty(partyId, { status: 'invites_sent' });

    // Navigate forward
    const { recipes } = require('@/data/recipes');
    const dinnerRecipes = Object.values(party.menu)
      .filter(Boolean)
      .map((m: any) => recipes.find((r: any) => r.id === m.recipeId))
      .filter(Boolean);
    if (dinnerRecipes.length > 0) {
      const target = new Date();
      target.setHours(servingHour, servingMinute, 0, 0);
      app.createDinnerPlan(dinnerRecipes, target, guestCounts.total + 1);
      router.push('/cooking-schedule');
    } else {
      router.back();
    }
  };

  const handleJustCook = () => {
    if (!partyId || !party) return;
    app.startDinnerPartyCooking(partyId);
    const { recipes } = require('@/data/recipes');
    const dinnerRecipes = Object.values(party.menu)
      .filter(Boolean)
      .map((m: any) => recipes.find((r: any) => r.id === m.recipeId))
      .filter(Boolean);
    if (dinnerRecipes.length > 0) {
      const target = new Date();
      target.setHours(servingHour, servingMinute, 0, 0);
      app.createDinnerPlan(dinnerRecipes, target, guestCounts.total + 1);
      router.push('/cooking-schedule');
    } else {
      router.back();
    }
  };

  const handleSkipInvites = () => {
    if (!partyId) return;
    app.startDinnerPartyCooking(partyId);
    router.back();
  };

  if (!party || !date) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[Typography.body, { color: colors.onSurface, textAlign: 'center', marginTop: 200 }]}>Loading...</Text>
      </View>
    );
  }

  const hasPhones = party.guests.some((g) => g.phone);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, paddingTop: insets.top + 16 }}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <View style={[styles.backBtn, { backgroundColor: 'rgba(30,25,20,0.85)' }]}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.display, { color: colors.onSurface }]}>Plan Your Dinner</Text>
          <Text style={[Typography.bodySmall, { color: colors.outline, marginTop: Spacing.xs }]}>{party.title}</Text>
        </View>

        {/* Section 1: Menu */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>YOUR MENU</Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>Tonight's Courses</Text>

          {(['appetizer', 'main', 'dessert'] as const).map((courseType) => {
            const course = party.menu[courseType];
            if (!course) {
              return (
                <View key={courseType} style={[styles.menuRow, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={[styles.menuImagePlaceholder, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <MaterialCommunityIcons name="silverware-variant" size={28} color={colors.outlineVariant} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[Typography.labelSmall, { color: colors.outline }]}>{courseType.toUpperCase()}</Text>
                    <Text style={[Typography.bodySmall, { color: colors.outline, fontStyle: 'italic' }]}>No {courseType} planned</Text>
                  </View>
                  <Pressable onPress={() => router.push('/(tabs)/plan')} accessibilityRole="button" accessibilityLabel={`Add ${courseType}`}>
                    <Text style={[Typography.titleSmall, { color: colors.primary }]}>Add</Text>
                  </Pressable>
                </View>
              );
            }
            return (
              <View key={courseType} style={[styles.menuRow, { backgroundColor: colors.surfaceContainerLow }]}>
                <Image source={{ uri: course.recipeImage }} style={styles.menuImage} contentFit="cover" transition={200} />
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.labelSmall, { color: colors.outline }]}>{courseType.toUpperCase()}</Text>
                  <Text style={[Typography.titleMedium, { color: colors.onSurface }]} numberOfLines={1}>{course.recipeName}</Text>
                </View>
              </View>
            );
          })}

          {/* Dietary conflicts */}
          {conflicts.length > 0 && (
            <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
              {conflicts.map((c, i) => (
                <View key={i} style={[styles.conflictPill, { backgroundColor: c.severity === 'critical' ? `${colors.error}15` : `${colors.warning}15` }]}>
                  <MaterialCommunityIcons
                    name={c.severity === 'critical' ? 'alert-circle' : 'alert'}
                    size={16}
                    color={c.severity === 'critical' ? colors.error : colors.warning}
                  />
                  <Text style={[Typography.bodySmall, { color: c.severity === 'critical' ? colors.error : colors.warning, flex: 1 }]}>
                    {c.guestName} — {c.conflictingRecipe} contains {c.conflictingIngredient}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Section 2: Serving Time */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>TIMING</Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>When do you want to eat?</Text>

          <View style={[styles.timeCard, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Pressable onPress={() => adjustTime(-15)} style={styles.timeBtn} accessibilityRole="button" accessibilityLabel="Earlier">
              <MaterialCommunityIcons name="minus" size={20} color={colors.primary} />
            </Pressable>
            <View style={styles.timeDisplay}>
              <Text style={[Typography.displayMedium, { color: colors.onSurface, fontSize: 32 }]}>
                {formatTime(servingHour, servingMinute)}
              </Text>
            </View>
            <Pressable onPress={() => adjustTime(15)} style={styles.timeBtn} accessibilityRole="button" accessibilityLabel="Later">
              <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={[Typography.body, { color: colors.primary, textAlign: 'center', marginTop: Spacing.md }]}>
            Start cooking by {startTimeStr}
          </Text>
        </View>

        {/* Section 3: Guest List */}
        <View style={{ paddingHorizontal: Spacing.page, marginBottom: Spacing.xl }}>
          <Text style={[Typography.labelLarge, { color: colors.outline, marginBottom: Spacing.xs }]}>GUESTS</Text>
          <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.xs }]}>Who's coming?</Text>
          <Text style={[Typography.caption, { color: colors.outline, marginBottom: Spacing.lg }]}>
            {guestCounts.total} guest{guestCounts.total !== 1 ? 's' : ''}
            {party.guests.some((g) => g.dietaryRestrictions.length > 0) ? ` · ${party.guests.filter((g) => g.dietaryRestrictions.length > 0).length} dietary notes` : ''}
          </Text>

          {party.guests.map((guest) => {
            const rsvp = RSVP_CONFIG[guest.rsvpStatus];
            const rsvpColor = rsvp.color === 'outline' ? colors.outline : (colors as any)[rsvp.color] ?? colors.outline;
            return (
              <Pressable key={guest.id} onLongPress={() => handleRemoveGuest(guest.id, guest.name)} style={[styles.guestCard, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.guestAvatar, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={[Typography.titleSmall, { color: colors.primary }]}>{getInitials(guest.name)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Typography.titleMedium, { color: colors.onSurface }]}>{guest.name}</Text>
                  <View style={styles.guestBadges}>
                    <Pressable
                      onPress={() => handleCycleRsvp(guest.id, guest.rsvpStatus)}
                      style={[styles.rsvpPill, rsvp.border ? { borderWidth: 1, borderColor: colors.outlineVariant } : { backgroundColor: `${rsvpColor}15` }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Change RSVP status, currently ${rsvp.label}`}
                    >
                      <Text style={[Typography.labelSmall, { color: rsvpColor }]}>{rsvp.label}</Text>
                    </Pressable>
                    {guest.dietaryRestrictions.map((d, i) => (
                      <View key={i} style={[styles.dietPill, { backgroundColor: colors.surfaceContainerHigh }]}>
                        <Text style={[Typography.caption, { color: colors.onSurfaceVariant }]}>{d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            );
          })}

          <Pressable
            onPress={() => setShowAddGuest(true)}
            style={[styles.addGuestBtn, { borderColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Add guest"
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={colors.primary} />
            <Text style={[Typography.titleSmall, { color: colors.primary }]}>Add Guest</Text>
          </Pressable>

          {party.guests.length > 0 && (
            <Text style={[Typography.bodySmall, { color: colors.outline, textAlign: 'center', marginTop: Spacing.md }]}>
              You + {guestCounts.total} guest{guestCounts.total !== 1 ? 's' : ''} = {guestCounts.total + 1} servings
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTAs */}
      <View style={[styles.bottomCTA, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable onPress={handleJustCook} style={[styles.primaryBtn, { backgroundColor: colors.primary }]} accessibilityRole="button">
          <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>
            Let's Cook
          </Text>
        </Pressable>
      </View>

      {/* Add Guest Sheet */}
      <Modal visible={showAddGuest} transparent animationType="slide" onRequestClose={() => setShowAddGuest(false)}>
        <Pressable style={styles.sheetOverlay} onPress={() => setShowAddGuest(false)}>
          <Pressable style={[styles.sheetContainer, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.handleBar }]} />
            <Text style={[Typography.headline, { color: colors.onSurface, marginBottom: Spacing.lg }]}>Add a Guest</Text>

            <Text style={[Typography.labelSmall, { color: colors.outline, marginBottom: Spacing.xs }]}>NAME *</Text>
            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Guest name"
              placeholderTextColor={colors.outline}
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            />

            <Text style={[Typography.labelSmall, { color: colors.outline, marginBottom: Spacing.xs, marginTop: Spacing.md }]}>PHONE (optional)</Text>
            <TextInput
              value={guestPhone}
              onChangeText={(text) => setGuestPhone(text.startsWith('+') ? text : formatPhoneNumber(text))}
              placeholder="(555) 555-0100"
              placeholderTextColor={colors.outline}
              keyboardType="phone-pad"
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            />

            <Text style={[Typography.labelSmall, { color: colors.outline, marginBottom: Spacing.xs, marginTop: Spacing.md }]}>EMAIL (optional)</Text>
            <TextInput
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder="guest@email.com"
              placeholderTextColor={colors.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            />

            <Text style={[Typography.labelSmall, { color: colors.outline, marginBottom: Spacing.xs, marginTop: Spacing.md }]}>DIETARY PREFERENCES</Text>
            <View style={styles.dietaryChips}>
              {['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Halal'].map((diet) => {
                const key = diet.toLowerCase();
                const selected = guestDietary.includes(key);
                return (
                  <Pressable
                    key={key}
                    onPress={() => setGuestDietary((prev) => selected ? prev.filter((d) => d !== key) : [...prev, key])}
                    style={[
                      styles.dietaryChip,
                      { backgroundColor: selected ? `${colors.primary}18` : colors.surfaceContainerLow, borderColor: selected ? colors.primary : 'transparent', borderWidth: 1.5 },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[Typography.caption, { color: selected ? colors.primary : colors.onSurface }]}>{diet}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[Typography.labelSmall, { color: colors.outline, marginBottom: Spacing.xs, marginTop: Spacing.md }]}>ALLERGENS (optional)</Text>
            <TextInput
              value={guestAllergens}
              onChangeText={setGuestAllergens}
              placeholder="e.g. peanuts, shellfish"
              placeholderTextColor={colors.outline}
              style={[styles.input, { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface }]}
            />

            <Pressable
              onPress={handleAddGuest}
              style={[styles.sheetCTA, { backgroundColor: colors.primary, opacity: guestName.trim() ? 1 : 0.5 }]}
              disabled={!guestName.trim()}
              accessibilityRole="button"
            >
              <Text style={[Typography.titleMedium, { color: colors.onPrimary }]}>Add</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    paddingHorizontal: Spacing.page,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
  },
  menuImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  timeBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  rsvpPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  dietPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  addGuestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.page,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  primaryBtn: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    height: 48,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.page,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
    fontSize: 16,
  },
  dietaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dietaryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  sheetCTA: {
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
});
