# FORK & COMPASS

## Master Blueprint V3

**Product Vision · Design System · Architecture · Systems Roadmap**

*Pick a country, cook a dinner, feel like you traveled.*

Confidential · Version 3.0 · April 2026 · Solo Founder: Kam

voyageapron.com

---

# 1. Product Vision

> Status: **IMPLEMENTED.** The product vision below is fully realized in the current build. All core loop steps (Discover → Recipe → Plan → Grocery → Cook) have working UI screens.

## The Soul of the Product

Fork & Compass is a premium culinary travel app built on a single, powerful premise: you can travel the world from your kitchen. Pick a country. Plan a dinner. Shop the ingredients. Cook the meal. Feel like you traveled. The app exists at the intersection of food, culture, and the ritual of gathering around a table.

This is not a recipe database. It is not a meal kit replacement. Fork & Compass is a cultural experience engine that happens to involve cooking. Every interaction should feel like opening a beautifully edited travel magazine and stepping inside.

> "Pick a country, cook a dinner, feel like you traveled."

## Origin Story

Born during the COVID era, when friends would pick a country and build an entire evening around its cuisine, drinks, and music to simulate the travel they couldn't do. That dinner party energy—the planning, the anticipation, the shared experience—is the emotional core of everything Fork & Compass builds.

## Who This Is For

Serious home cooks who see cooking as exploration, not obligation. People who already cook well and want to go deeper into world cuisine. The user who spends Sunday afternoon planning the week's meals, who browses recipes the way others browse travel blogs, and who treats a dinner party as an event worth orchestrating.

## Competitive Positioning

Fork & Compass owns culturally authentic world cuisine for serious home cooks. The moat is cultural depth combined with the travel premise. NYT Cooking skews American and European. SideChef pivoted to grocery commerce. HelloFresh validated that people want to cook international food at home but commoditized the experience. No one has built a premium, editorial-quality platform that treats each country's cuisine as a world worth exploring.

| Competitor | Strength | Gap Fork & Compass Fills |
|-----------|----------|--------------------------|
| NYT Cooking | Trusted editorial voice, large audience | American/European bias; no cultural travel framing |
| SideChef | Step-by-step guidance, grocery integration | Pivoted to commerce; lost editorial soul |
| HelloFresh | Validated international cooking at home | Kit model, not exploration; commoditized |
| Mela / Paprika | Clean recipe management UIs | Utility-first; no cultural depth or social features |

---

# 2. Design Philosophy

> Status: **IMPLEMENTED.** All design philosophy principles below are realized in the current codebase. The design system is locked and enforced via `useThemeColors()`, typography tokens, and shared components.

Every pixel in Fork & Compass is governed by three interlocking design frameworks: Steve Jobs' functional aesthetics, Apple's Human Interface Guidelines (including iOS 26 Liquid Glass), and the editorial sensibility of luxury print magazines. These are not decorative references. They are structural foundations that dictate every decision from navigation architecture to button placement to the weight of a shadow.

## 2.1 — Design Is How It Works

> "Most people make the mistake of thinking design is what it looks like. Design is how it works." — Steve Jobs

This is the governing law of Fork & Compass. Beautiful food photography means nothing if the user cannot figure out how to plan their week. A glassmorphic tab bar is worthless if it obscures the content it frames. Every aesthetic choice must serve a functional purpose. If a visual element does not help the user accomplish their goal, it is removed.

The implication is absolute: the design team and engineering team are not separate functions operating in sequence. They are a unified discipline. The interface is not a skin applied over logic. The interface is the logic, made visible.

## 2.2 — The Subtraction Audit

> "Simple can be harder than complex. You have to work hard to get your thinking clean to make it simple." — Steve Jobs

Fork & Compass applies a rigorous subtraction audit to every screen, every feature, and every interaction:

| Audit Test | Question | If It Fails |
|-----------|----------|-------------|
| Mission-Critical | What is the ONE thing the user needs here? | Remove or deeply subordinate the element |
| Grandma Test | Could a non-technical user complete this without explanation? | Redesign until no instruction is needed |
| Day-Better Test | Does this genuinely make someone's day better? | Cut it, regardless of engineering investment |

