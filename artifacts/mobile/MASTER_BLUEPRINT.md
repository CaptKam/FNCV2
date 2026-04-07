# FORK & COMPASS — Master Blueprint V3

> **"Pick a country, cook a dinner, feel like you traveled."**

---

## 1. Product Vision

Fork & Compass transforms home kitchens into portals to the world. Each session begins with a country — its food culture, its signature dishes, its stories — and ends with a real meal on the table. The app isn't a recipe database; it's a curated culinary travel experience that makes cooking feel like an adventure.

**Core Loop:** Discover a country → Choose a recipe → Plan your week → Shop for ingredients → Cook with guided steps

**Target User:** Home cooks who want more than instructions — they want context, culture, and the feeling of having traveled somewhere new.

**Data Model:** All data is local mock data. 8 countries, 97 recipes with full ingredient lists, step-by-step instructions, and cultural notes. No backend required.

---

## 2. Design Philosophy: "The Ethereal Archivist"

The visual language evokes a well-traveled food journal — warm, tactile, and refined. Every surface feels like parchment held up to light; every interaction has weight and intention.

**Principles:**
- **Warmth over coolness** — Terracotta and cream, never clinical blues or grays
- **Glass over solid** — Frosted translucency suggests depth without heaviness
- **Editorial typography** — Serif headlines give authority; sans-serif body gives clarity
- **Restraint** — No gratuitous animation, no visual clutter, no solid borders
- **Consistency** — Terracotta `#9A4100` is THE interactive color in both light and dark mode

**Non-Negotiable Rules:**
- No solid borders anywhere — use Liquid Glass specular highlight (`borderTopWidth: 1`, top edge only)
- No pure `#000000` — use `colors.inverseSurface` (`#32302C` light / `#F0ECE6` dark)
- Terracotta `#9A4100` for ALL interactive elements in both light AND dark mode
- Noto Serif for headlines/display text, Inter for body/labels
- 8pt spacing grid
- Floating pill tab bar with GlassView background
- Dark mode must be fully supported
- Web fallback: GlassView renders as `View` with background color overlay (no BlurView on web)

---

## 3. The Ethereal Archivist Design System

### 3.1 Color Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `primary` | `#9A4100` (terracotta) | `#9A4100` (same) |
| `onPrimary` | `#FFFFFF` | `#4A1C00` |
| `surface` | `#FEF9F3` (cream) | `#161412` |
| `onSurface` | `#1D1B18` | `#F0ECE6` |
| `onSurfaceVariant` | `#564339` | `#D4C4B8` |
| `outline` | `#897267` | `#9D8C82` |
| `outlineVariant` | `#DDC1B4` | `#514339` |
| `surfaceContainerLow` | `#F8F3ED` | `#1D1B18` |
| `surfaceContainerHigh` | `#ECE7E2` | `#2C2926` |
| `inverseSurface` | `#32302C` | `#F0ECE6` |
| `inverseOnSurface` | `#F5F0EA` | `#32302C` |
| `success` | `#2D6A4F` | `#52B788` |
| `error` | `#BA1A1A` | `#FFB4AB` |

### 3.2 Typography

| Style | Font | Weight | Usage |
|-------|------|--------|-------|
| `display` / `displayMedium` / `displayLarge` | Noto Serif | 700 | Page titles, hero overlays |
| `headline` / `headlineLarge` | Noto Serif | 400 | Section titles |
| `title` / `titleMedium` / `titleSmall` | Inter | 600 | Buttons, card titles |
| `body` / `bodySmall` | Inter | 400 | Body copy, descriptions |
| `label` / `labelLarge` / `labelSmall` | Inter | 500 | Chip labels, category headers |
| `caption` | Inter | 400 | Metadata, timestamps |

### 3.3 Liquid Glass Effect (GlassView)

