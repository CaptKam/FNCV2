# FORK & COMPASS — Master Blueprint V3

> **"Pick a country, cook a dinner, feel like you traveled."**

---

## 1. Product Overview

**Fork & Compass** is a premium culinary travel mobile app built with Expo (SDK 54) and React Native. Users explore world cuisines through curated country profiles, discover authentic recipes, plan weekly meal itineraries, generate smart grocery lists, and cook with guided step-by-step sessions.

**Design Language:** "The Ethereal Archivist" — warm terracotta and cream palette, Liquid Glass effects, floating pill navigation, editorial typography.

---

## 2. Design System (Locked — Do Not Change)

### 2.1 Color Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `primary` | `#9A4100` (terracotta) | `#9A4100` (same) |
| `surface` | `#FEF9F3` (cream) | `#161412` |
| `onSurface` | `#1C1B1F` | `#F5F0EA` |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` |
| `outline` | `#79747E` | `#938F99` |
| `surfaceContainerLow` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.06)` |

### 2.2 Typography

| Style | Font | Usage |
|-------|------|-------|
| Display/Headlines | Noto Serif (400/700) | Page titles, hero text, section headers |
| Body/Labels | Inter (400/500/600) | All body copy, buttons, captions, tab labels |

### 2.3 Liquid Glass Effect

- `BlurView` (expo-blur) with `intensity: 25`, tint `light`/`dark`
- Specular highlight: **TOP edge only** — 1px gradient white→transparent
- NO solid borders anywhere
- NO pure `#000000` black — use `colors.inverseSurface` or `#161412`

### 2.4 Layout & Spacing

- 8pt grid system (`Spacing.xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`)
- Floating pill tab bar: absolute positioned, `bottom: insets.bottom + 16`, borderRadius `Radius.full`
- `paddingBottom: 120+` on all scroll content to clear tab bar

### 2.5 Tab Bar Icons (MaterialCommunityIcons)

| Tab | Icon |
|-----|------|
| Discover | `compass-outline` |
| Search | `magnify` |
| Plan | `calendar-month-outline` |
| Grocery | `cart-outline` |
| Cook | `chef-hat` |

### 2.6 HeaderBar Component

- Shared `HeaderBar` used on all 5 tab screens
- `transparent` prop on Discover (overlays hero carousel)
- Frosted glass (BlurView) on all other tabs
- `position: absolute`, `zIndex: 70`
- Content padding: `paddingTop: insets.top + 68`

---

## 3. Current Architecture

### 3.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54, expo-router (file-based) |
| Language | TypeScript |
| State | React Context + AsyncStorage |
| Navigation | expo-router tabs + stack |
| Styling | React Native StyleSheet |
| Images | expo-image |
| Data | Local mock data (no backend) |

### 3.2 Screen Inventory

| Screen | Route | Status |
|--------|-------|--------|
| Discover | `/(tabs)/` | Complete |
| Search | `/(tabs)/search` | Complete |
| Plan | `/(tabs)/plan` | UI complete, data hardcoded |
| Grocery | `/(tabs)/grocery` | UI complete, scaling broken |
| Cook | `/(tabs)/cook` | Complete |
| Country Detail | `/country/[id]` | Complete |
| Recipe Detail | `/recipe/[id]` | Complete, scaling broken |
| Cook Mode | `/cook-mode/[id]` | Complete |
| Profile | `/profile` | Complete |
| Bookmarks | `/bookmarks` | Complete |

### 3.3 Data Layer

- **8 countries** in `data/countries.ts`: Italy, Japan, Mexico, France, Thailand, India, Morocco, Greece
- **97 recipes** in `data/recipes.ts`: full ingredient lists, step-by-step instructions, cultural notes
- **Ingredient model**: `{ name: string; amount: string; category: Category }` — amount is a display string (e.g., "400g", "2 tbsp"), NOT a numeric value

### 3.4 State Management