The backward-planning timeline engine is the perfect example. Users don't want to manually calculate when to start each dish. They want dinner ready at 7:00 PM. The system absorbs all of that complexity—prep times, concurrent dishes, resting periods—and presents one simple output: "Start at 4:25 PM." The user never sees the algorithm. They see a result that makes their evening effortless.

## 2.3 — The Four HIG Pillars

Apple's Human Interface Guidelines rest on four foundational principles. Every Fork & Compass screen must satisfy all four simultaneously:

| Principle | Definition | Fork & Compass Application |
|-----------|-----------|---------------------------|
| Clarity | Every element communicates its purpose without ambiguity | Recipe cards show prep time, difficulty, and country at a glance. No decoding required. |
| Deference | The UI steps back; content takes center stage | Food photography is the hero. Chrome is minimal. Glass effects frame content, never compete with it. |
| Depth | Visual layers and motion convey hierarchy | Modal sheets slide up for cook mode. Plan view layers weekly over daily. Spatial relationships are always clear. |
| Consistency | Familiar patterns across every screen | Tab bar is always bottom. Back is always top-left. Swipe gestures behave identically everywhere. |

## 2.4 — iOS 26 Liquid Glass and Glassmorphic Identity

With iOS 26, Apple introduced Liquid Glass—a translucent, dynamic material that reflects and refracts surrounding content in real time. This is the most significant visual redesign since iOS 7. Fork & Compass embraces Liquid Glass as its native visual identity, not as decoration but as structural design language.

Liquid Glass uses real-time lensing (not simple blur), specular highlights that respond to device motion, adaptive shadows that change based on content context, and content-aware color that samples surrounding imagery. The effect is a UI that feels alive, dimensional, and physically present.

**Liquid Glass Implementation Rules:**
- Glass effects apply exclusively to the navigation layer: tab bar, toolbars, sheet headers, floating action overlays. Never applied to content itself.
- Three variants: Regular (medium transparency, general use), Clear (high transparency for media-rich hero backgrounds), Identity (no glass effect, for screens where clarity trumps depth).
- Food photography, recipe text, and editorial content remain crisp beneath glass surfaces. Content legibility is never sacrificed for aesthetic effect.
- Specular highlights respond to device motion via gyroscope data, creating natural depth without demanding attention.
- Glass elements use content-aware color: the tab bar subtly shifts warmth over a terracotta hero image, cools over a blue-toned Japanese garden.
- On devices below iOS 26, the system degrades gracefully to BlurView frosted glass with identical layout behavior—no feature loss, only reduced visual richness.

**Current Implementation:** The app uses `GlassView` (BlurView-based) with specular top-edge highlight (`borderTopWidth: 1`). Intensity: 32 (light) / 40 (dark). Background overlay: `rgba(255,255,255,0.7)` (light) / `rgba(29,27,24,0.85)` (dark). Web fallback renders as solid `View` with background color.

The inner glow effect on glass surfaces uses a 1px inset shadow at rgba(255,255,255,0.08) to simulate light refraction at the glass edge. On dark mode, this shifts to rgba(255,255,255,0.04). The shadow must be inset, never outset—outset shadows on glass create a floating-sticker effect that breaks spatial coherence.

## 2.5 — The Back of the Cabinet

> "A true craftsman does not use inferior plywood for the back of a cabinet, even though no one will see it." — Paul Jobs, as told by Steve Jobs

The codebase of Fork & Compass is the back of the cabinet. The API server, the Drizzle ORM schema, the timeline engine algorithm, the grocery list category detection—none of this is visible to the user. All of it must be crafted with the same care as the interface. No perpetual beta. No "ship it and fix it later." No technical debt accepted as inevitable.

## 2.6 — Human-Centric Communication

Fork & Compass speaks like a knowledgeable friend who happens to have traveled the world, not like a software application. Every piece of copy—error messages, button labels, onboarding flows, recipe instructions—is written in warm, active, descriptive language.

- Adaptive cooking language across three skill tiers: First Steps (🌱), Home Cook (🍳), Chef's Table (👨‍🍳). Same ingredients, different instruction voice.
- Error states never blame the user. "Something went wrong" becomes "We couldn't load that recipe. Let's try again."
- Cultural context is woven into recipes—not as academic footnotes, but as the kind of story a friend tells while you cook together.

## 2.7 — The Evolved iOS 26 Triad