- `BlurView` (expo-blur) with `intensity: 32` (light) / `40` (dark), tint `light`/`dark`
- Background overlay: `rgba(255,255,255,0.7)` (light) / `rgba(29,27,24,0.85)` (dark)
- Specular highlight: **TOP edge only** — 1px `borderTopColor: rgba(255,255,255,0.4)` (light) / `rgba(255,255,255,0.15)` (dark)
- Applied via shared `GlassView` component — never build glass effects inline
- Used for: tab bar background, header bar, floating cards, badges, overlays

### 3.4 Layout & Spacing

- 8pt grid: `Spacing.xs=4, sm=8, md=16, lg=24, xl=32, xxl=48`
- Page horizontal padding: `Spacing.page` (20)
- Border radii: `Radius.sm=8, md=12, lg=16, xl=24, full=9999`
- Shadows: `Shadows.subtle` (cards), `Shadows.ambient` (floating elements)

### 3.5 Tab Bar

- Floating pill: absolute positioned, `bottom: insets.bottom + 16`
- GlassView background with `borderRadius: Radius.full`
- Icons: MaterialCommunityIcons (`compass-outline`, `magnify`, `calendar-month-outline`, `cart-outline`, `chef-hat`)
- Labels: Inter 500, 10pt
- Active: terracotta tint + subtle scale transform
- All scroll content must have `paddingBottom: 120+` to clear the tab bar

### 3.6 HeaderBar

- Shared `HeaderBar` component on all 5 tab screens
- `transparent` prop on Discover (overlays hero carousel, no background)
- Frosted glass (GlassView) on all other tabs
- `position: absolute`, `zIndex: 70`
- Content below must offset with `paddingTop: insets.top + 68`

---

## 4. App Architecture

### 4.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (managed workflow) | SDK 54 |
| Router | expo-router (file-based) | v4 |
| Language | TypeScript | 5.x |
| State | React Context + AsyncStorage | — |
| Images | expo-image | — |
| Effects | expo-blur, expo-linear-gradient | — |
| Haptics | expo-haptics | — |
| Keep Awake | expo-keep-awake | v15 |
| Keyboard | react-native-keyboard-controller | v1.18.5 |
| Gestures | react-native-gesture-handler | — |
| Data fetching | @tanstack/react-query | — |
| Splash | expo-splash-screen | — |

### 4.2 Provider Stack (app/_layout.tsx)

```
SafeAreaProvider
  └─ ErrorBoundary
       └─ QueryClientProvider
            └─ GestureHandlerRootView
                 └─ ThemeProvider
                      └─ BookmarksProvider
                           └─ KeyboardProvider
                                └─ <Stack> navigator
```

### 4.3 Navigation Structure

```
Root Stack
├── (tabs)/           # Tab navigator
│   ├── index         # Discover
│   ├── search        # Search
│   ├── plan          # Plan
│   ├── grocery       # Grocery
│   └── cook          # Cook
├── country/[id]      # Country Detail (push)
├── recipe/[id]       # Recipe Detail (push)
├── cook-mode/[id]    # Cook Mode (fullScreenModal)
├── profile           # Profile & Settings (modal)
└── bookmarks         # Bookmarks (push)
```

### 4.4 Data Layer

- `data/countries.ts` — 8 countries with `id`, `name`, `flag`, `region`, `heroImage`, `cuisineLabel`, `description`
- `data/recipes.ts` — 97 recipes with `id`, `countryId`, `title`, `image`, `category`, `prepTime`, `cookTime`, `servings`, `difficulty`, `ingredients[]`, `steps[]`, `culturalNote`
- Ingredient model: `{ name: string; amount: string; category: Category }` — amount is a **display string** (e.g., "400g", "2 tbsp, freshly cracked"), NOT a numeric value

---

## 5. Screen Feature Specs & Status

### 5.1 Discover (`/(tabs)/index`)

**Purpose:** Immersive entry point showcasing countries and trending recipes.

