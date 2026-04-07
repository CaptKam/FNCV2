# Fork & Compass — Complete App Flow Map

> **"Pick a country, cook a dinner, feel like you traveled."**

---

## Table of Contents

1. [App Architecture Overview](#1-app-architecture-overview)
2. [Screen Inventory](#2-screen-inventory)
3. [Navigation Map](#3-navigation-map)
4. [Detailed Screen Flows](#4-detailed-screen-flows)
5. [Data Architecture](#5-data-architecture)
6. [State Management](#6-state-management)
7. [Component Dependency Map](#7-component-dependency-map)
8. [User Journey Flows](#8-user-journey-flows)

---

## 1. App Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Root Stack Navigator                     │
│                       (app/_layout.tsx)                        │
│                                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │              Providers (wrapping all screens)        │    │
│   │  QueryClientProvider → ThemeProvider → BookmarkProvider   │
│   │          → SafeAreaProvider → ErrorBoundary          │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
│   ┌──────────────────────┐   ┌────────────────────────────┐  │
│   │   Tab Navigator      │   │   Stack / Modal Screens     │  │
│   │  (tabs)/_layout.tsx  │   │                             │  │
│   │                      │   │  • profile      (modal)     │  │
│   │  ┌────────────────┐  │   │  • bookmarks    (stack)     │  │
│   │  │ Discover  (/)  │  │   │  • country/[id] (stack)     │  │
│   │  │ Search (/search│  │   │  • recipe/[id]  (stack)     │  │
│   │  │ Plan   (/plan) │  │   │  • cook-mode/[id] (modal)  │  │
│   │  │ Grocery(/groc.)│  │   │                             │  │
│   │  │ Cook   (/cook) │  │   └────────────────────────────┘  │
│   │  └────────────────┘  │                                    │
│   └──────────────────────┘                                    │
└──────────────────────────────────────────────────────────────┘
```

**Tech Stack:** Expo SDK 54, expo-router (file-based routing), React Native, TypeScript

---

## 2. Screen Inventory

### Tab Screens (Persistent Bottom Navigation)

| Tab | Route | File | Icon | Description |
|-----|-------|------|------|-------------|
| Discover | `/` | `(tabs)/index.tsx` | `compass-outline` | Hero carousel, curated regions, trending recipes, tonight's plan |
| Search | `/search` | `(tabs)/search.tsx` | `magnify` | Text search + mood-based filtering, recipe grid |
| Plan | `/plan` | `(tabs)/plan.tsx` | `calendar-month-outline` | Weekly/daily meal planner with timeline |
| Grocery | `/grocery` | `(tabs)/grocery.tsx` | `cart-outline` | Aggregated shopping list from planned recipes |
| Cook | `/cook` | `(tabs)/cook.tsx` | `chef-hat` | Kitchen reputation, active sessions, technique library |

### Detail / Modal Screens

| Screen | Route | File | Presentation | Description |
|--------|-------|------|--------------|-------------|
| Profile & Settings | `/profile` | `profile.tsx` | Modal | User stats, dietary prefs, appearance, cooking settings, notifications |
| Bookmarks | `/bookmarks` | `bookmarks.tsx` | Stack | Saved recipes grouped by country |
| Country Detail | `/country/[id]` | `country/[id].tsx` | Stack | Country hero, cultural description, signature recipes |
| Recipe Detail | `/recipe/[id]` | `recipe/[id].tsx` | Stack | Full recipe with adjustable servings, ingredients, steps, cultural note |
| Cook Mode | `/cook-mode/[id]` | `cook-mode/[id].tsx` | Full-Screen Modal | Step-by-step guided cooking with timers and haptics |

---

## 3. Navigation Map

```
                            ┌─────────────────────┐
                            │    HeaderBar         │
                            │  (all tab screens)   │
                            │                      │
                    ┌───────┤  [avatar] → /profile │
                    │       │  [bookmark]→/bookmarks│
                    │       └─────────────────────┘
                    │
    ┌───────────────┼───────────────────────────────────────┐
    │               │           TAB BAR                      │
    │   ┌───────┐ ┌─┴─────┐ ┌──────┐ ┌────────┐ ┌──────┐  │
    │   │Discover│ │Search │ │ Plan │ │Grocery │ │ Cook │  │
    │   └───┬───┘ └───┬───┘ └──┬───┘ └───┬────┘ └──┬───┘  │
    │       │         │        │         │         │       │
    └───────┼─────────┼────────┼─────────┼─────────┼───────┘
            │         │        │         │         │
            ▼         │        │         │         ▼
    ┌──────────────┐  │        │         │  ┌─────────────┐
    │ /country/[id]│  │        │         │  │/cook-mode/[id]│
    │              │  │        │         │  │ (resume)     │
    └──────┬───────┘  │        │         │  └──────────────┘
           │          │        │         │         ▲
           ▼          ▼        ▼         │         │
    ┌──────────────────────────────────┐ │         │
    │         /recipe/[id]             │ │         │
    │  (accessible from ALL screens)   ├─┘         │
    │                                  │           │
    │  [Start Cooking] ───────────────►┼───────────┘
    └──────────────────────────────────┘
```

### Navigation Entry Points Summary

| Destination | Can Be Reached From |
|---|---|
| `/profile` | HeaderBar avatar (all tabs), Cook tab avatar |
| `/bookmarks` | HeaderBar bookmark icon (all tabs) |
| `/country/[id]` | Discover hero carousel, Discover destination cards |
| `/recipe/[id]` | Discover trending cards, Discover tonight's plan, Country detail signature recipes, Search results, Plan screen meal cards, Grocery recipe source links, Bookmarks saved recipes |
| `/cook-mode/[id]` | Recipe detail "Start Cooking" CTA, Cook tab "Resume Session" |
| `/grocery` | Plan screen grocery banner "Review" link |
| `/search` | Plan screen empty day slots "Browse Recipes" |

---

## 4. Detailed Screen Flows

### 4.1 Discover Screen (`/`)

```
┌─────────────────────────────────────────────┐
│  HeaderBar (transparent over hero)          │
│  [Profile Avatar]  Fork & Compass  [Bookmark]│
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ HERO CAROUSEL (5 featured countries) ─┐ │
│  │  ← Swipe horizontally →                │ │
│  │                                         │ │
│  │  🇮🇹 Southern Europe                    │ │
│  │  Italy                                  │ │
│  │  [Explore Italy →] ──→ /country/italy   │ │
│  │                                         │ │
│  │  ○ ● ○ ○ ○  (page indicators)          │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ TONIGHT'S PLAN ───────────────────────┐ │
│  │  🍝 Cacio e Pepe                       │ │
│  │  [Cook Tonight] ───→ /recipe/it-1      │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  CURATED REGIONS          [View All]        │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Italy  │ │ France │ │ Japan  │ → scroll │
│  │tap→    │ │tap→    │ │tap→    │          │
│  │country/│ │country/│ │country/│          │
│  └────────┘ └────────┘ └────────┘          │
│                                             │
│  TRENDING BITES           [View All]        │
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │Recipe  │ │Recipe  │ │Recipe  │ → scroll │
│  │Card    │ │Card    │ │Card    │          │
│  │[♡]     │ │[♡]     │ │[♡]     │          │
│  │tap→    │ │tap→    │ │tap→    │          │
│  │recipe/ │ │recipe/ │ │recipe/ │          │
│  └────────┘ └────────┘ └────────┘          │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Hero carousel: Horizontal swipe between 5 featured countries
- "Explore [Country]" button: Navigates to `/country/[id]`
- Tonight's Plan card: Navigates to `/recipe/[id]`
- Destination cards: Tap navigates to `/country/[id]`
- Recipe cards: Tap navigates to `/recipe/[id]`, heart icon toggles bookmark
- HeaderBar avatar: Navigates to `/profile`
- HeaderBar bookmark: Navigates to `/bookmarks`

---

### 4.2 Search Screen (`/search`)

```
┌─────────────────────────────────────────────┐
│  HeaderBar (frosted glass)                  │
├─────────────────────────────────────────────┤
│                                             │
│  Search                (display title)      │
│                                             │
│  ┌─────────────────────────────────────────┐│
│  │ 🔍 Ingredients, dishes, or moods...     ││
│  └─────────────────────────────────────────┘│
│                                             │
│  ┌─ MOOD CHIPS (horizontal scroll) ──────┐  │
│  │ [All Moods] [Quick & Easy]            │  │
│  │ [Comfort Food] [Date Night]           │  │
│  │ [Adventurous] [Healthy] [Sweet]       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐                 │
│  │ Recipe   │  │ Recipe   │                 │
│  │ Image    │  │ Image    │                 │
│  │          │  │          │                 │
│  │ [♡]      │  │ [♡]      │                 │
│  │ Title    │  │ Title    │                 │
│  │ DIFF·TIME│  │ DIFF·TIME│                 │
│  │ ADD +    │  │ ADD +    │                 │
│  └──────────┘  └──────────┘                 │
│  ┌──────────┐  ┌──────────┐                 │
│  │  ...     │  │  ...     │  (2-column grid)│
│  └──────────┘  └──────────┘                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Search input: Real-time text filtering across recipe titles, ingredients, and country names
- Mood chips: Single-select filter (All Moods resets). Filters recipes by category/mood tags
- Recipe cards: Tap navigates to `/recipe/[id]`
- Heart icon: Toggles bookmark (via BookmarksContext)
- "ADD +" link: Terracotta-colored action link

**Filtering Logic:**
1. Text query filters by recipe title, ingredient names, and country name (case-insensitive)
2. Mood filter narrows results by category keywords
3. Both filters combine (AND logic)

---

### 4.3 Plan Screen (`/plan`)

```
┌─────────────────────────────────────────────┐
│  HeaderBar (frosted glass)                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ WEEK SELECTOR PILL (glass) ───────────┐ │
│  │  ◄   CURRENT PLANNING                  │ │
│  │      This Week ▾  (dropdown trigger)  ► │ │
│  └─────────────────────────────────────────┘ │
│  Options: This Week │ Next Week │ Past       │
│                                             │
│  ┌─ GROCERY BANNER ───────────────────────┐ │
│  │ 🧺 Grocery List Update                 │ │
│  │   14 items missing for your planned     │ │
│  │   meals                    [REVIEW] ─→ /grocery │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ── WEEKLY VIEW (default) ──────────────── │
│                                             │
│  ● Monday, Oct 12                           │
│  ┌─────────────────────────────────────────┐ │
│  │  🖼️ Recipe Image         [DINNER]      │ │
│  │  Cacio e Pepe                           │ │
│  │  ⏱ 25m                                 │ │
│  │  tap → /recipe/it-1                     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ○ Tuesday, Oct 13                          │
│  ┌─────────────────────────────────────────┐ │
│  │  ▶ Ready to Cook        MONDAY'S PREP  │ │
│  │  tap → /cook-mode/[id]                  │ │
│  └─────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐   │
│  │  ✕ No meals planned yet              │   │
│  │       ╳                              │   │
│  │  [Browse Recipes] ─→ /search          │   │
│  └───────────────────────────────────────┘   │
│                                             │
│  ── DAILY VIEW (toggle) ────────────────── │
│  ┌─ DAY SELECTOR ─────────────────────────┐ │
│  │  M  T  W  T  F  S  S                   │ │
│  │  ●                    (selected dot)    │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ MEAL TIMELINE ────────────────────────┐ │
│  │  8:00 AM  │ Breakfast                  │ │
│  │  12:30 PM │ Lunch                      │ │
│  │  7:00 PM  │ Dinner  → recipe card      │ │
│  ├─────────────────────────────────────────┤ │
│  │  COURSE SLOTS                          │ │
│  │  [+ Add Appetizer...]                  │ │
│  │  [+ Sweet finish...]                   │ │
│  │  [+ Pair with a drink...]              │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Week selector pill: Chevrons cycle weeks, center text opens dropdown (This Week / Next Week / Past)
- Grocery banner "REVIEW": Navigates to `/grocery`
- Planned meal cards: Tap navigates to `/recipe/[id]`
- "Ready to Cook" button: Navigates to `/cook-mode/[id]`
- "Browse Recipes" (empty slots): Navigates to `/search`
- Day selector (daily view): Tap day letter to switch selected day
- Course slot placeholders: Tap to add Appetizer / Dessert / Drink Pairings

**View Toggle:**
- Weekly view: Shows all 7 days with timeline dots (filled = has meals, empty = no meals)
- Daily view: Shows detailed timeline for single day with meal slots and course expansion

---

### 4.4 Grocery Screen (`/grocery`)

```
┌─────────────────────────────────────────────┐
│  HeaderBar (frosted glass)                  │
├─────────────────────────────────────────────┤
│                                             │
│           WEEKLY PROVISIONS                 │
│           My Groceries                      │
│        4 Recipes  •  29 Items               │
│                                             │
│  ┌──────────────────┬──────────────────────┐ │
│  │  ██ Online ██    │     🏪 In-Store      │ │
│  └──────────────────┴──────────────────────┘ │
│                                             │
│  Active Recipe Sources                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ → scroll │
│  │ 🖼️     │ │ 🖼️     │ │ 🖼️     │          │
│  │ [-4 +] │ │ [-4 +] │ │ [-8 +] │ (serving)│
│  │ [✕]    │ │ [✕]    │ │ [✕]    │ (remove) │
│  │ Title  │ │ Title  │ │ Title  │          │
│  │ 4 ingr.│ │10 ingr.│ │ 7 ingr.│          │
│  │ViewRecipe→/recipe/│ │ViewRecipe          │
│  └────────┘ └────────┘ └────────┘          │
│                                             │
│  🌱 Shopping locally saves ~2.4 lbs CO₂    │
│                                             │
│  ── Select Retailer ──────────────────────  │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │Walmart│ │Amazon│ │Insta-│ │Target│      │
│  │  🏬  │ │Fresh │ │cart  │ │  🎯  │      │
│  │      │ │  📦  │ │  🥕  │ │      │      │
│  └──────┘ └──────┘ └──────┘ └──────┘      │
│                                             │
│  ── CATEGORIZED INGREDIENT LIST ──────────  │
│                                             │
│  🥬 PRODUCE                                │
│  ┌─────────────────────────────────────────┐ │
│  │ [○] 🟢 Fresh basil       2 bunches     │ │
│  │ [○] 🟢 Roma tomatoes     8 pieces      │ │
│  │ [●] 🟢 Garlic            6 cloves      │ │ ← checked
│  └─────────────────────────────────────────┘ │
│                                             │
│  🥩 PROTEIN                                │
│  ┌─────────────────────────────────────────┐ │
│  │ [○] 🔴 Chicken thighs    1.5 lbs       │ │
│  │ [○] 🔴 Osso buco         4 pieces      │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  🧀 DAIRY                                  │
│  ┌─────────────────────────────────────────┐ │
│  │ [○] 🟡 Pecorino Romano   200g          │ │
│  │ [○] 🟡 Mascarpone        500g          │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  🫙 PANTRY · 🌿 SPICES · 📦 OTHER          │
│  (same pattern for remaining categories)    │
│                                             │
│  ── EMPTY CATEGORY STATES ─────────────────  │
│  Categories with no items show a dashed     │
│  border placeholder with semantic color     │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │ [Order from Instacart • $47.50  →]     │ │ ← full-width CTA
│  └─────────────────────────────────────────┘ │
│                                             │
│        0/29 Items  •  Est. $47.50           │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Online / In-Store toggle: Switches shopping mode
- Recipe source cards: Horizontal scroll carousel (200px wide, 130px tall)
  - Serving selector: [-] count [+] adjusts per-recipe servings (1–20 range)
  - [✕] button: Removes recipe from active list, recalculates ingredients
  - "View Recipe" link: Navigates to `/recipe/[id]`
- Retailer icons: Select shopping destination (Walmart, Amazon Fresh, Instacart, Target)
- Ingredient checkboxes: Toggle checked state per ingredient
- Order CTA: Full-width terracotta button with retailer name and estimated total
- Stats update dynamically: checked count / total count, estimated price

**Data Flow:**
- Grocery items are derived from `activeRecipes` state (subset of all recipes)
- Removing a recipe recalculates all ingredient quantities and stats
- Serving size changes affect ingredient amounts proportionally
- Checked state persists across recipe changes via `checkedIds` Set

---

### 4.5 Cook Screen (`/cook`)

```
┌─────────────────────────────────────────────┐
│  HeaderBar (frosted glass)                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ KITCHEN REPUTATION ───────────────────┐ │
│  │  👤  KITCHEN REPUTATION                │ │
│  │      Home Cook                         │ │
│  │      Level 8 ████████░░░░ 2450 XP      │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ ACTIVE COOKING SESSION ───────────────┐ │
│  │  🖼️ Recipe hero image                  │ │
│  │  IN THE KITCHEN                        │ │
│  │  Coq au Vin                            │ │
│  │  "Coq au Vin was originally a..."      │ │
│  │  Step 3 of 6                           │ │
│  │  [Resume Session] ──→ /cook-mode/[id]  │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  TECHNIQUE LIBRARY                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ → scroll │
│  │ 🖼️     │ │ 🖼️     │ │ 🖼️     │          │
│  │ Knife  │ │ Sauce  │ │ Plating│          │
│  │ Skills │ │ Making │ │        │          │
│  │ 12 min │ │ 15 min │ │ 10 min │          │
│  └────────┘ └────────┘ └────────┘          │
│                                             │
│  RECENTLY COOKED                            │
│  ┌─────────────────────────────────────────┐ │
│  │  🖼️ Recipe   │ Completion info         │ │
│  │  tap → /recipe/[id]                     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ACHIEVEMENTS                               │
│  ┌─────────────────────────────────────────┐ │
│  │  🏆 Achievement badges and progress     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Profile avatar: Tap navigates to `/profile`
- "Resume Session" button: Navigates to `/cook-mode/[id]` for the in-progress recipe
- Technique cards: Horizontal scroll, tap for technique tutorials
- Recently cooked recipes: Tap navigates to `/recipe/[id]`

---

### 4.6 Country Detail (`/country/[id]`)

```
┌─────────────────────────────────────────────┐
│  ┌─ HERO IMAGE (full bleed) ──────────────┐ │
│  │                                         │ │
│  │  [← Back]  (glass pill, top-left)       │ │
│  │                                         │ │
│  │  🇮🇹 Southern Europe   (glass pill)     │ │
│  │  Italy                                  │ │
│  │  "Where every meal is a love letter"    │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  Italian Cuisine                            │
│  "Italian cuisine is a celebration of       │
│   simplicity and quality ingredients..."    │
│                                             │
│  SIGNATURE RECIPES         [View All]       │
│  ┌──────────┐  ┌──────────┐                 │
│  │ 🖼️       │  │ 🖼️       │                 │
│  │ Cacio e  │  │ Osso Buco│                 │
│  │ Pepe     │  │ alla     │                 │
│  │ Medium   │  │ Milanese │                 │
│  │ 25 min   │  │ Hard     │                 │
│  │ tap → /recipe/it-1     │                 │
│  └──────────┘  └──────────┘                 │
│  (scrollable grid of all country recipes)   │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Back button (glass pill): `router.back()` to previous screen
- Signature recipe cards: Tap navigates to `/recipe/[id]`
- Heart icon on recipe cards: Toggles bookmark

---

### 4.7 Recipe Detail (`/recipe/[id]`)

```
┌─────────────────────────────────────────────┐
│  ┌─ HERO IMAGE ───────────────────────────┐ │
│  │                                         │ │
│  │  [← Back]                    [♡ Save]   │ │
│  │                                         │ │
│  │  🇮🇹 Italy                              │ │
│  │  Cacio e Pepe                           │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ QUICK STATS ──────────────────────────┐ │
│  │  ⏱ 25 min  │  📊 Medium  │  🍽 4 serv │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ SERVING ADJUSTER ────────────────────┐  │
│  │  Servings:  [ - ]  4  [ + ]           │  │
│  │  (range: 1–20, adjusts ingredients)   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ CULTURAL NOTE ────────────────────────┐ │
│  │  "Cacio e Pepe dates back to Roman     │ │
│  │   shepherds who carried dried pasta..."│ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  INGREDIENTS (grouped by category)          │
│  ── Pantry ──                               │
│  • Tonnarelli pasta         400g            │
│  ── Dairy ──                                │
│  • Pecorino Romano          200g            │
│  ── Spices ──                               │
│  • Black peppercorns        2 tbsp          │
│  (amounts scale with serving adjuster)      │
│                                             │
│  STEPS                                      │
│  ┌─────────────────────────────────────────┐ │
│  │ Step 1                                  │ │
│  │ "Toast peppercorns in a dry pan..."     │ │
│  │ ⏱ 3 min                                │ │
│  ├─────────────────────────────────────────┤ │
│  │ Step 2                                  │ │
│  │ "Boil pasta in salted water..."         │ │
│  │ ⏱ 8 min                                │ │
│  ├─────────────────────────────────────────┤ │
│  │ ...                                     │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │      [Start Cooking →]                  │ │ ← sticky CTA
│  │      tap → /cook-mode/[id]              │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Back button (glass pill): `router.back()`
- Heart / Save toggle: Toggles bookmark via `BookmarksContext.toggleBookmark(id)`
- Serving adjuster: [-] and [+] buttons change serving count (1–20), ingredient amounts scale proportionally
- "Start Cooking" CTA: Navigates to `/cook-mode/[id]`
- Country flag pill: Decorative (no navigation)

---

### 4.8 Cook Mode (`/cook-mode/[id]`)

```
┌─────────────────────────────────────────────┐
│                                             │
│  [✕ Close]               Step 3 of 6       │
│                                             │
│  ┌─ PROGRESS BAR ─────────────────────────┐ │
│  │  ████████████░░░░░░░░░░░░░░░░░░░░░░░░  │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│                                             │
│           STEP 3                            │
│                                             │
│  "Add the pasta to the pan with the         │
│   peppercorn oil. Toss vigorously while     │
│   adding small ladles of pasta water.       │
│   The starch creates a creamy emulsion."    │
│                                             │
│                                             │
│           ┌──────────────┐                  │
│           │   ⏱ 03:00    │  ← countdown    │
│           │  [Start Timer]│                  │
│           └──────────────┘                  │
│                                             │
│                                             │
│                                             │
│  ┌──────────┐            ┌──────────┐       │
│  │ ◄ Prev   │            │  Next ►  │       │
│  └──────────┘            └──────────┘       │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- [✕ Close]: Returns to previous screen (`router.back()`)
- Progress bar: Visual indicator of step completion (currentStep / totalSteps)
- Timer: Displays countdown in MM:SS format when step has duration
  - [Start Timer]: Begins countdown. Haptic feedback (`Haptics.notificationAsync`) on completion
  - Timer auto-stops at 0 seconds
- [◄ Prev]: Go to previous step with haptic feedback (`Haptics.impactAsync`)
- [Next ►]: Go to next step with haptic feedback, auto-sets timer for next step if it has duration
- Screen stays awake: `useKeepAwake()` prevents screen sleep during cooking
- Last step: "Next" becomes "Finish" or is disabled

---

### 4.9 Profile & Settings (`/profile`)

```
┌─────────────────────────────────────────────┐
│  [← Back]    Profile & Settings     [   ]   │
├─────────────────────────────────────────────┤
│                                             │
│           👤 (large avatar)                 │
│           Home Chef                         │
│           Culinary explorer since 2024      │
│           Level 8 ████████░░░ 2450 XP       │
│           550 XP to Level 9                 │
│                                             │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │  23  │  │   5  │  │  12  │              │
│  │Recipes│  │Count-│  │ Day  │              │
│  │Cooked│  │ries  │  │Streak│              │
│  └──────┘  └──────┘  └──────┘              │
│                                             │
│  DIETARY PREFERENCES                        │
│  ┌────────┐ ┌────────┐ ┌────────────┐      │
│  │🥦 Vege-│ │🌱 Vegan│ │🌾 Gluten-  │      │
│  │tarian  │ │        │ │Free        │      │
│  ├────────┤ ├────────┤ ├────────────┤      │
│  │🥛 Dairy│ │🥜 Nut- │ │✨ Halal    │      │
│  │Free    │ │Free    │ │            │      │
│  └────────┘ └────────┘ └────────────┘      │
│  (multi-select chips, terracotta when active)│
│                                             │
│  COOKING SETTINGS                           │
│  ┌─────────────────────────────────────────┐ │
│  │ ⚖ Measurement Units    [METRIC]        │ │
│  │ 👥 Default Servings     4 servings  ►   │ │
│  │ ⏱ Timer Sound          Gentle chime ►   │ │
│  │ 📳 Haptic Feedback      [████ ON]       │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  NOTIFICATIONS                              │
│  ┌─────────────────────────────────────────┐ │
│  │ 🔔 Push Notifications   [████ ON]       │ │
│  │ 📧 Weekly Digest        [████ ON]       │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  GENERAL                                    │
│  ┌─────────────────────────────────────────┐ │
│  │ 🎨 Appearance    → opens theme modal   │ │
│  │ 📥 Offline Recipes       3 saved    ►   │ │
│  │ ❓ Help & Support                   ►   │ │
│  │ ℹ About Fork & Compass  v1.0.0     ►   │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │ 🛡 Privacy Policy                   ►   │ │
│  │ 📄 Terms of Service                 ►   │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─────────────────────────────────────────┐ │
│  │        [Sign Out]  (destructive)        │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ┌─ THEME MODAL (overlay) ────────────────┐ │
│  │  Choose Appearance                      │ │
│  │                                         │ │
│  │  ○ System  - Match your device settings │ │
│  │  ● Light   - Always use light mode      │ │
│  │  ○ Dark    - Always use dark mode       │ │
│  │                                         │ │
│  │  [Done]                                 │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Back button: `router.back()`
- Dietary preference chips: Multi-select toggle (terracotta border + background when active)
- Measurement units: Toggle between METRIC / IMPERIAL
- Haptic Feedback / Push Notifications / Weekly Digest: Switch toggles
- Appearance row: Opens theme selection modal
- Theme modal: Radio-select between System / Light / Dark, persists via ThemeContext to AsyncStorage
- Sign Out button: Shows confirmation Alert with Cancel / Sign Out (destructive) options

---

### 4.10 Bookmarks (`/bookmarks`)

```
┌─────────────────────────────────────────────┐
│  [← Back]      Saved Recipes        [   ]   │
├─────────────────────────────────────────────┤
│                                             │
│  ── GROUPED BY COUNTRY ──                   │
│                                             │
│  🇮🇹 Italy                                  │
│  ┌─────────────────────────────────────────┐ │
│  │  🖼️ Recipe Image                       │ │
│  │  Cacio e Pepe                           │ │
│  │  Medium • 25 min                        │ │
│  │  [♡ filled]  tap → /recipe/it-1         │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │  🖼️ Tiramisu                            │ │
│  │  ...                                    │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  🇫🇷 France                                 │
│  ┌─────────────────────────────────────────┐ │
│  │  🖼️ Coq au Vin                         │ │
│  │  ...                                    │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  ── EMPTY STATE ───────────────────────────  │
│  (shown when no bookmarks exist)            │
│  ┌─────────────────────────────────────────┐ │
│  │       📖                                │ │
│  │  No saved recipes yet                   │ │
│  │  Tap the heart on any recipe to         │ │
│  │  save it here                           │ │
│  └─────────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactions:**
- Back button: `router.back()`
- Recipe cards: Tap navigates to `/recipe/[id]`
- Heart icon (filled): Tap to un-bookmark (removes from list immediately)
- Recipes are grouped by `countryId`, with country flag + name as section headers

---

## 5. Data Architecture

### 5.1 Data Models

```
┌─────────────────────────────────────────────────────────────┐
│                        Country                               │
├─────────────────────────────────────────────────────────────┤
│  id: string          (e.g., "italy")                        │
│  name: string        (e.g., "Italy")                        │
│  flag: string        (e.g., "🇮🇹")                          │
│  tagline: string     (e.g., "Where every meal is a...")     │
│  heroImage: string   (Unsplash URL)                         │
│  cuisineLabel: string(e.g., "Italian Cuisine")              │
│  region: string      (e.g., "Southern Europe")              │
│  description: string (cultural paragraph)                   │
└─────────────────────────────────────────────────────────────┘
         │
         │  1:N relationship via countryId
         ▼
┌─────────────────────────────────────────────────────────────┐
│                         Recipe                               │
├─────────────────────────────────────────────────────────────┤
│  id: string          (e.g., "it-1")                         │
│  countryId: string   (FK → Country.id)                      │
│  title: string       (e.g., "Cacio e Pepe")                │
│  image: string       (Unsplash URL)                         │
│  category: enum      ("appetizer" | "main" | "dessert")     │
│  prepTime: number    (minutes)                              │
│  cookTime: number    (minutes)                              │
│  servings: number    (default serving size)                 │
│  difficulty: enum    ("Easy" | "Medium" | "Hard")           │
│  culturalNote: string(historical/cultural context)          │
│  ingredients: Ingredient[]                                   │
│  steps: Step[]                                               │
└─────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│   Ingredient     │  │      Step        │
├──────────────────┤  ├──────────────────┤
│ name: string     │  │ instruction: str │
│ amount: string   │  │ duration?: number│
│ category: enum   │  │   (minutes)      │
│  "Produce"       │  └──────────────────┘
│  "Protein"       │
│  "Dairy"         │
│  "Pantry"        │
│  "Spices"        │
│  "Other"         │
└──────────────────┘
```

### 5.2 Data Coverage

| Country | Flag | Recipes | Region |
|---------|------|---------|--------|
| Italy | 🇮🇹 | ~12 | Southern Europe |
| France | 🇫🇷 | ~12 | Western Europe |
| Japan | 🇯🇵 | ~12 | East Asia |
| Mexico | 🇲🇽 | ~12 | North America |
| Thailand | 🇹🇭 | ~12 | Southeast Asia |
| Morocco | 🇲🇦 | ~12 | North Africa |
| India | 🇮🇳 | ~13 | South Asia |
| Spain | 🇪🇸 | ~12 | Southern Europe |
| **Total** | | **~97** | **8 countries** |

---

## 6. State Management

### 6.1 Global State (React Context)

```
┌─────────────────────────────────────────────┐
│               App Providers                  │
│          (app/_layout.tsx)                    │
│                                             │
│  QueryClientProvider                         │
│    └─ ThemeProvider                          │
│         └─ BookmarkProvider                 │
│              └─ SafeAreaProvider             │
│                   └─ ErrorBoundary          │
│                        └─ <Slot />          │
└─────────────────────────────────────────────┘
```

| Context | File | Persisted To | State | Methods | Used By |
|---------|------|-------------|-------|---------|---------|
| ThemeContext | `context/ThemeContext.tsx` | `@fork_compass_theme` (AsyncStorage) | `preference`: 'system' \| 'light' \| 'dark', `isDark`: boolean | `setPreference(pref)` | All screens via `useThemeColors()`, Profile via `useThemePreference()` |
| BookmarksContext | `context/BookmarksContext.tsx` | `@fork_compass_bookmarks` (AsyncStorage) | `bookmarkedIds`: string[] | `toggleBookmark(id)`, `isBookmarked(id)`, `bookmarkCount` | RecipeCard, RecipeDetail, BookmarksScreen |

### 6.2 Local Screen State

| Screen | State Variables | Purpose |
|--------|----------------|---------|
| Discover | `activeHero` | Tracks current hero carousel page index |
| Search | `query`, `activeMood` | Text filter + mood chip selection |
| Plan | `selectedWeek`, `isDailyView`, `selectedDayIndex`, `multipleMeals`, `showDropdown` | View mode, date selection, UI toggles |
| Grocery | `activeTab`, `selectedRetailer`, `checkedIds` (Set), `activeRecipes`, `servingSizes` | Shopping mode, retailer, ingredient check state, recipe/serving management |
| Cook | (static mock) | XP, level, progress values |
| Recipe Detail | `servings` | Adjusted serving count for ingredient scaling |
| Cook Mode | `currentStep`, `timerSeconds`, `timerRunning` | Step navigation and countdown timer |
| Profile | `showThemeModal`, `notificationsEnabled`, `weeklyDigest`, `metricUnits`, `hapticEnabled`, `selectedDietary` | All settings toggles and selections |

---

## 7. Component Dependency Map

```
HeaderBar ──────────────── used by ──→ index, search, plan, grocery, cook
GlassView ──────────────── used by ──→ HeaderBar, RecipeCard, index, search,
                                       plan, grocery, cook, recipe/[id],
                                       country/[id], cook-mode/[id],
                                       profile, bookmarks, _layout (tab bar)
RecipeCard ─────────────── used by ──→ index (Trending Bites)
DestinationCard ────────── used by ──→ index (Curated Regions)
SectionHeader ──────────── used by ──→ index (section labels)
ErrorBoundary ──────────── used by ──→ _layout.tsx (root)
ErrorFallback ──────────── used by ──→ ErrorBoundary (fallback UI)
KeyboardAwareScrollView ── used by ──→ (available for form screens)
```

### Shared Design Tokens

| Token File | Purpose | Key Values |
|-----------|---------|------------|
| `colors.ts` | Color palette | Surface: `#FEF9F3`, Primary: `#9A4100`, Dark surface: `#161412` |
| `typography.ts` | Font styles | Headlines: Noto Serif, Body/Labels: Inter |
| `spacing.ts` | Layout grid | 8pt grid system, page margin |
| `radius.ts` | Border radii | `full` for pills, standard for cards |
| `shadows.ts` | Elevation | Subtle shadows for glass elements |

---

## 8. User Journey Flows

### Journey A: "I want to explore a new cuisine"

```
Discover → tap country card → Country Detail → browse signature recipes
  → tap recipe → Recipe Detail → read cultural note & ingredients
    → [Start Cooking] → Cook Mode (step-by-step with timers)
      → finish all steps → back to Recipe Detail
```

### Journey B: "I want to plan my week's meals"

```
Plan → select week → browse daily slots
  → tap empty slot → Search → filter by mood/text
    → tap recipe → Recipe Detail → back to Plan
  → tap "Review" grocery banner → Grocery
    → adjust serving sizes → check off owned ingredients
      → select retailer → [Order from Instacart]
```

### Journey C: "I want to cook something quick tonight"

```
Discover → tap "Cook Tonight" card → Recipe Detail
  → adjust servings → [Start Cooking]
    → Cook Mode → navigate steps with timers
      → haptic feedback on timer completion
        → finish → back to Cook tab (XP updated)
```

### Journey D: "I want to revisit a saved recipe"

```
Any screen → tap bookmark icon in HeaderBar → Bookmarks
  → browse saved recipes grouped by country
    → tap recipe → Recipe Detail → [Start Cooking]
```

### Journey E: "I want to customize my experience"

```
Any screen → tap profile avatar in HeaderBar → Profile
  → set dietary preferences (multi-select chips)
  → change appearance (System/Light/Dark modal)
  → toggle measurement units (Metric/Imperial)
  → configure notifications and haptic feedback
  → sign out
```

### Journey F: "I want to resume cooking"

```
Cook tab → see active session card ("Step 3 of 6")
  → [Resume Session] → Cook Mode (resumes at last step)
    → continue with timers and haptics → finish
```

---

*Last updated: April 7, 2026*
*App version: 1.0.0*
*Total screens: 10 (5 tabs + 5 detail/modal)*
*Total recipes: ~97 across 8 countries*