Beyond the four classic pillars, iOS 26 introduces a refined triad that Fork & Compass fully adopts:

| Principle | Definition | Fork & Compass Implementation |
|-----------|-----------|-------------------------------|
| Hierarchy | Dynamic prioritization—the interface adapts what it shows based on user context | Cook mode suppresses all navigation chrome. Plan tab surfaces the next upcoming meal. Discover hides metadata until the user scrolls past the hero. |
| Harmony | Software shapes follow hardware. Glass blends interface into device. | Tab bar glass material matches device edge curves. Content insets respect Dynamic Island and home indicator. The app feels physically embedded in the device. |
| Consistency | Adaptive, not uniform. Behavior stays constant as appearance adapts. | Same interaction model across iPhone SE and iPhone 16 Pro Max. Compact and regular size classes both receive full functionality—no features hidden on smaller screens. |

## 2.8 — Non-Negotiable Design Rules

1. Design is how it works. If beautiful but confusing, it has failed.
2. Subtract before you add. Every element must earn its place.
3. Content is the hero. Food photography and cultural stories, not chrome and UI widgets.
4. Finish the back of the cabinet. The codebase, API, admin—invisible quality everywhere.
5. Follow the HIG. Tab bars at bottom. Back at top-left. Standard gestures. No exceptions.
6. Glass is for navigation, never for content. Liquid Glass frames the experience. Food stays crisp.
7. Speak like a human. Warm, active, culturally literate. Never robotic. Never blame the user.
8. Accessibility is architecture. VoiceOver, Dynamic Type, 48pt touch targets, reduced motion, color independence.
9. Say no to protect the yes. Features are deferred, not deleted. Deferred means not built today.

---

# 3. The Ethereal Archivist Design System

> Status: **IMPLEMENTED.** The design system below is fully built and enforced across all screens. All tokens are defined in `constants/` and consumed via `useThemeColors()`, `Typography`, `Spacing`, `Radius`, and `Shadows` exports. No design reskin work remains.

The design system is the single source of truth for every visual decision. No color, font, spacing value, or radius may be used outside of these tokens. This is enforced at the code level via `useThemeColors()`, the typography export, the Radius export, and the Spacing export. Hardcoded values are treated as bugs.

## 3.1 — Color Palette

Color is functional, not decorative. Every color in Fork & Compass communicates a specific meaning and adapts automatically between light and dark mode via the `useThemeColors()` hook. Hex values are never hardcoded in components.

| Token | Light Value | Dark Value | Usage |
|-------|-----------|-----------|-------|
| `primary` | `#9A4100` | `#9A4100` | Interactive elements, CTAs, active states, brand identity |
| `onPrimary` | `#FFFFFF` | `#4A1C00` | Text/icons on primary-colored surfaces |
| `surface` | `#FEF9F3` | `#161412` | Primary background, content area |
| `surfaceContainerLow` | `#F8F3ED` | `#1D1B18` | Cards, elevated containers |
| `surfaceContainerHigh` | `#ECE7E2` | `#2C2926` | Selected states, hover backgrounds |
| `onSurface` | `#1D1B18` | `#F0ECE6` | Primary text, headlines |
| `onSurfaceVariant` | `#564339` | `#D4C4B8` | Secondary text, metadata, captions |
| `secondaryContainer` | `#FFBD9D` | `#683B23` | Soft background accents, badge fills |
| `outline` | `#897267` | `#9D8C82` | Borders, separators |
| `outlineVariant` | `#DDC1B4` | `#514339` | Dividers, card borders, section separators |
| `error` | `#BA1A1A` | `#FFB4AB` | Destructive actions, validation errors |
| `success` | `#2D6A4F` | `#52B788` | Completed states, timer completions |
| `warning` | `#BA7517` | `#EF9F27` | Dietary conflict alerts, caution states |
| `inverseSurface` | `#32302C` | `#F0ECE6` | Inverted backgrounds |
| `inverseOnSurface` | `#F5F0EA` | `#32302C` | Text on inverted backgrounds |
| `overlay` | `rgba(0,0,0,0.55)` | `rgba(0,0,0,0.7)` | Hero gradient overlays, modal scrims |