| Feature | Status |
|---------|--------|
| Hero carousel (5 countries, paginated FlatList) | IMPLEMENTED |
| Vertical pagination dots | IMPLEMENTED |
| "Explore [Country]" CTA → Country Detail | IMPLEMENTED |
| Tonight's Plan strip (first recipe) | IMPLEMENTED |
| Curated Regions grid (DestinationCard) | IMPLEMENTED |
| Trending Bites grid (RecipeCard) | IMPLEMENTED |
| HeaderBar (transparent mode) | IMPLEMENTED |

### 5.2 Search (`/(tabs)/search`)

**Purpose:** Find recipes by text query and mood filters.

| Feature | Status |
|---------|--------|
| Text search (title + ingredient name matching) | IMPLEMENTED |
| Mood filter chips (7 moods with filter logic) | IMPLEMENTED |
| Two-column recipe grid with images | IMPLEMENTED |
| "ADD +" action on cards | IMPLEMENTED (navigates to recipe detail) |
| Heart/bookmark button on cards | IMPLEMENTED (UI only — not wired to BookmarksContext) |
| HeaderBar (frosted glass) | IMPLEMENTED |

### 5.3 Plan (`/(tabs)/plan`)

**Purpose:** Weekly meal planner with daily/weekly views.

| Feature | Status |
|---------|--------|
| Weekly view with day selector strip | IMPLEMENTED |
| Daily view with meal time slots (Breakfast/Lunch/Dinner) | IMPLEMENTED |
| Week picker dropdown (This Week / Next Week / Past) | IMPLEMENTED (UI only — no data change) |
| Course slots (Appetizer, Dessert, Drink Pairings) | IMPLEMENTED (UI only — non-functional) |
| Multi-meal toggle | IMPLEMENTED (UI only) |
| Adding/removing recipes to days | NOT BUILT — data is hardcoded constants |
| Auto-generate itinerary from country | NOT BUILT |
| Recipe picker modal for empty slots | NOT BUILT |
| Persistent itinerary state | NOT BUILT |
| HeaderBar (frosted glass) | IMPLEMENTED |

### 5.4 Grocery (`/(tabs)/grocery`)

**Purpose:** Smart grocery list aggregated from active recipes.

| Feature | Status |
|---------|--------|
| Categorized ingredient list (6 categories) | IMPLEMENTED |
| Checkbox toggle per ingredient | IMPLEMENTED |
| Active recipe source carousel | IMPLEMENTED |
| Per-recipe servings adjuster (+/- buttons) | IMPLEMENTED (UI only — does not scale amounts) |
| Remove recipe from list | IMPLEMENTED |
| Ingredient deduplication by name | PARTIAL — deduplicates but does not sum amounts |
| Online/In-Store toggle | IMPLEMENTED |
| Retailer selector with zip code | IMPLEMENTED (UI only — no real integration) |
| Sticky bottom order bar | IMPLEMENTED (hardcoded $47.50 estimate) |
| Eco banner (CO₂ savings) | IMPLEMENTED |
| Tab badge for unchecked count | NOT BUILT — state is screen-local |
| HeaderBar (frosted glass) | IMPLEMENTED |

### 5.5 Cook (`/(tabs)/cook`)

**Purpose:** Cooking hub with reputation, technique library, and session resume.

| Feature | Status |
|---------|--------|
| Kitchen Reputation profile (level, XP, progress bar) | IMPLEMENTED (hardcoded values) |
| Active cook session card with "Resume Session" | IMPLEMENTED (hardcoded to `recipes[3]`) |
| Technique Library horizontal carousel | IMPLEMENTED |
| Upcoming Class card | IMPLEMENTED (static) |
| Pantry stocked percentage | IMPLEMENTED (hardcoded 73%) |
| Profile link (avatar → /profile) | IMPLEMENTED |
| HeaderBar (frosted glass) | IMPLEMENTED |

### 5.6 Country Detail (`/country/[id]`)

**Purpose:** Deep dive into a country's culinary heritage and recipes.

| Feature | Status |
|---------|--------|
| Hero image with country flag pill | IMPLEMENTED |
| Culinary Heritage description | IMPLEMENTED |
| Signature Recipes list (filtered by countryId) | IMPLEMENTED |
| Back button (GlassView) | IMPLEMENTED |
| "Add to Plan" action | NOT BUILT |