| Context | File | Persistence | Purpose |
|---------|------|------------|---------|
| ThemeContext | `context/ThemeContext.tsx` | AsyncStorage | User theme preference (system/light/dark) |
| BookmarksContext | `context/BookmarksContext.tsx` | AsyncStorage | Saved recipe IDs |

**Hook pattern:** All screens use `useThemeColors()` (from `hooks/useThemeColors.ts`) which reads from `ThemeContext`. Never import colors directly.

### 3.5 Component Library

| Component | File | Usage |
|-----------|------|-------|
| GlassView | `components/GlassView.tsx` | Frosted glass container with specular highlight |
| HeaderBar | `components/HeaderBar.tsx` | Shared header across all tabs |
| SectionHeader | `components/SectionHeader.tsx` | Label + title + action link |
| RecipeCard | `components/RecipeCard.tsx` | Grid recipe cards |
| DestinationCard | `components/DestinationCard.tsx` | Country cards |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Error catch wrapper |

---

## 4. Functional Audit — Known Gaps

### Gap 1: Ingredient Amount Scaling (Recipe Detail + Grocery)

**Problem:** The `amount` field on ingredients is a display string (`"400g"`, `"2 tbsp, freshly cracked"`). The servings adjuster in Recipe Detail changes the `servings` state but ingredients always render `ing.amount` unscaled. Grocery tab has the same issue — `servingSizes` state exists but `buildGroceryList()` ignores it.

**Impact:** Servings controls are cosmetic-only. Users cannot scale recipes.

**Solution:** Parse ingredient amounts into `{ value: number; unit: string; qualifier?: string }` tuples. Apply `(currentServings / baseServings)` multiplier. Display formatted result. Requires a parsing utility and data model change.

### Gap 2: Grocery List Ingredient Deduplication

**Problem:** `buildGroceryList()` deduplicates by `ing.name` and keeps the first recipe's `amount`, but when the same ingredient appears across multiple recipes with different quantities (e.g., "2 cloves garlic" + "4 cloves garlic"), amounts are not summed — only the first amount is shown.

**Impact:** Grocery list underreports quantities for shared ingredients.

**Solution:** After parsing amounts into numeric values, sum quantities for matching ingredient names with compatible units.

### Gap 3: Grocery Tab Badge (Unchecked Item Count)

**Problem:** The Grocery tab icon shows no badge indicating how many unchecked items remain. The checked state is local to the Grocery screen and not accessible from `_layout.tsx` where tab badges would be rendered.

**Impact:** No at-a-glance indication of outstanding grocery items.

**Solution:** Lift grocery state to a `GroceryContext` (or unified `AppContext`) so `_layout.tsx` can read unchecked count and render a badge on the cart icon.

### Gap 4: Plan Tab — Fully Hardcoded Data

**Problem:** The Plan tab uses `PLANNED_DAYS`, `DAILY_MEALS`, and `MOCK_DATES` as top-level constants. There is no state management for:
- Adding/removing recipes to/from days
- Auto-generating itineraries from selected country
- Editing meal slots (appetizer, dessert, drink pairing course slots exist but are non-functional)

**Impact:** Plan tab is a static mockup. Users cannot actually plan meals.

**Solution:** Create `PlanContext` with itinerary state: `Record<day, Record<mealSlot, recipeId>>`. Add "Add to Plan" actions from Recipe Detail and Country Detail. Wire course slot pickers to recipe search/selection.

### Gap 5: No Global AppContext

**Problem:** Cook sessions, itinerary state, and grocery state are all either local to individual screens or hardcoded. There is no shared app-level context for:
- Active cook session tracking (which recipe, which step, timer state)
- Itinerary data (planned meals per day)
- Grocery list recipes and checked state

**Impact:** Screens cannot communicate. Cook tab shows a hardcoded "active recipe" (`recipes[3]`), not an actual in-progress session.

**Solution:** Create a unified `AppContext` (or multiple focused contexts: `CookSessionContext`, `PlanContext`, `GroceryContext`) that provides session state across screens.