**Dark Mode Rules:**
- Dark mode is mandatory, not polish. Apple reviewers check it.
- Never use pure black (`#000000`) as a background. Fork & Compass dark surface is `#161412`—a warm near-black with subtle brown undertone that matches the terracotta identity.
- Text hierarchy uses the `onSurface`/`onSurfaceVariant` tokens, which automatically adapt. Never hardcode white text.
- Glass surfaces in dark mode reduce their opacity slightly (0.85 vs 0.70) to maintain the sense of depth without washing out underlying content.

## 3.2 — Typography

Typography is the primary visual structure of the entire interface. All text uses semantic tokens from the Typography export. Raw fontFamily strings are never written in component files.

| Token | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| `displayLarge` | Noto Serif 600 | 44pt / 52lh | SemiBold | Splash screen, onboarding hero |
| `displayMedium` | Noto Serif 600 | 36pt / 44lh | SemiBold | Country hero overlay names |
| `display` | Noto Serif 700 | 28pt / 34lh | Bold | Screen titles, section anchors |
| `headlineLarge` | Noto Serif 600 | 32pt / 40lh | SemiBold | Featured recipe titles |
| `headline` | Noto Serif 700 | 22pt / 28lh | Bold | Section headers, card titles |
| `title` | Noto Serif 500 | 18pt / 24lh | Medium | Recipe names in lists, region names |
| `titleLarge` | Inter 600 | 22pt / 28lh | SemiBold | Large UI labels |
| `titleMedium` | Inter 600 | 17pt / 24lh | SemiBold | Button text, navigation labels |
| `titleSmall` | Inter 600 | 16pt / 22lh | SemiBold | Tab labels, chip text |
| `body` | Inter 400 | 17pt / 26lh | Regular | Recipe instructions, descriptions |
| `bodySmall` | Inter 400 | 14pt / 20lh | Regular | Footnotes, helper text |
| `caption` | Inter 500 | 14pt / 20lh | Medium | Section labels, timestamps |
| `labelLarge` | Inter 500 | 14pt / 20lh | Medium | Category headers, chip labels |
| `labelSmall` | Inter 500 | 13pt / 18lh | Medium | Badges, chip text, tab bar labels |

**Typography Rules:**
- Headlines use Noto Serif for editorial warmth. Body uses Inter for screen-optimized legibility. Never mix these roles.
- Hierarchy is maintained through weight and size contrast, never color alone.
- On dark backgrounds, bump font weight up one level: Regular becomes Medium, Medium becomes SemiBold.

## 3.3 — Spacing Scale

All spacing is based on a strict 4pt/8pt grid. Every margin, padding, and gap value must come from the Spacing export. Arbitrary numbers are treated as bugs.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4pt | Icon-to-label gaps, inner badge padding |
| `sm` | 8pt | Between related items within a group |
| `md` | 16pt | Standard card padding, section margins |
| `lg` | 24pt | Between cards in a list, page horizontal margins |
| `xl` | 32pt | Between major content sections |
| `xxl` | 48pt | Between editorial sections (hero to content) |
| `page` | 20pt | Standard horizontal page margin |

## 3.4 — Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `Radius.sm` | 8pt | Chips, badges, small interactive elements, filter pills |
| `Radius.md` | 12pt | Cards, input fields, list items, recipe thumbnails |
| `Radius.lg` | 16pt | Modals, bottom sheets, large containers, cook mode panels |
| `Radius.xl` | 24pt | Hero image corners, large feature cards |
| `Radius.full` | 9999pt | Avatars, circular buttons, pills, floating action buttons |

Sections are separated by color shifts and generous whitespace, not border lines. This matches the luxury magazine aesthetic.

## 3.5 — Elevation and Shadow System

Shadows use a consistent three-tier system. All shadows use the shadow token for shadowColor, with opacity controlled separately.

| Level | shadowOffset | shadowOpacity | shadowRadius | Usage |
|-------|-------------|--------------|-------------|-------|
| Subtle | {0, 2} | 0.06 | 8 | Cards at rest, list items, non-interactive surfaces |
| Medium | {0, 4} | 0.12 | 12 | Cards on hover/press, floating pills, bottom sheet |
| Prominent | {0, 8} | 0.18 | 24 | Cook mode toolbar, modal sheets, glass overlays |

On dark mode, shadowOpacity increases by 50% to maintain visual separation against dark surfaces.

## 3.6 — Motion and Haptics

