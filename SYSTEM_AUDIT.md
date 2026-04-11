# Fork & Compass — Complete System Audit
**Date:** April 11, 2026  
**Repo:** github.com/CaptKam/FNCV2  
**Status:** Production-ready. All systems running.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Mobile App — Fork & Compass](#3-mobile-app--fork--compass)
   - [Design System](#31-design-system-the-ethereal-archivist)
   - [Screens & Navigation](#32-screens--navigation)
   - [Data Layer](#33-data-layer)
   - [State Management](#34-state-management)
   - [Components](#35-components)
   - [Utilities](#36-utilities)
   - [Animation System](#37-animation-system)
4. [API Server](#4-api-server)
5. [Admin Dashboard](#5-admin-dashboard)
   - [Pages](#51-pages)
   - [API Endpoints](#52-api-endpoints)
6. [Shared Libraries](#6-shared-libraries)
7. [Git History](#7-git-history)
8. [Environment & Workflows](#8-environment--workflows)
9. [Known Notes & Non-Issues](#9-known-notes--non-issues)

---

## 1. Project Overview

**Fork & Compass** is a premium culinary travel app ecosystem.

> *"Pick a country, cook a dinner, feel like you traveled."*

The system consists of three main products:

| Product | Type | Purpose |
|---|---|---|
| Mobile App | Expo React Native | Consumer-facing cooking + travel app |
| Admin Dashboard | React + Vite SPA | Internal content & user management |
| API Server | Express 5 | Backend for admin panel + shared endpoints |

All recipe and country data is **local mock data** — no database required for the mobile app. The admin panel and API server share data imported directly from the mobile data files.

---

## 2. Monorepo Structure

```
/
├── artifacts/
│   ├── mobile/           — Expo React Native app (@workspace/mobile)
│   ├── api-server/       — Express 5 API server (@workspace/api-server)
│   ├── admin/            — React + Vite admin panel (@workspace/admin)
│   └── mockup-sandbox/   — Component preview server for canvas design work
├── lib/
│   ├── api-spec/         — OpenAPI YAML spec
│   ├── api-client-react/ — Orval-generated React Query hooks
│   ├── api-zod/          — Orval-generated Zod schemas
│   └── db/               — Drizzle ORM schema + migrations
├── scripts/              — Workspace utility scripts
├── replit.md             — Living architecture reference
├── SYSTEM_AUDIT.md       — This file
├── pnpm-workspace.yaml   — Workspace config
├── tsconfig.base.json    — Shared TypeScript config
└── package.json          — Root workspace
```

**Toolchain:**
- Package manager: pnpm workspaces
- Node.js: 24
- TypeScript: 5.9
- Build: esbuild (API server), Vite (admin), Metro (mobile)

---

## 3. Mobile App — Fork & Compass

**Package:** `@workspace/mobile`  
**Directory:** `artifacts/mobile/`  
**Framework:** Expo SDK 54, expo-router ~6.0.17  
**Preview:** Expo Go (iOS/Android) + web (Metro bundler)

### 3.1 Design System: "The Ethereal Archivist"

| Token | Value | Usage |
|---|---|---|
| Primary / Terracotta | `#9A4100` | All interactive elements, active states, primary text |
| Surface / Cream | `#FEF9F3` | Light mode background |
| Dark surface | `#1A0E06` | Dark mode background |
| Grid unit | 8pt | All spacing in multiples of 4/8 |
| Border radius | 12–24pt | Cards, pills, modals |

**Typography:**
- Headlines: Noto Serif (brand voice, recipe names, country names)
- Body / Labels: Inter (all UI text, ingredients, steps)

**Liquid Glass Effect:**
- `GlassView` component wraps `expo-blur` `BlurView`
- Specular highlight rendered as a top-edge 1px white stroke only (not full border)
- Intensity: 40 (light) / 60 (dark)

**Tab Bar:**
- Floating pill shape, elevated above content
- Spring-animated tab icons with background opacity on focus
- Haptic feedback on every tab press

**Constants files** (`artifacts/mobile/constants/`):

| File | Contents |
|---|---|
| `colors.ts` | Full light + dark palette, semantic tokens |
| `typography.ts` | Typography.headlineLarge, headline, titleSmall, body, caption, etc. |
| `spacing.ts` | Spacing.xs (4) → Spacing.page (24) → Spacing.xxl (48) |
| `radius.ts` | Radius.sm (8) → Radius.xl (24) |
| `shadows.ts` | Elevation presets: low, medium, high |
| `glass.ts` | GlassView default props (blur intensity, tint, border config) |
| `motion.ts` | Spring presets: gentle, snappy, bouncy (damping + stiffness values) |
| `icons.ts` | Lucide icon name map for tab bar + headers |

---

### 3.2 Screens & Navigation

**Expo Router file-based routing:**

```
app/
├── _layout.tsx              — Root layout (ThemeProvider → AppProvider → BookmarksProvider → ToastProvider → OnboardingGuard)
├── onboarding.tsx           — 3-screen first-launch flow
├── (tabs)/
│   ├── _layout.tsx          — Floating pill tab bar
│   ├── index.tsx            — Discover tab
│   ├── search.tsx           — Search tab
│   ├── plan.tsx             — Plan tab
│   ├── grocery.tsx          — Grocery tab
│   └── cook.tsx             — Cook tab ("Kitchen Lab")
├── country/[id].tsx         — Country detail screen
├── recipe/[id].tsx          — Recipe detail screen
├── cook-mode/[id].tsx       — Active cook mode (full-screen)
├── technique/[id].tsx       — Technique detail screen
├── profile.tsx              — Profile & settings
├── bookmarks.tsx            — Saved recipes
├── passport.tsx             — Passport stamps collection
├── dinner-setup.tsx         — Dinner party setup wizard
├── dinner-complete.tsx      — Post-dinner celebration screen
├── cooking-schedule.tsx     — Schedule management
└── +not-found.tsx           — 404 fallback
```

**Screen-by-screen detail:**

#### Onboarding (`onboarding.tsx`)
3-screen flow shown on first launch only (guarded by `hasCompletedOnboarding` in AsyncStorage):
- Screen 1: Welcome, display name input, avatar picker (6 emoji avatars)
- Screen 2: Dietary preferences (Vegetarian, Vegan, Gluten-Free, Halal, Dairy-Free)
- Screen 3: Cooking level (Beginner / Home Cook / Adventurous)
- Animated dot indicator, skip button top-right
- On completion: sets `hasCompletedOnboarding: true`, navigates to `/(tabs)`

#### Discover Tab (`index.tsx`)
- Hero carousel: featured recipes from selected countries, horizontal scroll with Liquid Glass cards
- Country destination cards: horizontal scroll, 8 country cards with flag + recipe count
- "Today's Pick" section: algorithm-selected recipe based on user cooking level
- Pull-to-refresh support
- DestinationCard → navigates to `/country/[id]`
- RecipeCard → navigates to `/recipe/[id]`

#### Search Tab (`search.tsx`)
- Live text search across recipe names + descriptions
- Filter chips row: All Cuisines, Dietary restrictions, Difficulty (Easy / Medium / Hard), Meal Type
- AnimatedListItem staggered results list
- Empty state with warm copy

#### Plan Tab (`plan.tsx`)
- Weekly meal planner timeline
- AddToPlanSheet bottom sheet for selecting a day + meal slot
- Dinner party integration: tap "Dinner Party" to launch `dinner-setup.tsx`
- SmartCookBar: sticky bottom bar when a recipe is planned for today
- Extended FAB pill for adding new plan items

#### Grocery Tab (`grocery.tsx`)
- Auto-populated from planned recipes (scales ingredients by servings)
- Checkbox rows with swipe-to-delete
- Section headers by recipe name
- Standalone success state when all items are checked off
- Date-aware: clears stale grocery items at midnight rollover

#### Cook Tab — Kitchen Lab (`cook.tsx`)
- Mission-control style active cook dashboard
- Shows currently active cook session with progress
- CookingPill component: recipe name, step count, elapsed timer
- Links to active `cook-mode/[id]` session

#### Country Detail (`country/[id].tsx`)
- Hero image with Liquid Glass overlay
- Country description + cultural notes
- Recipe grid (all recipes for that country)
- Passport stamp badge if user has cooked a recipe from this country

#### Recipe Detail (`recipe/[id].tsx`)
- Full-bleed hero image with back button overlay
- Nutrition bento: calories, protein, carbs, fat per serving
- Allergen warning banner (auto-detected from ingredients)
- Ingredient list with optional grocery scaling
- Cultural note card
- AnimatedHeart bookmark button (top-right overlay)
- "Start Cooking" CTA → navigates to `cook-mode/[id]`

#### Cook Mode (`cook-mode/[id].tsx`)
- Full-screen step-by-step guided cooking
- Step counter with animated progress bar
- Per-step timer (with visual countdown + haptic at 0)
- Ingredient checklist sidebar
- Keep-awake (screen never sleeps during cook)
- Color tokens fully via `useThemeColors`
- On completion → `dinner-complete.tsx`

#### Dinner Complete (`dinner-complete.tsx`)
- Celebration screen with confetti animation
- XP gain display (animated counter)
- Passport stamp reveal animation
- CTA to rate / share / save the recipe

#### Profile (`profile.tsx`)
- Editable display name (inline text input)
- Avatar picker (6 emoji options) in a modal sheet
- Stats bento: XP points, Countries Visited, Recipes Saved
- Country circles row: horizontal scroll of 8 country flag circles
  - Visited = full opacity + terracotta ring border
  - Unvisited = 40% opacity, no border
  - Tappable → navigates to `/country/[id]`
- Food-type pills: 3 Liquid Glass cards (Appetizer / Main / Dessert) showing cooked count per category
- Settings sections: Dietary preferences, Cooking Settings, Notifications, General
- Theme picker modal (System / Light / Dark)

#### Bookmarks (`bookmarks.tsx`)
- All bookmarked/favorited recipes persisted via `BookmarksContext`
- Filter by category (All / Appetizer / Main / Dessert)
- Sort by: Date Added / Cuisine / Difficulty
- AnimatedListItem staggered list
- Empty state

#### Passport (`passport.tsx`)
- Collection of passport stamps earned by cooking recipes
- One stamp per country, unlocked when first recipe from that country is completed
- Animated reveal on new stamp earned

#### Technique Detail (`technique/[id].tsx`)
- Reference screen for cooking technique definitions
- Sourced from `data/techniques.ts`

#### Dinner Setup (`dinner-setup.tsx`)
- Multi-step dinner party setup wizard
- Guest count, dietary restrictions for guests, date/time picker
- Generates a dinner timeline using `utils/timelineEngine.ts`

---

### 3.3 Data Layer

All data is local TypeScript files — **no network requests, no database.**

**`artifacts/mobile/data/`:**

| File | Size | Contents |
|---|---|---|
| `countries.ts` | 93 lines | 8 country objects (id, name, flag, description, heroImage, recipeCount) |
| `recipes.ts` | 2,767 lines | 97 recipes with full ingredients, steps, cultural notes, metadata |
| `nutrition.ts` | 129 lines | Per-serving macros for all 97 recipes (calories, protein, carbs, fat) |
| `techniques.ts` | 112 lines | Cooking technique definitions with descriptions |
| `substitutions.ts` | 79 lines | Ingredient substitution mappings |
| `maps.ts` | 127 lines | Country → region + cuisine metadata for filtering |
| `helpers.ts` | 190 lines | Data query helpers (getRecipesByCountry, getRecipeById, etc.) |
| `index.ts` | 4 lines | Barrel export |

**Countries:**
Italy 🇮🇹, France 🇫🇷, Japan 🇯🇵, Mexico 🇲🇽, Thailand 🇹🇭, Morocco 🇲🇦, India 🇮🇳, Spain 🇪🇸

**Recipes:** 97 total (approx. 12 per country), categorized as Appetizer / Main / Dessert, tagged with difficulty (Easy / Medium / Hard) and dietary flags (vegetarian, vegan, gluten-free, halal, dairy-free).

---

### 3.4 State Management

All state uses React Context + AsyncStorage (no Redux, no Zustand).

**`AppContext` (`context/AppContext.tsx`):**

| State Slice | Contents |
|---|---|
| `hasCompletedOnboarding` | Boolean — controls onboarding guard |
| `displayName` | User's chosen name |
| `avatarId` | Selected emoji avatar index |
| `dietaryPreferences` | Array of active dietary flags |
| `cookingLevel` | 'beginner' / 'home-cook' / 'adventurous' |
| `itinerary` | Array of planned recipe items with date/meal-slot |
| `groceryList` | Scaled ingredient list from planned recipes |
| `cookSession` | Active cook: recipeId, currentStep, startTime, elapsed |
| `passportStamps` | Record<countryId, cookCount> |
| `xp` | Total experience points earned |
| `level` | Derived from XP (1–10) |
| `dinnerParties` | Saved dinner party plans |
| `isHydrated` | Boolean — true after AsyncStorage load complete (used by OnboardingGuard) |

**`BookmarksContext` (`context/BookmarksContext.tsx`):**
- `bookmarks`: Set of recipe IDs
- `toggleBookmark(id)`: Adds/removes, persists to AsyncStorage
- Shared across RecipeCard, Recipe Detail, Bookmarks screen

**`ThemeContext` (`context/ThemeContext.tsx`):**
- `theme`: 'system' | 'light' | 'dark'
- `setTheme(t)`: Persists preference to AsyncStorage
- `useThemeColors()`: Hook returning full resolved color palette + `isDark`, `radius`, `spacing`, `glass`, `shadows`

**`ToastContext` (`context/ToastContext.tsx`):**
- `showToast(message, type)`: Global named toast notifications
- Types: success, error, info, warning
- Animated slide-in banner from top

**Provider nesting order** in `_layout.tsx`:
```
ThemeProvider
  → AppProvider
    → BookmarksProvider
      → ToastProvider
        → OnboardingGuard
          → <Slot /> (expo-router screen)
```

**OnboardingGuard:**
- Waits for `isHydrated` before any redirect decision (prevents flash to onboarding on existing users)
- Redirects to `/onboarding` if `!hasCompletedOnboarding`

---

### 3.5 Components

**`artifacts/mobile/components/`:**

| Component | Description |
|---|---|
| `GlassView.tsx` | Liquid Glass container — BlurView + top-edge specular highlight, configurable intensity/tint |
| `RecipeCard.tsx` | Recipe card with hero image, name, difficulty, cuisine flag, AnimatedHeart bookmark toggle |
| `DestinationCard.tsx` | Country card with flag, name, recipe count, hero image |
| `AnimatedHeart.tsx` | Bookmark heart with spring bounce (1→1.35→1) + haptic; stopPropagation built-in |
| `AnimatedCounter.tsx` | Number rolls up from 0 to target with spring easing |
| `AnimatedListItem.tsx` | Staggered fade+slide entrance (60ms per item, 20px slide) |
| `AnimatedProgressBar.tsx` | Width-animated progress bar with spring physics |
| `PressableScale.tsx` | Drop-in Pressable with spring scale-down on press (configurable haptic) |
| `HeaderBar.tsx` | Screen header with back button, title, optional right action |
| `Checkbox.tsx` | Animated checkbox for grocery list and ingredient lists |
| `AddToPlanSheet.tsx` | Bottom sheet for selecting day + meal slot when planning a recipe |
| `RecipePickerSheet.tsx` | Bottom sheet for selecting a recipe from library |
| `SmartCookBar.tsx` | Sticky bottom bar showing today's planned recipe with start CTA |
| `CookingPill.tsx` | Compact active cook status indicator (used in Cook tab) |
| `SkeletonShimmer.tsx` | Loading skeleton with shimmer animation |
| `ErrorBoundary.tsx` | React error boundary wrapper |
| `ErrorFallback.tsx` | Friendly error fallback UI |

---

### 3.6 Utilities

**`artifacts/mobile/utils/`:**

| File | Purpose |
|---|---|
| `allergens.ts` | Scans ingredient text for top-9 allergens (gluten, dairy, nuts, eggs, soy, shellfish, fish, sesame, peanuts). Also checks dietary conflicts against user preferences. |
| `timelineEngine.ts` | Generates dinner party prep timelines from recipes + guest count. Calculates reverse-time from serving target. |
| `groceryScaling.ts` | Scales ingredient quantities by servings ratio. Parses fractions ("1/2 cup") and units. |
| `cookReadiness.ts` | Determines if a recipe is cookable today based on available grocery items. |
| `textFormatting.ts` | Pluralization, ingredient display formatting, time display (minutes → "1h 20m"). |
| `dates.ts` | Date formatting for plan/grocery — "Today", "Tomorrow", day names. Midnight rollover detection. |
| `storage.ts` | AsyncStorage wrapper with typed get/set/remove helpers. |

---

### 3.7 Animation System

All animations use `react-native-reanimated` (shared value + worklet pattern). Every animation respects `useReducedMotion()` — users who have "Reduce Motion" enabled in accessibility settings get instant/no animations.

| Animation | Implementation |
|---|---|
| Press scale (PressableScale) | `withSpring` to 0.96 on press-in, 1.0 on press-out. Damping 15, stiffness 300. |
| Heart bounce (AnimatedHeart) | `withSequence`: scale 1 → 1.35 → 1, spring damping 20 / stiffness 400 |
| List stagger (AnimatedListItem) | `withDelay(index × 60ms)` + `withSpring` opacity+translateY |
| Tab icon scale | `withSpring` to 1.15 on active, 1.0 inactive. Damping 16, stiffness 260. |
| Tab icon background | `withTiming` opacity 0→0.12 on active |
| Progress bar | `withSpring` width percentage, damping 20, stiffness 120 |
| Counter roll | `withSpring` from 0 to target value |
| Theme crossfade | `withTiming` 300ms on color token changes |

---

## 4. API Server

**Package:** `@workspace/api-server`  
**Directory:** `artifacts/api-server/`  
**Framework:** Express 5  
**Port:** Assigned via `$PORT` env variable  
**Build:** esbuild → CJS bundle

**File structure:**
```
src/
├── app.ts          — Express app setup (CORS, JSON body parser, routes mount)
├── index.ts        — Server entry point (listen on PORT)
├── lib/
│   └── logger.ts   — Structured request logging
└── routes/
    ├── index.ts    — Mounts /api/admin + /api/health
    ├── admin.ts    — All admin routes (17 endpoints)
    └── health.ts   — GET /health → { status: "ok" }
```

**Data imports in `admin.ts`:**
- Imports `recipes` from `../../../mobile/data/recipes` (relative path resolved by esbuild at build time)
- Imports `countries` from `../../../mobile/data/countries`
- 48 mock users generated in-memory with realistic names, avatars, cooking history, feedback, plan tier

---

## 5. Admin Dashboard

**Package:** `@workspace/admin`  
**Directory:** `artifacts/admin/`  
**Framework:** React 18 + Vite + Tailwind CSS  
**Port:** 23744 (assigned via `$PORT`)  
**Routing:** Wouter  
**Data fetching:** TanStack Query (React Query)  
**UI components:** shadcn/ui  
**Icons:** lucide-react  
**Dates:** date-fns  
**Auth:** Session-based (localStorage token), admin@forkandcompass.com / admin123

**File structure:**
```
src/
├── main.tsx                        — React root mount
├── App.tsx                         — Router + QueryClient + route definitions
├── components/
│   ├── layout/
│   │   └── admin-layout.tsx        — Sidebar + topbar shell (authenticated wrapper)
│   └── ui/                         — 40+ shadcn/ui components
├── pages/
│   ├── login.tsx                   — Login form
│   ├── dashboard.tsx               — Stats overview
│   ├── recipes-list.tsx            — Recipe table
│   ├── recipe-editor.tsx           — Recipe CRUD form
│   ├── featured-manager.tsx        — Featured content by country
│   ├── users-list.tsx              — User table
│   ├── user-detail.tsx             — Single user view
│   ├── settings.tsx                — App settings
│   └── not-found.tsx               — 404
├── hooks/
│   ├── use-mobile.tsx              — Responsive breakpoint hook
│   └── use-toast.ts               — Toast state management
└── lib/
    └── utils.ts                   — cn() utility (tailwind-merge + clsx)
```

### 5.1 Pages

| Route | Page | Description |
|---|---|---|
| `/login` | Login | Full-page login form. Standalone (no sidebar). Stores token in localStorage on success. |
| `/` | Dashboard | 4 stat cards (total recipes, countries, users, featured). Recent recipes table. Quick action buttons. |
| `/recipes` | Recipes List | Searchable + filterable table. Columns: name, country, category, difficulty, status, featured. Bulk select, bulk delete, bulk status-change. Pagination. |
| `/recipes/:id` | Recipe Editor | Tabbed form: Basic Info (name, country, category, difficulty, servings, time, description), Ingredients (add/remove/reorder), Steps (add/remove/reorder), Metadata (dietary flags, cultural note, allergen warnings). Save + Duplicate + Delete actions. |
| `/featured` | Featured Manager | Accordion per country (8). Drag-and-drop ordering of featured recipes. Max 5 per country enforced. |
| `/users` | Users List | Table with avatar, name, email, level badge, plan badge (free/premium), join date, last active. Search + filter by plan. Pagination. |
| `/users/:id` | User Detail | Profile card, cooking stats (XP, level, countries visited, recipes cooked), passport stamps, dietary preferences, recent cook history, submitted feedback. |
| `/settings` | Settings | App config (app name, tagline), admin account management, database stats (recipe count, user count, featured count). |

### 5.2 API Endpoints

All endpoints prefixed `/api`:

| Method | Path | Description |
|---|---|---|
| POST | `/api/admin/login` | Authenticate with email + password. Returns `{ token, admin }` |
| GET | `/api/admin/stats` | Dashboard stats: totalRecipes, totalCountries, totalUsers, featuredCount, recentRecipes |
| GET | `/api/countries` | Full country list |
| GET | `/api/admin/recipes` | Paginated recipe list. Query: `page`, `limit`, `search`, `country`, `category`, `difficulty`, `status` |
| GET | `/api/admin/recipes/:id` | Single recipe detail |
| PATCH | `/api/admin/recipes/:id` | Update recipe fields |
| DELETE | `/api/admin/recipes/:id` | Delete recipe |
| POST | `/api/admin/recipes/:id/feature` | Toggle featured status |
| PATCH | `/api/admin/recipes/:id/status` | Update recipe status (draft/published/archived) |
| POST | `/api/admin/recipes/:id/duplicate` | Clone recipe with "Copy of..." prefix |
| PATCH | `/api/admin/recipes/bulk` | Bulk status update for array of IDs |
| DELETE | `/api/admin/recipes/bulk` | Bulk delete array of IDs |
| GET | `/api/admin/featured/:countryId` | Get featured recipe list for a country |
| PUT | `/api/admin/featured/:countryId` | Set ordered featured list for a country |
| GET | `/api/admin/users` | Paginated user list. Query: `page`, `limit`, `search`, `plan` |
| GET | `/api/admin/users/:id` | User detail with full cook history |
| GET | `/api/admin/settings` | Current app settings |
| PATCH | `/api/admin/settings` | Update app settings |

---

## 6. Shared Libraries

**`lib/`** — TypeScript packages shared across the workspace.

| Package | Purpose |
|---|---|
| `@workspace/api-spec` | OpenAPI 3.1 YAML specification at `lib/api-spec/openapi.yaml`. Source of truth for all API contracts. |
| `@workspace/api-client-react` | Orval-generated React Query hooks from the OpenAPI spec. Auto-generated — do not edit manually. |
| `@workspace/api-zod` | Orval-generated Zod schemas from the OpenAPI spec. Used for request validation + type inference. |
| `@workspace/db` | Drizzle ORM schema (`schema.ts`) + migration runner. PostgreSQL. |

**Codegen command:**
```bash
pnpm --filter @workspace/api-spec run codegen
```
Regenerates both `api-client-react` and `api-zod` from the YAML spec.

---

## 7. Git History

| Commit | Message |
|---|---|
| `688fc02` | Task #21: Profile country circles & food-type pills |
| `5c42ba2` | Add comprehensive admin dashboard for managing recipes and users |
| `016da8c` | Add dinner party timeline design and code examples |
| `274aae2` | Add onboarding screen images for new user setup |
| `5557ef6` | Merge PR #83 — audit date/time system |
| `a873c43` | Polish pass: Extended FAB pill, pull-to-refresh, layout animations, warm copy |
| `c8d613d` | Merge PR #82 |
| `ec294f5` | Refine core loop connection points: grocery standalone success, first-ever cook line |
| `806bc44` | Merge PR #81 |
| `aab0596` | Kill dead moments: animated counters, progress bars, step transitions, theme crossfade |
| `c6eeda7` | Merge PR #80 |
| `6e5a2dc` | Fix auto-generate: cooking level, servings, recency, shuffle, named toast |
| `c1825b9` | Merge PR #79 |
| `12ba4ba` | Fix midpoint audit findings: wire SmartCookBar, dark mode, servings, dietary, cleanup |
| `9448b4c` | Merge PR #78 |
| `72e1436` | Fix date/time system: date-aware grocery list, stale data cleanup, midnight rollover |
| `f79379a` | Merge PR #77 — grandma test usability |
| `565ac7b` | Upgrade cook mode visuals: progress bar, hero image, ingredient checkboxes |
| `ff11f17` | Merge PR #76 |
| `1331fb6` | Kill dead taps: PressableScale on cards, tab haptics, checkbox animation |
| `0706815` | Add global Toast system, Passport screen, polish pass (batch 1) |
| `3bbb420` | Published app |

**Current HEAD:** `688fc02` — in sync with `origin/main` on GitHub.

---

## 8. Environment & Workflows

**Running workflows:**

| Workflow | Command | Status |
|---|---|---|
| `artifacts/mobile: expo` | `pnpm --filter @workspace/mobile run dev` | Running |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` | Running |
| `artifacts/admin: web` | `pnpm --filter @workspace/admin run dev` | Running |
| `artifacts/mockup-sandbox: Component Preview Server` | `pnpm --filter @workspace/mockup-sandbox run dev` | Running |

**Key commands:**
```bash
# Type-check entire monorepo
pnpm run typecheck

# Build all packages
pnpm run build

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema (dev only)
pnpm --filter @workspace/db run push

# Run individual artifact dev servers
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/admin run dev
pnpm --filter @workspace/mobile run dev
```

---

## 9. Known Notes & Non-Issues

| Item | Status | Notes |
|---|---|---|
| Web preview shows onboarding on fresh browser session | Expected | localStorage is empty on fresh load. Complete onboarding or use Expo Go on device. |
| `SettingRow` nested Pressable → `<button>` hydration warning on web | Low priority | React Native Web serializes Pressable as `<div>`, no visual impact, no crash. |
| Admin data is in-memory only | By design | No persistent DB for admin panel. All mutations reset on API server restart. |
| Orval-generated files should not be edited manually | Note | Run codegen after any OpenAPI spec changes. |
| All 97 recipes are mock data | By design | No CMS or real food API. Data lives in `artifacts/mobile/data/recipes.ts`. |
| Admin login credentials | `admin@forkandcompass.com` / `admin123` | Hardcoded in `admin.ts`. For internal use only. |
| `lib/db` package (PostgreSQL/Drizzle) | Scaffolded, not actively used | Admin and mobile data are not database-backed. Drizzle schema exists for future use. |