### 5.7 Recipe Detail (`/recipe/[id]`)

**Purpose:** Full recipe view with ingredients, steps, and cooking CTA.

| Feature | Status |
|---------|--------|
| Hero image with country flag | IMPLEMENTED |
| Stats row (prep, cook, difficulty, servings) | IMPLEMENTED |
| Servings adjuster (+/- buttons) | IMPLEMENTED (UI only — does not scale ingredient amounts) |
| Ingredients grouped by category | IMPLEMENTED |
| Step-by-step instructions with durations | IMPLEMENTED |
| Cultural Note section | IMPLEMENTED |
| Bookmark toggle (heart icon) | IMPLEMENTED (wired to BookmarksContext) |
| "Start Cooking" CTA → Cook Mode | IMPLEMENTED |
| "Add to Plan" action | NOT BUILT |
| "Add to Grocery" action | NOT BUILT |

### 5.8 Cook Mode (`/cook-mode/[id]`)

**Purpose:** Distraction-free step-by-step cooking with timers.

| Feature | Status |
|---------|--------|
| Full-screen dark UI | IMPLEMENTED |
| Step instruction display | IMPLEMENTED |
| Progress bar (step/total) | IMPLEMENTED |
| Countdown timer (per-step durations) | IMPLEMENTED |
| Timer play/pause/reset | IMPLEMENTED |
| Contextual ingredient pills (matched to current step) | IMPLEMENTED |
| Previous/Next step navigation | IMPLEMENTED |
| Haptic feedback (step changes, timer completion) | IMPLEMENTED |
| Keep-awake (screen stays on) | IMPLEMENTED |
| Servings scaler | NOT BUILT |
| Session persistence (resume after leaving) | NOT BUILT — state resets on unmount |

### 5.9 Profile (`/profile`)

**Purpose:** User preferences and app settings.

| Feature | Status |
|---------|--------|
| Dietary preferences | IMPLEMENTED |
| Cooking skill level | IMPLEMENTED |
| Theme picker (system/light/dark) | IMPLEMENTED (wired to ThemeContext) |
| Notification toggles | IMPLEMENTED (UI only) |
| General settings | IMPLEMENTED |

### 5.10 Bookmarks (`/bookmarks`)

**Purpose:** Saved/favorited recipes.

| Feature | Status |
|---------|--------|
| Bookmarked recipe list | IMPLEMENTED |
| Grouped by country | IMPLEMENTED |
| Tap to navigate to Recipe Detail | IMPLEMENTED |
| Remove bookmark | IMPLEMENTED |
| Persistence (AsyncStorage) | IMPLEMENTED |

---

## 6. Major Systems Inventory

### 6.1 ThemeContext — IMPLEMENTED

- **File:** `context/ThemeContext.tsx`
- **State:** `preference: 'system' | 'light' | 'dark'`, `isDark: boolean`
- **Persistence:** AsyncStorage (`@fork_compass_theme`)
- **Consumers:** `useThemePreference()` → `useThemeColors()` hook used by all screens
- **Status:** Fully functional. Theme picker in Profile wired correctly.

### 6.2 BookmarksContext — IMPLEMENTED

- **File:** `context/BookmarksContext.tsx`
- **State:** `bookmarkedIds: string[]`
- **Persistence:** AsyncStorage (`@fork_compass_bookmarks`)
- **Consumers:** `useBookmarks()` → Recipe Detail (heart toggle), Bookmarks screen, RecipeCard
- **Status:** Fully functional. Toggle, persistence, and count all work.
- **Note:** Search screen heart buttons are NOT wired to this context (UI-only).

### 6.3 AppContext / Global Session State — NOT BUILT

No shared context exists for:
- Active cook session (recipe, step, timer)
- Weekly itinerary / meal plan
- Grocery list state (active recipes, servings, checked items)

Each of these is either hardcoded or local to a single screen. Screens cannot communicate session state.

