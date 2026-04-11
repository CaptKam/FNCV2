# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Mobile App: Fork & Compass

Premium culinary travel Expo React Native app. Tagline: "Pick a country, cook a dinner, feel like you traveled."

### Design System: "The Ethereal Archivist"
- **Colors**: Terracotta #9A4100 (interactive), Cream #FEF9F3 (surface), dark mode supported
- **Typography**: Noto Serif (headlines), Inter (body/labels)
- **Effects**: Liquid Glass (BlurView + specular highlight), floating pill tab bar
- **Grid**: 8pt spacing system
- **Components**: GlassView, SectionHeader, RecipeCard, DestinationCard

### Screens
- 5 tabs: Discover (hero carousel), Search (filter chips), Plan (timeline), Grocery (checkboxes), Cook ("Kitchen Lab" mission control)
- Detail screens: Country Detail, Recipe Detail
- Onboarding: 3-screen flow (welcome+name+avatar, dietary preferences, cooking level) shown on first launch
- Cook Mode: Full-screen step-by-step with timer, haptics, keep-awake; colors fully tokenized via useThemeColors
- Profile & Settings: editable display name + avatar, dietary preferences, cooking settings, notifications, general
- Bookmarks: saved recipes with persistence, filter by category, sort by date/cuisine/difficulty

### State Management
- AppContext (React Context + AsyncStorage): itinerary, grocery, cook session, preferences (incl. hasCompletedOnboarding, displayName, avatarId), XP/level, dinner parties/plans. Exposes `isHydrated` for safe onboarding guard
- BookmarksContext (React Context + AsyncStorage): shared bookmark/favorite state across RecipeCard, Recipe Detail, and Bookmarks screen
- ThemeContext (React Context + AsyncStorage): user theme preference (system/light/dark); `useThemeColors` reads from this context; profile page has modal picker for switching
- All providers wrap entire app in `_layout.tsx` (ThemeProvider outermost). OnboardingGuard waits for hydration before redirecting

### Data
- All local mock data: 8 countries, 97 recipes with ingredients, steps, cultural notes
- Nutrition data: per-serving calories/protein/carbs/fat for all 97 recipes (data/nutrition.ts)
- Allergen detection: auto-scans ingredients for top-9 allergens (utils/allergens.ts)
- No backend required

### Animation Components (Kinetic Polish)
- `PressableScale` — Spring-based press animation (withSpring, damping 15/20, stiffness 300/400)
- `AnimatedHeart` — Bookmark heart with spring bounce (1→1.35→1) + haptic feedback, stopPropagation built-in
- `AnimatedListItem` — Staggered fade+slide entrance (60ms per item, 20px slide, spring physics)
- Tab bar `AnimatedIcon` — Spring scale + background opacity animation on tab focus (damping 16, stiffness 260)
- All animations respect `useReducedMotion` accessibility setting

### Key Files
- `artifacts/mobile/constants/` — colors, typography, spacing, radius, shadows, glass tokens
- `artifacts/mobile/data/` — countries.ts, recipes.ts, nutrition.ts
- `artifacts/mobile/utils/allergens.ts` — allergen detection from ingredients, dietary conflict checking
- `artifacts/mobile/context/BookmarksContext.tsx` — shared bookmarks state with AsyncStorage persistence
- `artifacts/mobile/context/ThemeContext.tsx` — theme preference (system/light/dark) with AsyncStorage persistence
- `artifacts/mobile/components/` — GlassView, SectionHeader, RecipeCard, DestinationCard
- `artifacts/mobile/app/onboarding.tsx` — 3-screen first-launch onboarding
- `artifacts/mobile/app/(tabs)/` — 5 tab screens
- `artifacts/mobile/app/country/[id].tsx` — Country detail
- `artifacts/mobile/app/recipe/[id].tsx` — Recipe detail (with bookmark button)
- `artifacts/mobile/app/cook-mode/[id].tsx` — Active cook mode
- `artifacts/mobile/app/profile.tsx` — Profile & settings screen
- `artifacts/mobile/app/bookmarks.tsx` — Saved recipes screen

## Admin Dashboard

React + Vite + Tailwind SPA at `/admin` (port 23744). Internal admin panel for managing recipes, users, and featured content.

### Tech Stack
- React 18 + Vite + Tailwind CSS + shadcn/ui components
- Wouter routing, TanStack Query, date-fns
- API hooks generated via Orval from OpenAPI spec (`lib/api-spec/openapi.yaml`)

### Pages (8)
- `/login` — Standalone login (admin@forkandcompass.com / admin123)
- `/` — Dashboard with stat cards, recent recipes, quick actions
- `/recipes` — Searchable/filterable recipe table with bulk actions, pagination
- `/recipes/:id` — Recipe editor with tabs (Basic Info, Ingredients, Steps, Metadata)
- `/featured` — Featured content manager, accordion per country (max 5 per country)
- `/users` — User table with level/plan badges, search/filter
- `/users/:id` — User detail with cooking profile, history, preferences, feedback
- `/settings` — App config, admin accounts, database stats

### API Endpoints (artifacts/api-server/src/routes/admin.ts)
- POST `/api/admin/login` — Admin authentication
- GET `/api/admin/stats` — Dashboard statistics
- GET `/api/countries` — Country list
- GET/PATCH/DELETE `/api/admin/recipes/:id` — Recipe CRUD
- GET `/api/admin/recipes` — Paginated recipe list with search/filter
- POST `/api/admin/recipes/:id/feature` — Toggle featured
- PATCH `/api/admin/recipes/:id/status` — Update status
- POST `/api/admin/recipes/:id/duplicate` — Duplicate recipe
- PATCH/DELETE `/api/admin/recipes/bulk` — Bulk operations
- GET/PUT `/api/admin/featured/:countryId` — Featured recipes per country
- GET `/api/admin/users` — Paginated user list
- GET `/api/admin/users/:id` — User detail
- GET/PATCH `/api/admin/settings` — Admin settings

### Data Source
- Recipe/country data imported from mobile app (`artifacts/mobile/data/`)
- Mock users (48) generated with realistic names, cooking history, feedback
- All data is in-memory (no database), served by API server

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