All animations respect `useReducedMotion()`. When the OS accessibility setting is enabled, every transition simplifies to an instant crossfade. No exceptions.

| Interaction | Duration | Easing | Haptic |
|------------|----------|--------|--------|
| Button press feedback | 150ms | ease-in (scale 0.97) | UIImpactFeedback .light |
| Primary CTA tap | 200ms | spring (damping: 15) | UIImpactFeedback .medium |
| Cook mode step swipe | 280ms | spring (damping: 18, stiffness: 120) | UIImpactFeedback .medium |
| Timer completion | Instant | N/A | UINotificationFeedback .success |
| Recipe bookmark toggle | 250ms | spring (damping: 12) | UIImpactFeedback .light |
| Bottom sheet present | 400ms | cubic-bezier ease-out | UIImpactFeedback .light |

Cook mode uses `expo-keep-awake` to prevent screen dimming during active cooking sessions. Haptic feedback is purposeful and sparse.

## 3.7 — Touch Targets and Accessibility Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| MIN_TAP_TARGET | 48pt | All interactive elements (exceeds Apple's 44pt minimum) |
| PRIMARY_BUTTON_HEIGHT | 52pt | All primary CTA buttons across the app |
| MIN_ROW_HEIGHT | 56pt | Minimum height for any tappable list row |
| TAB_BAR_HEIGHT | 64pt | Tab bar height including glass padding |
| MIN_INTERACTIVE_GAP | 8pt | Minimum space between adjacent tappable elements |

---

# 4. App Architecture

## 4.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (managed workflow) | SDK 54 |
| Router | expo-router (file-based) | ~6.0.17 |
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

## 4.2 Provider Stack (`app/_layout.tsx`)

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

## 4.3 Navigation Structure

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

## 4.4 Data Layer

- `data/countries.ts` — 8 countries with `id`, `name`, `flag`, `region`, `heroImage`, `cuisineLabel`, `description`
- `data/recipes.ts` — 97 recipes with `id`, `countryId`, `title`, `image`, `category`, `prepTime`, `cookTime`, `servings`, `difficulty`, `ingredients[]`, `steps[]`, `culturalNote`
- Ingredient model: `{ name: string; amount: string; category: Category }` — amount is a **display string** (e.g., "400g", "2 tbsp, freshly cracked"), NOT a numeric value

---

# 5. Screen Feature Specs & Status

## 5.1 Discover (`/(tabs)/index`)

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

## 5.2 Search (`/(tabs)/search`)

**Purpose:** Find recipes by text query and mood filters.

| Feature | Status |
|---------|--------|
| Text search (title + ingredient name matching) | IMPLEMENTED |
| Mood filter chips (7 moods with filter logic) | IMPLEMENTED |
| Two-column recipe grid with images | IMPLEMENTED |
| "ADD +" action on cards | IMPLEMENTED (navigates to recipe detail) |
| Heart/bookmark button on cards | IMPLEMENTED (UI only — not wired to BookmarksContext) |
| HeaderBar (frosted glass) | IMPLEMENTED |

## 5.3 Plan (`/(tabs)/plan`)

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

## 5.4 Grocery (`/(tabs)/grocery`)

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

## 5.5 Cook (`/(tabs)/cook`)

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

## 5.6 Country Detail (`/country/[id]`)

**Purpose:** Deep dive into a country's culinary heritage and recipes.

| Feature | Status |
|---------|--------|
| Hero image with country flag pill | IMPLEMENTED |
| Culinary Heritage description | IMPLEMENTED |
| Signature Recipes list (filtered by countryId) | IMPLEMENTED |
| Back button (GlassView) | IMPLEMENTED |
| "Add to Plan" action | NOT BUILT |

## 5.7 Recipe Detail (`/recipe/[id]`)

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

## 5.8 Cook Mode (`/cook-mode/[id]`)

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

## 5.9 Profile (`/profile`)

**Purpose:** User preferences and app settings.

| Feature | Status |
|---------|--------|
| Dietary preferences | IMPLEMENTED |
| Cooking skill level | IMPLEMENTED |
| Theme picker (system/light/dark) | IMPLEMENTED (wired to ThemeContext) |
| Notification toggles | IMPLEMENTED (UI only) |
| General settings | IMPLEMENTED |

## 5.10 Bookmarks (`/bookmarks`)