### Gap 6: No CookingPill / Active Session Indicator

**Problem:** When a cook session is active, there is no floating indicator on the tab bar or elsewhere showing the in-progress recipe. The Cook tab always shows a hardcoded "Resume Session" for `recipes[3]`.

**Impact:** No quick-resume capability from any screen when cooking.

**Solution:** After creating `CookSessionContext`, add a floating pill component positioned above the tab bar that shows when `activeSession != null`. Tapping it navigates to `/cook-mode/[id]` with the current step restored.

### Gap 7: Cook Mode — No Servings Scaler

**Problem:** Cook Mode screen shows step instructions and contextual ingredients, but there is no way to adjust servings. Ingredient amounts shown in pills are static `ing.amount` strings.

**Impact:** If a user is cooking for a different number of people, they must mentally scale everything.

**Solution:** After building the amount parsing utility (Gap 1), add a servings selector to Cook Mode's top bar and scale ingredient pill amounts accordingly.

---

## 5. Systems Roadmap

### Priority 1: Ingredient Amount Parsing Engine

**Scope:** Build `utils/ingredientParser.ts` that converts display strings to structured data.

```
Input:  "400g" → { value: 400, unit: "g", qualifier: "" }
Input:  "2 tbsp, freshly cracked" → { value: 2, unit: "tbsp", qualifier: "freshly cracked" }
Input:  "1 large, diced" → { value: 1, unit: "whole", qualifier: "large, diced" }
Input:  "reserved" → { value: 0, unit: "", qualifier: "reserved" }
```

Then build `scaleAmount(parsed, currentServings, baseServings)` that returns a formatted display string.

**Unblocks:** Gaps 1, 2, 7

### Priority 2: Global State Contexts

**Scope:** Create three focused contexts:

1. **`CookSessionContext`** — tracks active recipe ID, current step index, timer state, servings override
2. **`PlanContext`** — tracks weekly itinerary as `Record<string, Record<string, string | null>>` (day → mealSlot → recipeId), persisted to AsyncStorage
3. **`GroceryContext`** — tracks active recipe IDs, servings overrides per recipe, checked item IDs; derived grocery list computed via `useMemo`

All three wrap the app in `_layout.tsx` alongside existing `ThemeProvider` and `BookmarksProvider`.

**Unblocks:** Gaps 3, 4, 5, 6

### Priority 3: Wire Recipe Detail Scaling

**Scope:** Use the parsing engine from P1 to make ingredient amounts in Recipe Detail scale dynamically when `servings` state changes.

**Depends on:** P1

### Priority 4: Wire Grocery List Scaling + Deduplication

**Scope:** Refactor `buildGroceryList()` to:
- Accept `servingSizes` record
- Parse and scale each ingredient's amount based on recipe's base servings vs. user-selected servings
- Sum numeric amounts for duplicate ingredients with compatible units
- Format display strings for the list

**Depends on:** P1, P2

### Priority 5: Plan Tab — Functional Itinerary