### 6.4 Meal Planning System — UI BUILT, LOGIC NOT WIRED

- Plan tab has full weekly/daily view UI with day selectors, meal time slots, course slots, and week picker
- All data comes from hardcoded constants (`PLANNED_DAYS`, `DAILY_MEALS`, `MOCK_DATES`)
- No state management, no persistence, no add/remove/edit actions
- No `PlanContext` exists

### 6.5 Grocery System — PARTIAL

- Grocery tab builds a deduplicated list from `activeRecipes` (hardcoded to `recipes.slice(0, 4)`)
- Checkboxes work (local `checkedIds` Set state)
- Per-recipe servings adjuster exists but `buildGroceryList()` ignores `servingSizes`
- Ingredient amounts are display strings — no parsing, no scaling, no numeric summation
- State is screen-local: no context, no persistence, no tab badge

### 6.6 Cook Session System — MOSTLY FUNCTIONAL, NO PERSISTENCE

- Cook Mode screen works end-to-end: step navigation, timers, haptics, keep-awake, contextual ingredients
- BUT: no session persistence — leaving the screen resets all state
- Cook tab "Resume Session" card is hardcoded to `recipes[3]`, not a real active session
- No CookingPill floating indicator
- No servings scaler in Cook Mode

### 6.7 Ingredient Amount Parsing — NOT BUILT

- All ingredient amounts are display strings (`"400g"`, `"2 tbsp, freshly cracked"`, `"1 large, diced"`)
- No parsing utility exists to extract numeric values and units
- Servings adjusters in Recipe Detail, Grocery, and Cook Mode are all cosmetic
- This is a foundational gap that blocks scaling, deduplication, and smart grocery totals

---

## 7. Component Library

| Component | File | Purpose |
|-----------|------|---------|
| GlassView | `components/GlassView.tsx` | Frosted glass container with specular top-edge highlight |
| HeaderBar | `components/HeaderBar.tsx` | Shared header: transparent (Discover) or frosted glass (others) |
| SectionHeader | `components/SectionHeader.tsx` | Section label + title + "View All" action link |
| RecipeCard | `components/RecipeCard.tsx` | Grid card: image, title, metadata, bookmark icon |
| DestinationCard | `components/DestinationCard.tsx` | Country card: image, flag, name |
| ErrorBoundary | `components/ErrorBoundary.tsx` | React error boundary wrapper |
| ErrorFallback | `components/ErrorFallback.tsx` | Fallback UI for caught errors |
| KeyboardAwareScrollViewCompat | `components/KeyboardAwareScrollViewCompat.tsx` | Cross-platform keyboard-aware scroll |

---