**Purpose:** Saved/favorited recipes.

| Feature | Status |
|---------|--------|
| Bookmarked recipe list | IMPLEMENTED |
| Grouped by country | IMPLEMENTED |
| Tap to navigate to Recipe Detail | IMPLEMENTED |
| Remove bookmark | IMPLEMENTED |
| Persistence (AsyncStorage) | IMPLEMENTED |

---

# 6. Major Systems Inventory

## 6.1 ThemeContext — IMPLEMENTED

- **File:** `context/ThemeContext.tsx`
- **State:** `preference: 'system' | 'light' | 'dark'`, `isDark: boolean`
- **Persistence:** AsyncStorage (`@fork_compass_theme`)
- **Consumers:** `useThemePreference()` → `useThemeColors()` hook used by all screens
- **Status:** Fully functional. Theme picker in Profile wired correctly.

## 6.2 BookmarksContext — IMPLEMENTED

- **File:** `context/BookmarksContext.tsx`
- **State:** `bookmarkedIds: string[]`
- **Persistence:** AsyncStorage (`@fork_compass_bookmarks`)
- **Consumers:** `useBookmarks()` → Recipe Detail (heart toggle), Bookmarks screen, RecipeCard
- **Status:** Fully functional. Toggle, persistence, and count all work.
- **Note:** Search screen heart buttons are NOT wired to this context (UI-only).

## 6.3 AppContext / Global Session State — NOT BUILT

No shared context exists for:
- Active cook session (recipe, step, timer)
- Weekly itinerary / meal plan
- Grocery list state (active recipes, servings, checked items)

Each of these is either hardcoded or local to a single screen. Screens cannot communicate session state.

## 6.4 Meal Planning System — UI BUILT, LOGIC NOT WIRED

- Plan tab has full weekly/daily view UI with day selectors, meal time slots, course slots, and week picker
- All data comes from hardcoded constants (`PLANNED_DAYS`, `DAILY_MEALS`, `MOCK_DATES`)
- No state management, no persistence, no add/remove/edit actions
- No `PlanContext` exists

## 6.5 Grocery System — PARTIAL

- Grocery tab builds a deduplicated list from `activeRecipes` (hardcoded to `recipes.slice(0, 4)`)
- Checkboxes work (local `checkedIds` Set state)
- Per-recipe servings adjuster exists but `buildGroceryList()` ignores `servingSizes`
- Ingredient amounts are display strings — no parsing, no scaling, no numeric summation
- State is screen-local: no context, no persistence, no tab badge

## 6.6 Cook Session System — MOSTLY FUNCTIONAL, NO PERSISTENCE

- Cook Mode screen works end-to-end: step navigation, timers, haptics, keep-awake, contextual ingredients
- BUT: no session persistence — leaving the screen resets all state
- Cook tab "Resume Session" card is hardcoded to `recipes[3]`, not a real active session
- No CookingPill floating indicator
- No servings scaler in Cook Mode

## 6.7 Ingredient Amount Parsing — NOT BUILT

- All ingredient amounts are display strings (`"400g"`, `"2 tbsp, freshly cracked"`, `"1 large, diced"`)
- No parsing utility exists to extract numeric values and units
- Servings adjusters in Recipe Detail, Grocery, and Cook Mode are all cosmetic
- This is a foundational gap that blocks scaling, deduplication, and smart grocery totals

---

# 7. Technical Architecture

## 7.1 Component Library

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

## 7.2 File Map

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
├── components/                        # Shared UI components (see 7.1)
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

## 7.3 Persistence

| Data | Storage | Status |
|------|---------|--------|
| Theme preference | AsyncStorage (`@fork_compass_theme`) | IMPLEMENTED |
| Bookmarked recipe IDs | AsyncStorage (`@fork_compass_bookmarks`) | IMPLEMENTED |
| Cook session state | — | NOT BUILT (resets on unmount) |
| Weekly itinerary | — | NOT BUILT (hardcoded) |
| Grocery checked state | — | NOT BUILT (screen-local) |

## 7.4 Platform Compatibility

- Expo SDK 54, managed workflow
- `expo-keep-awake` v15 (compatible with SDK 54)
- `react-native-keyboard-controller` v1.18.5 (compatible with SDK 54)
- Web fallbacks via `Platform.OS === 'web'` in tab bar positioning and GlassView rendering