**Scope:** Replace hardcoded `PLANNED_DAYS`/`DAILY_MEALS` with `PlanContext` state. Add:
- "Add to Plan" action from Recipe Detail (pick day + meal slot)
- "Auto-Generate Week" from Country Detail (fill empty dinner slots with country's recipes)
- Tap empty meal slot → recipe picker modal
- Swipe to remove planned meal

**Depends on:** P2

### Priority 6: Cook Session System + CookingPill

**Scope:**
- When user taps "Start Cooking" in Recipe Detail, create a session in `CookSessionContext`
- Cook Mode reads/writes session state (current step, timer)
- Leaving Cook Mode keeps session alive
- Cook tab "Resume Session" reads from context instead of `recipes[3]`
- Floating `CookingPill` component renders above tab bar when session is active

**Depends on:** P2

### Priority 7: Grocery Tab Badge

**Scope:** Read `uncheckedCount` from `GroceryContext` in `_layout.tsx` and render a numeric badge on the Grocery tab icon.

**Depends on:** P2

### Priority 8: Cook Mode Servings Scaler

**Scope:** Add servings selector to Cook Mode top bar. Scale ingredient pill amounts using parsing engine.

**Depends on:** P1, P6

---

## 6. File Map

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx                    # Root layout: providers, error boundary
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator config + floating pill bar
│   │   ├── index.tsx                  # Discover (hero carousel, tonight's plan)
│   │   ├── search.tsx                 # Search (text + mood filters)
│   │   ├── plan.tsx                   # Plan (weekly/daily view) ⚠️ hardcoded
│   │   ├── grocery.tsx                # Grocery (categorized checklist) ⚠️ scaling broken
│   │   └── cook.tsx                   # Cook (reputation, technique library)
│   ├── country/[id].tsx               # Country detail
│   ├── recipe/[id].tsx                # Recipe detail ⚠️ scaling broken
│   ├── cook-mode/[id].tsx             # Active cook mode
│   ├── profile.tsx                    # Profile & settings
│   └── bookmarks.tsx                  # Saved recipes
├── components/
│   ├── GlassView.tsx                  # Liquid Glass container
│   ├── HeaderBar.tsx                  # Shared header (transparent/frosted)
│   ├── SectionHeader.tsx              # Label + title + action
│   ├── RecipeCard.tsx                 # Grid recipe card
│   ├── DestinationCard.tsx            # Country card
│   ├── ErrorBoundary.tsx              # Error boundary
│   ├── ErrorFallback.tsx              # Error fallback UI
│   └── KeyboardAwareScrollViewCompat.tsx
├── constants/
│   ├── colors.ts                      # Theme color definitions
│   ├── typography.ts                  # Font styles
│   ├── spacing.ts                     # 8pt grid
│   ├── radius.ts                      # Border radius tokens
│   ├── shadows.ts                     # Shadow definitions
│   └── glass.ts                       # Glass effect tokens
├── context/
│   ├── ThemeContext.tsx                # Theme preference + persistence
│   └── BookmarksContext.tsx            # Bookmark state + persistence
├── data/
│   ├── countries.ts                   # 8 countries
│   └── recipes.ts                     # 97 recipes
├── hooks/
│   └── useThemeColors.ts              # Theme-aware color accessor
└── FLOW_MAP.md                        # Detailed screen flow documentation
```

---

## 7. Non-Functional Considerations

### Performance
- Recipe data is 97 items loaded from a static file — no lazy loading needed
- `useMemo` used for filtered lists (Search, Grocery grouping)
- `expo-image` with `transition={300}` for smooth image loads

### Persistence
- AsyncStorage for: theme preference, bookmarks
- Future: itinerary state, grocery checked state, cook session state

### Accessibility
- `accessibilityRole`, `accessibilityLabel`, `accessibilityState` applied across all interactive elements
- Tab bar items have `tabBarAccessibilityLabel`
- Haptic feedback in Cook Mode (step navigation, timer completion)

### Platform
- Expo SDK 54, managed workflow
- `expo-keep-awake` v15 (compatible with SDK 54)
- `react-native-keyboard-controller` v1.18.5 (compatible with SDK 54)
- Web fallbacks via `Platform.OS === 'web'` checks in tab bar positioning

---

## 8. Design Rules Checklist (For Every PR)

- [ ] No solid borders — use glass specular highlight (top edge only)
- [ ] No pure `#000000` — use `colors.inverseSurface`
- [ ] Terracotta `#9A4100` for ALL interactive elements (both light AND dark)
- [ ] Noto Serif for headlines, Inter for body/labels
- [ ] 8pt spacing grid
- [ ] Floating pill tab bar with GlassView background
- [ ] HeaderBar component used on all tab screens
- [ ] `useThemeColors()` hook — never import color values directly
- [ ] Dark mode renders correctly
- [ ] Tab icons are MaterialCommunityIcons (not Feather for tabs)
- [ ] Scroll content clears tab bar (`paddingBottom: 120+`)
