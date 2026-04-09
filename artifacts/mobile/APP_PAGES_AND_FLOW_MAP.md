# Fork & Compass — Complete Page & Flow Map

> "Pick a country, cook a dinner, feel like you traveled."

---

## Table of Contents

1. [App Architecture Overview](#app-architecture-overview)
2. [Tab Pages (Main Navigation)](#tab-pages)
3. [Stack Screens (Detail & Flow Pages)](#stack-screens)
4. [Shared Components](#shared-components)
5. [Data Layer](#data-layer)
6. [Utilities](#utilities)
7. [Hooks](#hooks)
8. [Constants & Design System](#constants--design-system)
9. [Context Providers](#context-providers)
10. [Complete Navigation Flow Map](#complete-navigation-flow-map)

---

## App Architecture Overview

- **Framework:** Expo SDK 54, expo-router ~6.0.17
- **Navigation:** File-based routing via expo-router (Tab + Stack)
- **State:** React Context (AppContext, BookmarksContext, ThemeContext)
- **Styling:** StyleSheet + design tokens (8pt grid, Liquid Glass)
- **Fonts:** Noto Serif (headlines), Inter (body/labels)
- **Colors:** Terracotta #9A4100 (primary), Cream #FEF9F3 (surface)
- **Data:** All local mock data — 97 recipes across 8 countries

### Root Layout

| File | Purpose |
|------|---------|
| `app/_layout.tsx` | Top-level provider wrapper. Initializes fonts (Inter, Noto Serif), QueryClient, wraps app in `GestureHandlerRootView`, `ThemeProvider`, `AppProvider`, `BookmarksProvider`, `KeyboardProvider`. Routes to `/onboarding` on first launch, otherwise `/(tabs)`. |

---

## Tab Pages

The bottom tab bar is a custom floating pill with Liquid Glass styling, defined in `app/(tabs)/_layout.tsx`.

### 1. Explore (Home)

| Property | Value |
|----------|-------|
| **File** | `app/(tabs)/index.tsx` |
| **Tab Label** | Explore |
| **Icon** | `compass-outline` / `compass` (MCI) |
| **Purpose** | Main dashboard — featured recipes, country destination cards, recent activity |

**Key Features:**
- Hero section with featured recipe of the day
- Country destination carousel (8 countries)
- "Cook Now" quick-launch button
- Animated heart bookmark interactions
- Profile access via HeaderBar

**Navigates To:**
- `/recipe/[id]` — tap any recipe card
- `/country/[id]` — tap a destination card
- `/profile` — tap profile icon in header
- `/cook-mode/[id]` — tap "Cook Now" on featured recipe

---

### 2. Plan

| Property | Value |
|----------|-------|
| **File** | `app/(tabs)/plan.tsx` |
| **Tab Label** | Plan |
| **Icon** | `calendar-blank-outline` / `calendar-blank` (MCI) |
| **Purpose** | Weekly meal planner — schedule recipes across 7-day weeks |

**Key Features:**
- Week selector pills: This Week / Next Week / Past Weeks
- **Current/Next week:** Glass day cards with 16:8 recipe images, LinearGradient overlay, swap/close overlay buttons, empty day `+` button, "add course" pills for appetizer/main/dessert
- **Past weeks:** Compact cards with adaptive image grid (1/2/3-col based on meal count), glass time pill
- Past day visual distinction (faded opacity + warm desaturation overlay)
- Auto-scroll to today's card
- Recipe picker bottom sheet for adding meals
- Day view with detailed course breakdown
- Auto-generate FAB to fill empty days
- Undo support for removals

**Navigates To:**
- `/recipe/[id]` — tap a recipe in the plan
- `/dinner-setup` — tap "Plan Dinner" for a date

---

### 3. Cook

| Property | Value |
|----------|-------|
| **File** | `app/(tabs)/cook.tsx` |
| **Tab Label** | Cook |
| **Icon** | `pot-steam-outline` / `pot-steam` (MCI) |
| **Purpose** | Kitchen Command Center — manage today's cooking session |

**Key Features:**
- Today's meal overview with pre-cooking checklist
- Technique cards with difficulty badges
- Active cooking session management (start/resume)
- Saved recipes quick access
- Dinner party planning shortcut

**Navigates To:**
- `/cook-mode/[id]` — tap "Start Cooking" or "Resume"
- `/technique/[id]` — tap a technique card
- `/bookmarks` — tap "Saved Recipes"
- `/dinner-setup` — tap "Plan Dinner"
- `/(tabs)/plan` — tap "Go to Plan" when nothing is scheduled

---

### 4. Grocery

| Property | Value |
|----------|-------|
| **File** | `app/(tabs)/grocery.tsx` |
| **Tab Label** | Grocery |
| **Icon** | `cart-outline` / `cart` (MCI) |
| **Purpose** | Shopping list management with ingredient scaling and categories |

**Key Features:**
- Auto-generated grocery list from planned meals
- Category grouping (Produce, Protein, Dairy, Pantry, etc.)
- Swipe-to-delete items
- Checkbox completion tracking
- Ingredient amount scaling (serves adjustment)
- Empty state with "Explore Recipes" CTA

**Navigates To:**
- `/recipe/[id]` — tap a recipe associated with ingredients
- `/(tabs)` — tap "Explore Recipes" when list is empty

---

### 5. Search

| Property | Value |
|----------|-------|
| **File** | `app/(tabs)/search.tsx` |
| **Tab Label** | Search |
| **Icon** | `magnify` (MCI) |
| **Purpose** | Recipe and country discovery with filters |

**Key Features:**
- Live text search across recipes and countries
- Allergen/dietary preference filters
- Recipe result cards with cuisine tags
- Country destination cards in results

**Navigates To:**
- `/recipe/[id]` — tap a recipe from search results

---

## Stack Screens

### 6. Recipe Detail

| Property | Value |
|----------|-------|
| **File** | `app/recipe/[id].tsx` |
| **Route** | `/recipe/[id]` |
| **Purpose** | Full recipe view — ingredients, steps, nutrition, cultural notes |

**Key Features:**
- Hero image with parallax effect
- Ingredient list with substitution suggestions
- Step-by-step instructions (beginner/chef skill levels)
- Dietary conflict warnings
- Culinary verb highlighting in instructions
- Bookmark (animated heart) toggle
- "Add to Plan" bottom sheet
- Nutrition breakdown panel
- Serving size adjuster

**Navigates To:**
- `/cook-mode/[id]` — tap "Start Cooking"
- Back — header back button

---

### 7. Country Detail

| Property | Value |
|----------|-------|
| **File** | `app/country/[id].tsx` |
| **Route** | `/country/[id]` |
| **Purpose** | Culinary profile for a specific country |

**Key Features:**
- Country hero with flag and tagline
- Regional map with sub-region highlights
- Recipes grouped by region
- Cultural context and culinary traditions
- Animated list items

**Navigates To:**
- `/recipe/[id]` — tap a recipe from that region
- Back — header back button

---

### 8. Profile & Settings

| Property | Value |
|----------|-------|
| **File** | `app/profile.tsx` |
| **Route** | `/profile` |
| **Purpose** | User preferences, dietary restrictions, theme, account |

**Key Features:**
- Dietary restriction toggles
- Theme switcher (Light / Dark / System)
- Unit preference (Metric / Imperial)
- Skill level selector
- Household size setting
- Data management (clear plan, reset app)

**Navigates To:**
- Back — header back button

---

### 9. Technique Detail

| Property | Value |
|----------|-------|
| **File** | `app/technique/[id].tsx` |
| **Route** | `/technique/[id]` |
| **Purpose** | In-depth culinary technique instruction |

**Key Features:**
- Technique overview with difficulty badge
- Step-by-step tutorial
- Duration and category info
- Linked recipes that use this technique

**Navigates To:**
- `/recipe/[id]` — tap a linked recipe
- Back — header back button

---

### 10. Dinner Party Setup

| Property | Value |
|----------|-------|
| **File** | `app/dinner-setup.tsx` |
| **Route** | `/dinner-setup` |
| **Purpose** | Organize a dinner party — guests, dietary requirements, courses |

**Key Features:**
- Guest list management with names and dietary flags
- Dietary conflict detection across the menu
- Course overview (appetizer, main, dessert)
- Share/invite functionality
- "Let's Cook" launch button

**Navigates To:**
- `/cooking-schedule` — tap "Let's Cook" or "Send Invites"
- `/(tabs)/plan` — tap "Add" for a missing course
- Back — header back button

---

### 11. Cooking Schedule (Timeline)

| Property | Value |
|----------|-------|
| **File** | `app/cooking-schedule.tsx` |
| **Route** | `/cooking-schedule` |
| **Purpose** | Visual cooking timeline — backward-scheduled task flow |

**Key Features:**
- Timeline visualization with active/passive/transition segments
- Event cards with duration and task type
- Coordinated multi-dish scheduling
- Start time calculation based on dinner target time

**Navigates To:**
- `/cook-mode/[id]` — start the coordinated cook
- Back — header back button

---

### 12. Cook Mode (Active Cooking)

| Property | Value |
|----------|-------|
| **File** | `app/cook-mode/[id].tsx` |
| **Route** | `/cook-mode/[id]` |
| **Purpose** | Hands-free kitchen mode — step-by-step guidance with timers |

**Key Features:**
- Screen keep-awake enabled
- Large, readable step instructions
- Built-in timers with haptic feedback
- Culinary verb highlighting
- Step progress indicator
- Beginner tips toggle
- Completion triggers celebration screen

**Navigates To:**
- `/dinner-complete` — completing all steps (router.replace)
- Back — header back button

---

### 13. Dinner Complete (Celebration)

| Property | Value |
|----------|-------|
| **File** | `app/dinner-complete.tsx` |
| **Route** | `/dinner-complete` |
| **Purpose** | Post-meal celebration screen |

**Key Features:**
- Animated celebration effects
- Guest initials display (if dinner party)
- Meal summary data
- Glass card styling

**Navigates To:**
- `/(tabs)/cook` — tap "Done" (router.replace)

---

### 14. Bookmarks (Saved Recipes)

| Property | Value |
|----------|-------|
| **File** | `app/bookmarks.tsx` |
| **Route** | `/bookmarks` |
| **Purpose** | Collection of saved/favorited recipes |

**Key Features:**
- Sort options: date added, cuisine, difficulty
- Animated list items
- Bookmark toggle (animated heart)
- Empty state messaging

**Navigates To:**
- `/recipe/[id]` — tap a saved recipe
- Back — header back button

---

### 15. Onboarding

| Property | Value |
|----------|-------|
| **File** | `app/onboarding.tsx` |
| **Route** | `/onboarding` |
| **Purpose** | First-launch setup — dietary preferences and skill level |

**Key Features:**
- Multi-step welcome flow
- Dietary preference selection (Vegetarian, Vegan, Gluten-Free, etc.)
- Skill level picker
- Haptic feedback on selections
- Keyboard-aware layout

**Navigates To:**
- `/(tabs)` — completion (router.replace)

---

### 16. Not Found

| Property | Value |
|----------|-------|
| **File** | `app/+not-found.tsx` |
| **Route** | Catch-all |
| **Purpose** | 404 fallback screen |

**Navigates To:**
- `/(tabs)/index` — "Go to home screen" link

---

## Shared Components

| File | Component | Purpose |
|------|-----------|---------|
| `components/GlassView.tsx` | `GlassView` | Liquid Glass container with blur, specular top edge, and configurable intensity |
| `components/HeaderBar.tsx` | `HeaderBar` | Universal top bar with profile icon, back button, title |
| `components/RecipeCard.tsx` | `RecipeCard` | Reusable recipe preview card with image, title, time, difficulty |
| `components/RecipePickerSheet.tsx` | `RecipePickerSheet` | Bottom sheet for selecting recipes to add to the plan |
| `components/AddToPlanSheet.tsx` | `AddToPlanSheet` | Bottom sheet for choosing date/course when adding from recipe detail |
| `components/DestinationCard.tsx` | `DestinationCard` | Country card with flag, name, recipe count |
| `components/AnimatedHeart.tsx` | `AnimatedHeart` | Bookmark toggle with scale/color animation |
| `components/AnimatedListItem.tsx` | `AnimatedListItem` | Fade-in + slide-up list item wrapper |
| `components/Checkbox.tsx` | `Checkbox` | Terracotta-themed checkbox |
| `components/PressableScale.tsx` | `PressableScale` | Press-to-shrink touchable wrapper |
| `components/CookingPill.tsx` | `CookingPill` | Floating pill showing active cooking session |
| `components/SmartCookBar.tsx` | `SmartCookBar` | Contextual cooking status bar (currently unused on Plan) |
| `components/SectionHeader.tsx` | `SectionHeader` | Consistent section title with optional action button |
| `components/SkeletonBox.tsx` | `SkeletonBox` | Loading placeholder with shimmer animation |
| `components/DismissButton.tsx` | `DismissButton` | Standard close/dismiss button |
| `components/ErrorBoundary.tsx` | `ErrorBoundary` | React error boundary wrapper |
| `components/ErrorFallback.tsx` | `ErrorFallback` | Friendly error display with retry action |
| `components/KeyboardAwareScrollViewCompat.tsx` | `KeyboardAwareScrollViewCompat` | Cross-platform keyboard-avoiding scroll |

---

## Data Layer

| File | Purpose |
|------|---------|
| `data/recipes.ts` | 97 recipes across 8 countries — full recipe objects with ingredients, steps, times, cultural notes |
| `data/countries.ts` | 8 countries (Italy, France, Japan, Mexico, Thailand, Morocco, India, Spain) with flags, taglines, regions |
| `data/techniques.ts` | Cooking techniques with difficulty levels, durations, instructional steps |
| `data/nutrition.ts` | Nutritional info (calories, protein, carbs, fat) with serving-based scaling |
| `data/substitutions.ts` | Ingredient-to-substitute mappings (e.g., butter → coconut oil) |
| `data/maps.ts` | Derived data: `RECIPE_REGION_MAP`, `FEATURED_RECIPES` per country |
| `data/helpers.ts` | Image URL resolution, recipe lookups, time parsing, unit conversion (Metric/Imperial) |
| `data/index.ts` | Barrel export for all data modules |

---

## Utilities

| File | Purpose |
|------|---------|
| `utils/timelineEngine.ts` | Backward-scheduling engine for cook mode — builds coordinated multi-dish timeline |
| `utils/cookReadiness.ts` | State machine calculating cook readiness (groceries needed, time to start, running late) |
| `utils/groceryScaling.ts` | Parses and scales ingredient amounts (e.g., "1/2 tsp" × 2 = "1 tsp") |
| `utils/allergens.ts` | Detects allergens in recipes from ingredient keywords, maps to dietary flags |
| `utils/dates.ts` | Local-timezone date helpers for meal planning (today, addDays, getMonday, etc.) |
| `utils/textFormatting.ts` | Highlights culinary verbs (sear, dice, fold) in instruction text |
| `utils/storage.ts` | AsyncStorage wrapper for persistent data (bookmarks, settings, onboarding state) |

---

## Hooks

| File | Hook | Purpose |
|------|------|---------|
| `hooks/useRecipeData.ts` | `useRecipeData` | Primary data hook — country/recipe access, search, region filtering |
| `hooks/useThemeColors.ts` | `useThemeColors` | Returns current theme palette, spacing, radius, glass, shadows |

---

## Constants & Design System

| File | Purpose |
|------|---------|
| `constants/colors.ts` | Full Light/Dark palettes — primary (#9A4100), surface (#FEF9F3), semantic category colors |
| `constants/typography.ts` | Font styles — Noto Serif (headlines), Inter (body/labels), size hierarchy |
| `constants/spacing.ts` | 8pt grid spacing tokens (xs=4, sm=8, md=12, lg=16, xl=20, xxl=24, page=20) |
| `constants/radius.ts` | Border radius tokens (sm=8, md=12, lg=16, xl=20, xxl=28, full=9999) |
| `constants/shadows.ts` | Elevation shadow definitions |
| `constants/motion.ts` | Animation configs — spring presets, durations, easing curves |
| `constants/glass.ts` | GlassView config — blur intensities, highlight opacity |
| `constants/icons.ts` | Standard icon sizes (16/20/24/28/40), overlay button styles |

---

## Context Providers

| File | Context | Purpose |
|------|---------|---------|
| `context/AppContext.tsx` | `AppProvider` / `useApp` | Core app state — itinerary, grocery items, dinner party, user preferences, undo support |
| `context/BookmarksContext.tsx` | `BookmarksProvider` / `useBookmarks` | Saved recipe management with AsyncStorage persistence |
| `context/ThemeContext.tsx` | `ThemeProvider` / `useThemePreference` | Light/Dark/System theme preference with persistence |

---

## Complete Navigation Flow Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIRST LAUNCH                             │
│                     app/_layout.tsx                              │
│                           │                                     │
│              ┌────────────┴────────────┐                        │
│              ▼                         ▼                        │
│        /onboarding              /(tabs) [Home]                  │
│     (first time only)        (returning users)                  │
│              │                                                  │
│              └──── router.replace ────►┘                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      TAB BAR (5 tabs)                           │
│                   app/(tabs)/_layout.tsx                         │
│                                                                 │
│   ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│   │ Explore  │   Plan   │   Cook   │ Grocery  │  Search  │      │
│   │  index   │  plan    │   cook   │ grocery  │  search  │      │
│   └────┬─────┴────┬─────┴────┬─────┴────┬─────┴────┬─────┘      │
│        │          │          │          │          │              │
└────────┼──────────┼──────────┼──────────┼──────────┼─────────────┘
         │          │          │          │          │
         ▼          ▼          ▼          ▼          ▼

┌─────────────────────────────────────────────────────────────────┐
│                    EXPLORE (Home Tab)                            │
│                                                                 │
│  ┌─ Profile Icon ──────────────────► /profile                   │
│  ├─ Recipe Card ───────────────────► /recipe/[id]               │
│  ├─ Destination Card ──────────────► /country/[id]              │
│  └─ "Cook Now" ────────────────────► /cook-mode/[id]            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      PLAN (Plan Tab)                            │
│                                                                 │
│  ┌─ Recipe in Plan ────────────────► /recipe/[id]               │
│  └─ "Plan Dinner" ─────────────────► /dinner-setup              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      COOK (Cook Tab)                            │
│                                                                 │
│  ┌─ "Start/Resume Cooking" ────────► /cook-mode/[id]            │
│  ├─ Technique Card ────────────────► /technique/[id]            │
│  ├─ "Saved Recipes" ──────────────► /bookmarks                  │
│  ├─ "Plan Dinner" ─────────────────► /dinner-setup              │
│  └─ "Go to Plan" ─────────────────► /(tabs)/plan                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    GROCERY (Grocery Tab)                         │
│                                                                 │
│  ┌─ Recipe Link ───────────────────► /recipe/[id]               │
│  └─ "Explore Recipes" (empty) ─────► /(tabs)                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SEARCH (Search Tab)                           │
│                                                                 │
│  └─ Search Result ─────────────────► /recipe/[id]               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DETAIL / FLOW SCREENS                         │
│                                                                 │
│  /recipe/[id]                                                   │
│  ├─ "Start Cooking" ──────────────► /cook-mode/[id]             │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /country/[id]                                                  │
│  ├─ Recipe Card ──────────────────► /recipe/[id]                │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /technique/[id]                                                │
│  ├─ Linked Recipe ────────────────► /recipe/[id]                │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /bookmarks                                                     │
│  ├─ Saved Recipe ─────────────────► /recipe/[id]                │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /profile                                                       │
│  └─ Back ─────────────────────────► (previous screen)           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DINNER PARTY FLOW                              │
│                                                                 │
│  /dinner-setup                                                  │
│  ├─ "Let's Cook" / "Send Invites" ► /cooking-schedule           │
│  ├─ "Add Course" ─────────────────► /(tabs)/plan                │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /cooking-schedule                                              │
│  ├─ "Start Cooking" ──────────────► /cook-mode/[id]             │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /cook-mode/[id]                                                │
│  ├─ Complete All Steps ───────────► /dinner-complete (replace)   │
│  └─ Back ─────────────────────────► (previous screen)           │
│                                                                 │
│  /dinner-complete                                               │
│  └─ "Done" ───────────────────────► /(tabs)/cook (replace)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Tree Summary

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx                 # Root layout + providers
│   ├── +not-found.tsx              # 404 screen
│   ├── onboarding.tsx              # First-launch setup
│   ├── profile.tsx                 # Settings & preferences
│   ├── bookmarks.tsx               # Saved recipes
│   ├── dinner-setup.tsx            # Dinner party planning
│   ├── cooking-schedule.tsx        # Cooking timeline
│   ├── dinner-complete.tsx         # Post-meal celebration
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tab bar (floating glass pill)
│   │   ├── index.tsx               # Explore (Home)
│   │   ├── plan.tsx                # Weekly meal planner
│   │   ├── cook.tsx                # Kitchen command center
│   │   ├── grocery.tsx             # Shopping list
│   │   └── search.tsx              # Recipe/country search
│   ├── recipe/
│   │   └── [id].tsx                # Recipe detail
│   ├── country/
│   │   └── [id].tsx                # Country culinary profile
│   ├── technique/
│   │   └── [id].tsx                # Technique tutorial
│   └── cook-mode/
│       └── [id].tsx                # Active cooking mode
├── components/                     # 18 shared UI components
├── context/                        # 3 context providers
├── constants/                      # 8 design system token files
├── data/                           # 8 data/helper files (97 recipes, 8 countries)
├── hooks/                          # 2 custom hooks
└── utils/                          # 7 utility modules
```

---

*Total pages: 16 (5 tabs + 11 stack screens)*
*Total components: 18 shared*
*Total data files: 8*
*Total utilities: 7*
*Total constants: 8*