## 8. File Map

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx                    # Root layout: providers, error boundary
│   ├── +not-found.tsx                 # 404 screen
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator + floating pill bar
│   │   ├── index.tsx                  # Discover
│   │   ├── search.tsx                 # Search
│   │   ├── plan.tsx                   # Plan ⚠️ hardcoded data
│   │   ├── grocery.tsx                # Grocery ⚠️ scaling broken
│   │   └── cook.tsx                   # Cook
│   ├── country/[id].tsx               # Country Detail
│   ├── recipe/[id].tsx                # Recipe Detail ⚠️ scaling broken
│   ├── cook-mode/[id].tsx             # Cook Mode
│   ├── profile.tsx                    # Profile & Settings
│   └── bookmarks.tsx                  # Bookmarks
├── components/                        # Shared UI components
├── constants/                         # Design tokens (colors, typography, spacing, radius, shadows, glass)
├── context/
│   ├── ThemeContext.tsx                # Theme preference + AsyncStorage
│   └── BookmarksContext.tsx            # Bookmark state + AsyncStorage
├── data/
│   ├── countries.ts                   # 8 countries
│   └── recipes.ts                     # 97 recipes
├── hooks/
│   └── useThemeColors.ts              # Theme-aware color accessor
├── FLOW_MAP.md                        # Screen flow documentation
└── MASTER_BLUEPRINT.md                # This file
```

---

## 9. Systems Roadmap

### Priority 1: AppContext — Global State Foundation

**Goal:** Create the shared state layer that all other systems depend on.

**Scope:**
1. **`CookSessionContext`** — tracks active recipe ID, current step index, timer seconds, timer running state, servings override. Persisted to AsyncStorage so sessions survive app restarts.
2. **`PlanContext`** — tracks weekly itinerary as `Record<string, Record<string, string | null>>` (day → mealSlot → recipeId). Persisted to AsyncStorage.
3. **`GroceryContext`** — tracks active recipe IDs, servings overrides per recipe, checked item IDs. Derived grocery list computed via `useMemo`. Persisted to AsyncStorage.

All three contexts wrap the app in `_layout.tsx` alongside existing `ThemeProvider` and `BookmarksProvider`.

**Unblocks:** Everything in P2 and P3.

### Priority 2: Plan → Grocery → Cook Core Loop Wiring

**Goal:** Make the core user journey functional end-to-end.

**Scope:**

**Plan tab:**
- Replace hardcoded `PLANNED_DAYS` / `DAILY_MEALS` / `MOCK_DATES` with `PlanContext` state
- Tap empty meal slot → recipe picker modal (search/browse recipes, select one)
- "Add to Plan" action from Recipe Detail (pick day + meal slot)
- "Auto-Generate Week" from Country Detail (fill empty dinner slots with country's recipes)
- Swipe or long-press to remove a planned meal
- Course slots (appetizer, dessert, drink) become functional pickers

**Grocery tab:**
- `GroceryContext` provides active recipes and servings (instead of local `recipes.slice(0, 4)`)
- Plan tab's planned recipes automatically feed into grocery list
- Build ingredient amount parsing utility (`utils/ingredientParser.ts`) to extract `{ value, unit, qualifier }` from display strings
- `buildGroceryList()` uses parser to scale amounts by `(currentServings / baseServings)` and sum duplicates with compatible units
- Grocery tab badge on tab bar icon showing unchecked item count (read from `GroceryContext` in `_layout.tsx`)

**Cook session:**
- "Start Cooking" in Recipe Detail creates a session in `CookSessionContext`
- Cook Mode reads/writes session state (current step, timer)
- Leaving Cook Mode keeps session alive in context
- Cook tab "Resume Session" reads from `CookSessionContext` instead of `recipes[3]`
- Floating `CookingPill` component renders above tab bar when `activeSession != null`
- Recipe Detail servings adjuster actually scales ingredient amounts using parser

**Depends on:** P1

### Priority 3: Cook Mode Polish

**Goal:** Complete the cook mode experience with scaling and session persistence.

**Scope:**
- Servings scaler in Cook Mode top bar (reads from `CookSessionContext`, scales ingredient pill amounts)
- Session auto-save: on step change, persist current step + timer to AsyncStorage
- Session resume: on mount, restore from context (which loaded from AsyncStorage)
- "Finish Cooking" action at last step: clears session, increments XP (stored in future UserProgressContext or AsyncStorage)
- Timer completion notification (local notification or prominent visual alert)

**Depends on:** P1, P2

---

## 10. Design Rules Checklist

For every change, verify:

- [ ] No solid borders — glass specular highlight (top edge only)
- [ ] No pure `#000000` — use `colors.inverseSurface`
- [ ] Terracotta `#9A4100` for ALL interactive elements (both light AND dark)
- [ ] Noto Serif for headlines, Inter for body/labels
- [ ] 8pt spacing grid (`Spacing.*`)
- [ ] Floating pill tab bar with GlassView background
- [ ] HeaderBar component on all tab screens (transparent for Discover, frosted for others)
- [ ] `useThemeColors()` hook — never import color constants directly
- [ ] Dark mode renders correctly on every modified screen
- [ ] Tab icons use MaterialCommunityIcons (not Feather for tab bar)
- [ ] Scroll content has `paddingBottom: 120+` to clear tab bar
- [ ] Bookmark interactions use `useBookmarks()` from BookmarksContext