---

# 8. Accessibility

> Status: **IMPLEMENTED** across all screens. Maintained as a baseline — no regressions allowed.

## 8.1 Interactive Elements

- All `Pressable` components have `accessibilityRole="button"` and descriptive `accessibilityLabel`
- Checkboxes use `accessibilityRole="checkbox"` with `accessibilityState={{ checked }}`
- Toggle groups use `accessibilityState={{ selected }}` for active state

## 8.2 Navigation

- Tab bar items have `tabBarAccessibilityLabel` (e.g., "Discover tab", "Search tab")
- Hero carousel has `accessibilityRole="adjustable"` with dynamic label showing current country
- All back buttons and close buttons have `accessibilityLabel="Go back"` / `"Close"`

## 8.3 Media

- `expo-image` components use `accessible={false}` for decorative images (hero backgrounds, recipe cards)
- Informational images use `accessibilityLabel` with content description (e.g., recipe title)

## 8.4 Haptic Feedback

- Cook Mode: `Haptics.impactAsync(Medium)` on step forward, `Light` on step back
- Cook Mode: `Haptics.notificationAsync(Success)` on timer completion
- Haptics provide non-visual confirmation of actions

## 8.5 Color Contrast

- All text colors meet WCAG contrast ratios against their backgrounds
- `outline` tokens provide sufficient contrast for metadata text
- Interactive elements use terracotta `#9A4100` which meets AA contrast on cream `#FEF9F3`

## 8.6 Deferred Accessibility Items

| Requirement | Standard | Status |
|------------|----------|--------|
| Dynamic Type scaling | All text scales with user preference | Partial — needs verification at largest sizes |
| Touch target audit | Minimum 48pt for all interactive elements | Audit needed before TestFlight |
| Color independence | Never use color as sole indicator of meaning | Needs audit across badges and states |
| Reduce Motion | Simpler transitions when OS setting enabled | Implemented via `useReducedMotion()` |

---

# 9. Execution Roadmap

Applying the Top 10 List Protocol — the Jobsian framework of listing ten priorities and crossing out the bottom seven — Fork & Compass's immediate execution focuses on three things only:

## Priority 1: AppContext — Global State Foundation

**Goal:** Create the shared state layer that all other systems depend on.

**Scope:**
1. **`CookSessionContext`** — tracks active recipe ID, current step index, timer seconds, timer running state, servings override. Persisted to AsyncStorage so sessions survive app restarts.
2. **`PlanContext`** — tracks weekly itinerary as `Record<string, Record<string, string | null>>` (day → mealSlot → recipeId). Persisted to AsyncStorage.
3. **`GroceryContext`** — tracks active recipe IDs, servings overrides per recipe, checked item IDs. Derived grocery list computed via `useMemo`. Persisted to AsyncStorage.

All three contexts wrap the app in `_layout.tsx` alongside existing `ThemeProvider` and `BookmarksProvider`.

**Unblocks:** Everything in P2 and P3.

## Priority 2: Plan → Grocery → Cook Core Loop Wiring

**Goal:** Make the core user journey functional end-to-end.

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

## Priority 3: Cook Mode Polish

**Goal:** Complete the cook mode experience with scaling and session persistence.

**Scope:**
- Servings scaler in Cook Mode top bar (reads from `CookSessionContext`, scales ingredient pill amounts)
- Session auto-save: on step change, persist current step + timer to AsyncStorage
- Session resume: on mount, restore from context (which loaded from AsyncStorage)
- "Finish Cooking" action at last step: clears session, increments XP (stored in future UserProgressContext or AsyncStorage)
- Timer completion notification (local notification or prominent visual alert)

**Depends on:** P1, P2

## On the Horizon (Deferred, Not Forgotten)

- Multi-Course Timeline Coordinator (backward-planning dinner engine)
- Dinner Party feature (guest management, RSVP, dietary conflicts)
- Delivery integration (Instacart, Walmart, Kroger)
- Pantry Inventory (kitchen scanner, auto-subtract from grocery)
- Skill-level adaptive cooking language (First Steps / Home Cook / Chef's Table)
- Search bookmark wiring (heart buttons → BookmarksContext)
- Admin dashboard

---

# 10. Design Rules Checklist

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
