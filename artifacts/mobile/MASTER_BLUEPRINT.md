# FORK & COMPASS

## Master Blueprint V4

**Product Vision · Design System · Glassmorphic UI · Architecture · Systems Roadmap**

*Pick a country, cook a dinner, feel like you traveled.*

Confidential · Version 4.0 · April 2026 · Solo Founder: Kam

voyageapron.com

---

# 1. Product Vision

> Status: **IMPLEMENTED.** The product vision below is fully realized in the current build. All core loop steps (Discover → Recipe → Plan → Grocery → Cook) have working UI screens. 8 countries and 97 recipes with full cultural context are loaded as local mock data.

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

**Glassmorphic Component Specifications:**

| Component | Glass Variant | Blur Radius | Background Opacity | Border |
|-----------|--------------|------------|-------------------|--------|
| Tab Bar | Regular | 20px system | 0.72 | 0.5px top, rgba(255,255,255,0.18) |
| Navigation Bar | Clear | 24px system | 0.65 | None |
| Floating CTA Pill | Regular | 16px | 0.78 | 1px, rgba(255,255,255,0.22) |
| Bottom Sheet Header | Regular | 20px system | 0.72 | 0.5px bottom, rgba(255,255,255,0.12) |
| Cook Mode Toolbar | Clear | 24px | 0.60 | None |
| Timer Overlay | Identity | None | 0.92 solid | None |
| Recipe Card Hover | Regular | 12px | 0.85 | 1px, rgba(255,255,255,0.15) |

> **Current Build Implementation:** The app uses a shared `GlassView` component (`components/GlassView.tsx`) wrapping `expo-blur` `BlurView`. Actual values in `constants/glass.ts`: intensity `32` (light) / `40` (dark); background overlay `rgba(255,255,255,0.7)` (light) / `rgba(29,27,24,0.85)` (dark); specular highlight as `borderTopWidth: 1` with `borderTopColor: rgba(255,255,255,0.4)` (light) / `rgba(255,255,255,0.15)` (dark). Web fallback renders as solid `View` with background color overlay (no BlurView on web).

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

> Status: **IMPLEMENTED.** The design system below is fully built and enforced across all screens. All tokens are defined in `constants/` and consumed via `useThemeColors()`, `Typography`, `Spacing`, `Radius`, and `Shadows` exports. No design reskin work remains. Where the V2 spec values differ from the current codebase implementation, an **Implementation Note** is provided.

The design system is the single source of truth for every visual decision. No color, font, spacing value, or radius may be used outside of these tokens. This is enforced at the code level via `useThemeColors()`, the typography export, the Radius export, and the Spacing export. Hardcoded values are treated as bugs.

## 3.1 — Color Palette

Color is functional, not decorative. Every color in Fork & Compass communicates a specific meaning and adapts automatically between light and dark mode via the `useThemeColors()` hook. Hex values are never hardcoded in components.

| Token | Light Value | Dark Value | Usage |
|-------|-----------|-----------|-------|
| `primary` | `#9A4100` | `#B85A1A` | Interactive elements, CTAs, active states, brand identity |
| `surface` | `#FEF9F3` | `#121110` | Primary background, content area |
| `surfaceContainer` | `#F7F1EA` | `#201E1B` | Cards, elevated containers |
| `surfaceContainerHigh` | `#F5EDDF` | `#252320` | Selected states, hover backgrounds |
| `onSurface` | `#1D1B18` | `#F0ECE6` | Primary text, headlines |
| `onSurfaceVariant` | `#5C5549` | `#A09A90` | Secondary text, metadata, captions |
| `secondaryContainer` | `#FDDCB5` | `#594328` | Soft background accents, badge fills |
| `outlineVariant` | `#E8DFD2` | `#3A3632` | Dividers, card borders, section separators |
| `error` | `#BA1A1A` | `#FFB4AB` | Destructive actions, validation errors |
| `success` | `#2D6A4F` | `#52B788` | Completed states, timer completions |
| `warning` | `#BA7517` | `#EF9F27` | Dietary conflict alerts, caution states |
| `overlay` | `rgba(0,0,0,0.55)` | `rgba(0,0,0,0.65)` | Hero gradient overlays, modal scrims |
| `shadow` | `#000000` | `#000000` | All iOS shadow colors (opacity set separately) |

> **Implementation Note:** The current `constants/colors.ts` has minor deviations from V2 spec values: `primary` dark = `#9A4100` (same as light, not `#B85A1A`); `surface` dark = `#161412` (not `#121110`); `onSurfaceVariant` light = `#564339` / dark = `#D4C4B8`; `secondaryContainer` light = `#FFBD9D` / dark = `#683B23`; `outlineVariant` light = `#DDC1B4` / dark = `#514339`. Additional tokens in codebase: `onPrimary` (`#FFFFFF` / `#4A1C00`), `outline` (`#897267` / `#9D8C82`), `surfaceContainerLow` (`#F8F3ED` / `#1D1B18`), `inverseSurface` (`#32302C` / `#F0ECE6`), `inverseOnSurface` (`#F5F0EA` / `#32302C`).

**Dark Mode Rules:**
- Dark mode is mandatory, not polish. Apple reviewers check it. Broken dark mode is a top cause of App Store rejection.
- Never use pure black (`#000000`) as a background. Fork & Compass dark surface is `#121110`—a warm near-black with subtle brown undertone that matches the terracotta identity. (**Current build:** `#161412`)
- Accent colors (terracotta primary) shift to higher brightness and saturation in dark mode (`#B85A1A`) to maintain visual punch against dark backgrounds. (**Current build:** uses `#9A4100` in both modes)
- Text hierarchy uses the `onSurface`/`onSurfaceVariant` tokens, which automatically adapt. Never hardcode white text.
- Glass surfaces in dark mode reduce their opacity slightly (0.65 vs 0.72) to maintain the sense of depth without washing out underlying content.

## 3.2 — Typography

Typography is the primary visual structure of the entire interface. All text uses semantic tokens from the typography export. Raw fontFamily strings are never written in component files.

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
| `bodyEmphasis` | Inter 500 | 17pt / 26lh | Medium | Ingredient names, day labels |
| `bodySmall` | Inter 400 | 14pt / 20lh | Regular | Footnotes, helper text |
| `caption` | Inter 500 | 14pt / 20lh | Medium | Section labels, timestamps |
| `small` | Inter 500 | 13pt / 18lh | Medium | Badges, chip text, tab bar labels |

**Typography Rules:**
- All text supports Dynamic Type. Every text element scales with the user's accessibility preference. Minimum readable text is 11pt absolute floor; minimum practical text is 13pt (the `small` token).
- Hierarchy is maintained through weight and size contrast, never color alone. A visually impaired user must distinguish headline from body without seeing color.
- Headlines use Noto Serif for editorial warmth. Body uses Inter for screen-optimized legibility. Never mix these roles.
- On dark backgrounds, bump font weight up one level: Regular becomes Medium, Medium becomes SemiBold. This compensates for halation (light text on dark appearing thinner).
- Letter spacing tightens at display sizes (-0.5pt) and loosens at small sizes (+0.5pt), matching the San Francisco optical behavior.
- `NotoSerif_500Medium` must be loaded as a font variant. It is required for the `title` token (recipe names, pull quotes).

## 3.3 — Spacing Scale

All spacing is based on a strict 4pt/8pt grid. Every margin, padding, and gap value in the app must come from the Spacing export. Arbitrary numbers are treated as bugs.

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4pt | Icon-to-label gaps, inner badge padding |
| `sm` | 8pt | Between related items within a group |
| `md` | 16pt | Standard card padding, section margins |
| `lg` | 24pt | Between cards in a list, page horizontal margins |
| `xl` | 32pt | Between major content sections |
| `xxl` | 40pt | Between editorial sections (hero to content) |
| `page` | 24pt | Standard horizontal page margin |

> **Implementation Note:** Current `constants/spacing.ts` has `xxl = 48` (not 40) and `page = 20` (not 24).

## 3.4 — Border Radius

The current build has consolidated border radius to exactly 5 tokens (V2 spec had 6 with `Radius.xs = 4pt`):

| Token | Value | Usage |
|-------|-------|-------|
| `Radius.sm` | 8pt | Chips, badges, small interactive elements, filter pills |
| `Radius.md` | 12pt | Cards, input fields, list items, recipe thumbnails |
| `Radius.lg` | 16pt | Modals, bottom sheets, large containers, cook mode panels |
| `Radius.xl` | 24pt | Hero image corners, large feature cards |
| `Radius.full` | 9999pt | Avatars, circular buttons, pills, floating action buttons |

Sections are separated by color shifts and generous whitespace, not border lines. This matches the luxury magazine aesthetic—editorial layouts breathe. The `outlineVariant` token exists for the rare cases where a subtle divider is needed (grocery category headers, settings groups).

## 3.5 — Elevation and Shadow System

Shadows in Fork & Compass use a consistent three-tier system. All shadows use the shadow token for shadowColor (#000000), with opacity controlled separately via shadowOpacity. This ensures theme-awareness and prevents hardcoded values.

| Level | shadowOffset | shadowOpacity | shadowRadius | Usage |
|-------|-------------|--------------|-------------|-------|
| Subtle | {0, 2} | 0.06 | 8 | Cards at rest, list items, non-interactive surfaces |
| Medium | {0, 4} | 0.12 | 12 | Cards on hover/press, floating pills, bottom sheet |
| Prominent | {0, 8} | 0.18 | 24 | Cook mode toolbar, modal sheets, glass overlays |

On dark mode, shadowOpacity increases by 50% (0.06 becomes 0.09, 0.12 becomes 0.18) to maintain visual separation against dark surfaces. Glass components use an additional inset shadow (see Section 2.4).

## 3.6 — Motion and Haptics

All animations should respect `useReducedMotion()`. When the OS accessibility setting is enabled, every transition simplifies to an instant crossfade. No exceptions.

> **Implementation Note:** `useReducedMotion()` is not yet implemented in app screens/components. This is a deferred accessibility item (see Section 8.6).

| Interaction | Duration | Easing | Haptic |
|------------|----------|--------|--------|
| Button press feedback | 150ms | ease-in (scale 0.97) | UIImpactFeedback .light |
| Primary CTA tap | 200ms | spring (damping: 15) | UIImpactFeedback .medium |
| Navigate forward (list → detail) | 320ms | ease-out (slide-right) | None |
| Navigate back (detail → list) | 320ms | ease-in (slide-left) | None |
| Bottom sheet present | 400ms | cubic-bezier ease-out | UIImpactFeedback .light |
| Bottom sheet dismiss | 300ms | ease-in (slide-down) | None |
| Recipe bookmark toggle | 250ms | spring (damping: 12) | UIImpactFeedback .light |
| Cook mode step swipe | 280ms | spring (damping: 18, stiffness: 120) | UIImpactFeedback .medium |
| Timer completion | Instant | N/A | UINotificationFeedback .success |
| Destructive action confirm | 200ms | ease-out | UINotificationFeedback .warning |
| Toast appear/dismiss | 200ms in, 3s hold, 200ms out | ease-out / ease-in | None |
| Skeleton shimmer | 1.5s loop | ease-in-out | None |
| Pull to refresh | System-managed | System spring | System haptic |

Transitions use react-native-reanimated with spring-based physics. No linear easing ever on visible UI animations.
Cook mode uses `expo-keep-awake` to prevent screen dimming during active cooking sessions.
Haptic feedback is purposeful and sparse. A light tap on bookmark. A medium impact on step advance. A success notification on timer completion. Never continuous or ambient.

## 3.7 — Touch Targets and Accessibility Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| MIN_TAP_TARGET | 48pt | All interactive elements (exceeds Apple's 44pt minimum for comfort) |
| PRIMARY_BUTTON_HEIGHT | 52pt | All primary CTA buttons across the app |
| MIN_ROW_HEIGHT | 56pt | Minimum height for any tappable list row |
| TAB_BAR_HEIGHT | 56pt | Tab bar height including glass padding |
| MIN_INTERACTIVE_GAP | 8pt | Minimum space between adjacent tappable elements |
| MAX_FONT_SCALE | 1.5x | Default maximum Dynamic Type multiplier |
| COOK_MODE_MAX_FONT_SCALE | 2.0x | Cook mode allows larger text for flour-covered hands |

---

# 4. App Architecture

## 4.1 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Expo (managed workflow) | SDK 54 |
| Router | expo-router (file-based) | ~6.0.17 |
| Language | TypeScript | 5.x |
| State | React Context (AppContext + ThemeContext + BookmarksContext) + AsyncStorage | — |
| Images | expo-image | — |
| Effects | expo-blur, expo-linear-gradient | — |
| Haptics | expo-haptics | — |
| Keep Awake | expo-keep-awake | v15 |
| Keyboard | react-native-keyboard-controller | v1.18.5 |
| Gestures | react-native-gesture-handler | — |
| Animations | react-native-reanimated | — |
| Data fetching | @tanstack/react-query | — |
| Splash | expo-splash-screen | — |
| Storage | @react-native-async-storage/async-storage (via `utils/storage.ts`) | — |

## 4.2 Provider Stack (`app/_layout.tsx`)

```
SafeAreaProvider
  └─ ErrorBoundary
       └─ QueryClientProvider
            └─ GestureHandlerRootView
                 └─ ThemeProvider
                      └─ BookmarksProvider
                           └─ AppProvider
                                └─ KeyboardProvider
                                     └─ OnboardingGuard
                                          ├─ <Stack> navigator (RootLayoutNav)
                                          └─ CookingPill (floating indicator)
```

`OnboardingGuard` checks `hasCompletedOnboarding` from AppContext. If the user hasn't completed onboarding, they're redirected to `/onboarding`. Once complete, they're routed to `/(tabs)`.

## 4.3 Navigation Structure

```
Root Stack
├── onboarding           # Onboarding (3-step flow, no gesture back)
├── (tabs)/              # Tab navigator
│   ├── index            # Discover
│   ├── search           # Search
│   ├── plan             # Plan
│   ├── grocery          # Grocery
│   └── cook             # Cook
├── country/[id]         # Country Detail (push)
├── recipe/[id]          # Recipe Detail (push)
├── technique/[id]       # Technique Detail (push)
├── cook-mode/[id]       # Cook Mode (fullScreenModal)
├── dinner-setup         # Dinner Party Setup (push)
├── cooking-schedule     # Multi-Course Cooking Schedule (push)
├── dinner-complete      # Dinner Complete Celebration (push)
├── profile              # Profile & Settings (modal)
└── bookmarks            # Bookmarks (push)
```

## 4.4 Data Layer

- `data/countries.ts` — 8 countries with `id`, `name`, `flag`, `region`, `heroImage`, `cuisineLabel`, `description`
- `data/recipes.ts` — 97 recipes with `id`, `countryId`, `title`, `image`, `category`, `prepTime`, `cookTime`, `servings`, `difficulty`, `ingredients[]`, `steps[]`, `culturalNote`, `nutrition`, `allergens[]`. Each step has `instruction`, `instructionFirstSteps?`, `instructionChefsTable?`, `duration?`. Allergens are auto-detected from ingredient names via `utils/allergens.ts`.
- `data/nutrition.ts` — Per-recipe nutrition data (`calories`, `protein`, `carbs`, `fat`) keyed by recipe ID
- `data/techniques.ts` — Cooking technique articles for the Cook tab technique library
- `data/substitutions.ts` — Ingredient substitution suggestions shown in Recipe Detail
- `data/helpers.ts` — Lookups, `formatCookTime()`, `convertAmount()` (metric/imperial), `getInstructionForLevel()`
- Ingredient model: `{ name: string; amount: string; category: Category; substitutions?: string[] }` — amount is a **display string** (e.g., "400g", "2 tbsp, freshly cracked") parsed numerically by `parseAmountParts()` in AppContext and `parseAmount()` in `utils/groceryScaling.ts`

---

# 5. Screen Feature Specs & Status

## 5.1 Discover (`/(tabs)/index`)

**Purpose:** Immersive entry point showcasing countries and trending recipes.

| Feature | Status |
|---------|--------|
| Hero carousel (8 countries, paginated FlatList, swipeable) | IMPLEMENTED |
| Tappable pagination dots | IMPLEMENTED |
| "Let's Go" CTA → Country Detail | IMPLEMENTED |
| Tonight's Plan strip (conditional: after noon, dismissible per day) | IMPLEMENTED |
| "Cook" CTA on Tonight strip → starts session and opens Cook Mode | IMPLEMENTED |
| Cuisine filter chips (All + per-country, filter recipe grid) | IMPLEMENTED |
| Two-column recipe grid with lazy pagination (+8 on scroll) | IMPLEMENTED |
| Bookmark heart (wired to BookmarksContext) on grid cards | IMPLEMENTED |
| "Add to Plan" overlay button → AddToPlanSheet (date picker) | IMPLEMENTED |
| XP/Level card → Profile | IMPLEMENTED |
| Stats card (recipes cooked, countries explored) | IMPLEMENTED |
| Pull-to-refresh (shuffles grid, advances hero) | IMPLEMENTED |
| `useReducedMotion()` for entry animations | IMPLEMENTED |
| HeaderBar (transparent mode) | IMPLEMENTED |

## 5.2 Search (`/(tabs)/search`)

**Purpose:** Find recipes by text query, mood filters, and allergen exclusions.

| Feature | Status |
|---------|--------|
| Text search (title + ingredient name matching) | IMPLEMENTED |
| Mood filter chips (7 moods with filter logic) | IMPLEMENTED |
| Allergen exclusion filter chips (9 allergens) | IMPLEMENTED |
| User allergen profile awareness (highlights user's allergens) | IMPLEMENTED |
| Two-column recipe grid with images | IMPLEMENTED |
| Bookmark heart (wired to BookmarksContext) on grid cards | IMPLEMENTED |
| "Add to Plan" overlay button → AddToPlanSheet | IMPLEMENTED |
| Empty state with country suggestions | IMPLEMENTED |
| Result count display | IMPLEMENTED |
| HeaderBar (frosted glass) | IMPLEMENTED |

## 5.3 Plan (`/(tabs)/plan`)

**Purpose:** Weekly meal planner with daily/weekly views, real calendar dates, and course slots.

| Feature | Status |
|---------|--------|
| Weekly view with 7-day card list | IMPLEMENTED |
| Daily view with meal time slots (Appetizer/Dinner/Dessert) | IMPLEMENTED |
| Week picker dropdown (This Week / Next Week / Past) | IMPLEMENTED |
| Week navigation arrows (shift ±1 week) | IMPLEMENTED |
| Day selector strip (M–S circles with dots for planned days) | IMPLEMENTED |
| Course slots (Appetizer, Main, Dessert) per day | IMPLEMENTED |
| Multi-meal toggle (daily view) | IMPLEMENTED |
| Tap empty slot → RecipePickerSheet (search + browse + pick) | IMPLEMENTED |
| Add recipe to specific day + course | IMPLEMENTED |
| Remove recipe from day (overlay button + swipe-to-remove) | IMPLEMENTED |
| Swap recipe (overlay button → opens picker for same slot) | IMPLEMENTED |
| Auto-generate week (fill selected days with random recipes) | IMPLEMENTED |
| Quick-gen modal (choose course preference: main only or full) | IMPLEMENTED |
| Undo support (snapshot + restore itinerary + grocery) | IMPLEMENTED |
| Toast notifications (add/remove/undo actions) | IMPLEMENTED |
| First-time plan hint (auto-dismissed on first meal add) | IMPLEMENTED |
| Real calendar dates via `utils/dates.ts` (local timezone) | IMPLEMENTED |
| Persistent itinerary state (AsyncStorage via AppContext) | IMPLEMENTED |
| Two-way plan ↔ grocery sync (add to plan auto-adds grocery) | IMPLEMENTED |
| HeaderBar (frosted glass) | IMPLEMENTED |

## 5.4 Grocery (`/(tabs)/grocery`)

**Purpose:** Smart grocery list aggregated from planned recipes with scaling and manual entry.

| Feature | Status |
|---------|--------|
| Categorized ingredient list (5 categories: produce, protein, dairy, spice, pantry) | IMPLEMENTED |
| Checkbox toggle per ingredient (swipeable rows) | IMPLEMENTED |
| Active recipe source carousel (horizontal cards) | IMPLEMENTED |
| Per-recipe serving stepper (+/- buttons, scales amounts) | IMPLEMENTED |
| Remove recipe from grocery + plan (with undo) | IMPLEMENTED |
| Ingredient deduplication by name with quantity aggregation | IMPLEMENTED |
| Amount parsing (`parseAmountParts`) + unit normalization + aggregation | IMPLEMENTED |
| Serving-aware scaling via `utils/groceryScaling.ts` (`computeScaledAmount`) | IMPLEMENTED |
| Metric/imperial conversion via `convertAmount()` | IMPLEMENTED |
| Manual item entry (text input, auto-categorized) | IMPLEMENTED |
| Online/In-Store toggle (In-Store = checklist, Online = Coming Soon) | IMPLEMENTED |
| Clear checked items | IMPLEMENTED |
| Clear all items (with confirmation alert) | IMPLEMENTED |
| Tab badge for unchecked count (from AppContext in `_layout.tsx`) | IMPLEMENTED |
| Undo/restore with toast (snapshot itinerary + grocery) | IMPLEMENTED |
| First-time grocery hint (auto-dismissed) | IMPLEMENTED |
| Empty state with manual input + "Browse Recipes" CTA | IMPLEMENTED |
| HeaderBar (frosted glass) | IMPLEMENTED |

## 5.5 Cook (`/(tabs)/cook`)

**Purpose:** Cooking hub with active session resume, dinner party awareness, technique library, and XP progress.

| Feature | Status |
|---------|--------|
| Active cook session hero card (reads real session from AppContext) | IMPLEMENTED |
| "Continue Cooking" / "Start Cooking" CTA | IMPLEMENTED |
| Tonight's dinner plan awareness (from AppContext `getTodaysMeals()`) | IMPLEMENTED |
| Dinner party awareness (guest count, RSVP stats, party start) | IMPLEMENTED |
| "Review Party Details" → dinner-setup | IMPLEMENTED |
| Kitchen readiness checklist (3 items, persisted via AppContext) | IMPLEMENTED |
| XP progress bar + level name | IMPLEMENTED |
| Recipes cooked stat (from AppContext `totalRecipesCooked`) | IMPLEMENTED |
| Technique Library horizontal carousel → technique/[id] | IMPLEMENTED |
| "View Saved" → bookmarks | IMPLEMENTED |
| First-time cook hint (auto-dismissed on first session) | IMPLEMENTED |
| Dinner Party card (guests, country theme) | IMPLEMENTED |
| Empty hero state ("Ready when you are") | IMPLEMENTED |
| HeaderBar (frosted glass) | IMPLEMENTED |

## 5.6 Country Detail (`/country/[id]`)

**Purpose:** Deep dive into a country's culinary heritage and recipes.

| Feature | Status |
|---------|--------|
| Hero image with country flag pill | IMPLEMENTED |
| Culinary Heritage description | IMPLEMENTED |
| Signature Recipes list (filtered by countryId) | IMPLEMENTED |
| Back button (GlassView) | IMPLEMENTED |
| "Add to Plan" action on recipe cards | IMPLEMENTED |

## 5.7 Recipe Detail (`/recipe/[id]`)

**Purpose:** Full recipe view with ingredients, steps, cooking CTA, and plan/grocery actions.

| Feature | Status |
|---------|--------|
| Hero image with country flag | IMPLEMENTED |
| Stats row (prep, cook, difficulty, servings) | IMPLEMENTED |
| Servings adjuster (+/- buttons, scales ingredient amounts) | IMPLEMENTED |
| Ingredients grouped by category with checkboxes | IMPLEMENTED |
| Ingredient substitution suggestions (expandable per ingredient) | IMPLEMENTED |
| Step-by-step instructions with durations | IMPLEMENTED |
| Adaptive cooking language (First Steps / Home Cook / Chef's Table) | IMPLEMENTED |
| Cultural Note section | IMPLEMENTED |
| Nutrition info display (calories, protein, carbs, fat) | IMPLEMENTED |
| Allergen warnings with dietary conflict detection | IMPLEMENTED |
| Bookmark toggle (heart icon, wired to BookmarksContext) | IMPLEMENTED |
| "Start Cooking" CTA → starts session in AppContext → Cook Mode | IMPLEMENTED |
| "Add to Plan" sheet (pick day + course type from next 14 days) | IMPLEMENTED |
| "Add to Grocery" action (adds ingredients to AppContext grocery) | IMPLEMENTED |
| Metric/imperial toggle (from AppContext `useMetric`) | IMPLEMENTED |

## 5.8 Cook Mode (`/cook-mode/[id]`)

**Purpose:** Distraction-free step-by-step cooking with timers and session persistence.

| Feature | Status |
|---------|--------|
| Full-screen dark UI | IMPLEMENTED |
| Step instruction display with culinary verb highlighting | IMPLEMENTED |
| Progress bar (step/total) | IMPLEMENTED |
| Countdown timer (per-step durations) | IMPLEMENTED |
| Timer play/pause/reset | IMPLEMENTED |
| Timer state persistence (activeTimerStart/Duration in AppContext) | IMPLEMENTED |
| Contextual ingredient pills (matched to current step) | IMPLEMENTED |
| Previous/Next step navigation (buttons) | IMPLEMENTED |
| Haptic feedback (step changes, timer completion) | IMPLEMENTED |
| Keep-awake (screen stays on via expo-keep-awake) | IMPLEMENTED |
| Session persistence (survives app restart via AppContext + AsyncStorage) | IMPLEMENTED |
| Session resume (auto-restores step + timer on re-open) | IMPLEMENTED |
| "Finish Cooking" at last step → complete session, award XP, add passport stamp | IMPLEMENTED |
| Metric/imperial conversion on ingredient pills | IMPLEMENTED |
| Swipe gestures for step navigation | NOT BUILT — button-based prev/next only |
| Servings scaler in cook mode UI | NOT BUILT |

## 5.9 Onboarding (`/onboarding`)

**Purpose:** 3-step personalization flow for new users.

| Feature | Status |
|---------|--------|
| Step 1: Name + avatar selection (7 avatar options) | IMPLEMENTED |
| Step 2: Dietary preferences (6 options, multi-select) | IMPLEMENTED |
| Step 3: Cooking level (beginner / home_cook / chef) | IMPLEMENTED |
| Progress dots | IMPLEMENTED |
| Back navigation between steps | IMPLEMENTED |
| Sets `hasCompletedOnboarding` in AppContext on finish | IMPLEMENTED |
| Persists all preferences to AsyncStorage | IMPLEMENTED |
| OnboardingGuard in `_layout.tsx` redirects new users here | IMPLEMENTED |

## 5.10 Dinner Setup (`/dinner-setup`)

**Purpose:** Create and manage a dinner party — guests, menu, timing.

| Feature | Status |
|---------|--------|
| Create dinner party (auto-sets date, country, title) | IMPLEMENTED |
| Add/remove guests (name, phone, dietary restrictions, allergens) | IMPLEMENTED |
| Guest avatar initials | IMPLEMENTED |
| RSVP status tracking (pending/accepted/maybe/declined) | IMPLEMENTED |
| Dietary conflict detection (warns about menu vs guest restrictions) | IMPLEMENTED |
| Phone number formatting | IMPLEMENTED |
| Share invite via system share sheet | IMPLEMENTED |
| Menu display (appetizer/main/dessert from plan) | IMPLEMENTED |
| Target serving time configuration | IMPLEMENTED |
| Cuisine country theming | IMPLEMENTED |
| "Start Cooking" → sets party status to 'cooking', starts cook session | IMPLEMENTED |
| Guest count summary | IMPLEMENTED |
| Actual SMS/Twilio integration | NOT BUILT (uses system share sheet as placeholder) |

## 5.11 Cooking Schedule (`/cooking-schedule`)

**Purpose:** Multi-course timeline view for dinner parties.

| Feature | Status |
|---------|--------|
| Timeline event cards (active, passive, transition, finish) | IMPLEMENTED |
| Start time → target time display | IMPLEMENTED |
| Event type icons and color coding | IMPLEMENTED |
| Materials list per event | IMPLEMENTED |
| Duration display per event | IMPLEMENTED |
| "Start Cooking" CTA → activates dinner plan | IMPLEMENTED |
| Reads from `pendingDinnerPlan` / `activeDinnerPlan` in AppContext | IMPLEMENTED |
| Full backward-planning algorithm refinement | PARTIAL — basic timeline engine built, edge cases remain |

## 5.12 Dinner Complete (`/dinner-complete`)

**Purpose:** Celebration screen after completing a dinner party.

| Feature | Status |
|---------|--------|
| Animated passport stamp celebration | IMPLEMENTED |
| Country flag and name display | IMPLEMENTED |
| Guest list recap (accepted guests) | IMPLEMENTED |
| Courses cooked count | IMPLEMENTED |
| First-party badge ("Your first dinner party!") | IMPLEMENTED |
| `useReducedMotion()` for celebration animations | IMPLEMENTED |
| XP award and passport stamp | IMPLEMENTED |

## 5.13 Technique Detail (`/technique/[id]`)

**Purpose:** Cooking technique article with step-by-step instructions and related recipes.

| Feature | Status |
|---------|--------|
| Hero image with technique title | IMPLEMENTED |
| Difficulty badge (beginner/intermediate/advanced) | IMPLEMENTED |
| Category icon and duration | IMPLEMENTED |
| Step-by-step instructions | IMPLEMENTED |
| Pro tips section | IMPLEMENTED |
| Related recipes (RecipeCard links) | IMPLEMENTED |

## 5.14 Profile (`/profile`)

**Purpose:** User preferences and app settings.

| Feature | Status |
|---------|--------|
| Display name + avatar | IMPLEMENTED |
| Cooking level selection | IMPLEMENTED |
| Dietary preferences | IMPLEMENTED |
| Theme picker (system/light/dark, wired to ThemeContext) | IMPLEMENTED |
| Metric/Imperial toggle | IMPLEMENTED |
| Notification toggles | IMPLEMENTED (UI only) |
| General settings | IMPLEMENTED |

## 5.15 Bookmarks (`/bookmarks`)

**Purpose:** Saved/favorited recipes.

| Feature | Status |
|---------|--------|
| Bookmarked recipe list | IMPLEMENTED |
| Grouped by country | IMPLEMENTED |
| Tap to navigate to Recipe Detail | IMPLEMENTED |
| Remove bookmark | IMPLEMENTED |
| Persistence (AsyncStorage via BookmarksContext) | IMPLEMENTED |

---

# 6. Major Systems Inventory

## 6.1 AppContext — IMPLEMENTED

- **File:** `context/AppContext.tsx` (1292 lines)
- **Unified Provider:** Single `AppProvider` wrapping the app, consolidating itinerary, grocery, cook session, preferences, XP/history, dinner parties, dinner plans, and kitchen checks
- **State Domains:**
  - Itinerary: `ItineraryDay[]` with `courses: { appetizer?, main?, dessert? }`, `date`, `dayLabel`, `hasDinnerParty`
  - Grocery: `GroceryItem[]` with `id`, `name`, `amount`, `unit`, `category`, `recipeNames[]`, `sourceAmounts`, `checked`, `excluded`
  - Cook Session: `CookSession | null` with `recipeId`, `currentStepIndex`, `completedSteps`, `servings`, `activeTimerStart`, `activeTimerDuration`, `status`
  - Preferences: `cookingLevel`, `coursePreference`, `groceryPartner`, `zipCode`, `useMetric`, `dietaryFlags`, `allergens`, `hasCompletedOnboarding`, `displayName`, `avatarId`
  - History: `totalRecipesCooked`, `xp`, `level`, `passportStamps`
  - Dinner Parties: `DinnerParty[]` with full CRUD, guest management, RSVP tracking, dietary conflict detection
  - Dinner Plan: `pendingDinnerPlan`, `activeDinnerPlan`, `currentDinnerEventIndex`
  - Kitchen Checks: `boolean[]` (3-item checklist)
- **Persistence:** All state persisted to AsyncStorage via `utils/storage.ts` abstraction. Hydration on mount with `isHydrated` flag. Auto-persist via `useEffect` watchers.
- **Helper Functions:** `parseAmountParts()`, `normalizeUnit()`, `aggregateAmounts()`, `formatQty()`, `categorizeIngredient()`, `ingredientStableId()`, `recipeToPlannedMeal()`, `makeEmptyDay()`
- **Consumers:** `useApp()` hook used by all screens

## 6.2 ThemeContext — IMPLEMENTED

- **File:** `context/ThemeContext.tsx`
- **State:** `preference: 'system' | 'light' | 'dark'`, `isDark: boolean`
- **Persistence:** AsyncStorage (`@fork_compass_theme`)
- **Consumers:** `useThemePreference()` → `useThemeColors()` hook used by all screens
- **Status:** Fully functional. Theme picker in Profile wired correctly.

## 6.3 BookmarksContext — IMPLEMENTED

- **File:** `context/BookmarksContext.tsx`
- **State:** `bookmarkedIds: string[]` (defaults to 5 seeded bookmarks)
- **Persistence:** AsyncStorage (`@fork_compass_bookmarks`)
- **Consumers:** `useBookmarks()` → Discover (grid cards), Search (grid cards), Recipe Detail (hero heart), Country Detail, Bookmarks screen
- **Haptics:** Light impact on toggle
- **Status:** Fully functional. Toggle, persistence, count, and haptics all work. Wired across all recipe-displaying screens.

## 6.4 Meal Planning System — IMPLEMENTED

- **State:** `itinerary: ItineraryDay[]` in AppContext with real calendar dates
- **Features:**
  - Real calendar dates via `utils/dates.ts` (local timezone, not UTC)
  - Course slots: appetizer, main, dessert per day
  - Add recipe to specific day + course type
  - Remove recipe from day
  - Swap recipe (remove + open picker for same slot)
  - Auto-generate week (fill selected dates with random recipes from pool)
  - Week navigation: this week / next week / past, ±1 week arrows
  - Daily and weekly views with smooth toggle
  - Day selector strip (M–S) with visual indicators (planned dot, today ring)
  - `RecipePickerSheet` component (search, browse, select)
  - Undo support (snapshot itinerary + grocery before action, restore on undo)
  - Two-way sync: adding to plan auto-adds to grocery, removing from grocery orphan-checks plan
  - 28-day cleanup on hydration (removes old entries)
- **Persistence:** AsyncStorage (`@fork_compass_itinerary`)

## 6.5 Grocery System — IMPLEMENTED

- **State:** `groceryItems: GroceryItem[]` in AppContext
- **Features:**
  - Two-way sync with plan: adding recipe to plan auto-populates grocery, removing recipe source from grocery removes from plan
  - Ingredient deduplication by stable ID (`ingredientStableId`)
  - Quantity aggregation: `parseAmountParts()` extracts `{ qty, unit }`, `normalizeUnit()` standardizes units (g/gram/grams → g), `aggregateAmounts()` sums compatible units (including g↔kg, ml↔l cross-conversion)
  - Per-recipe serving scaling: `utils/groceryScaling.ts` → `computeScaledAmount(originalAmount, baseServings, targetServings)` handles fractions, mixed numbers, ranges
  - Metric/imperial conversion: `convertAmount()` in `data/helpers.ts` (g↔oz, kg↔lb, ml↔fl oz, l↔cups, etc.)
  - Manual item entry with auto-categorization
  - Recipe source carousel with per-recipe serving steppers
  - 5-category grouping: produce, protein, dairy, spice, pantry
  - In-store checklist mode with swipe-to-remove (Swipeable from react-native-gesture-handler)
  - Online tab shows "Coming Soon" with retailer cards
  - Clear checked items, clear all with confirmation
  - Undo/restore (snapshot + toast)
  - Tab badge showing unchecked count (wired in `_layout.tsx`)
- **Persistence:** AsyncStorage (`@fork_compass_grocery`)

## 6.6 Cook Session System — IMPLEMENTED

- **State:** `activeCookSession: CookSession | null` in AppContext
- **Features:**
  - Start session: creates `CookSession` with recipe info, step count, servings
  - Advance/previous step: updates `currentStepIndex`, tracks `completedSteps`
  - Timer: `activeTimerStart` (ISO string) + `activeTimerDuration` (seconds), restored from elapsed time on re-open
  - Complete session: clears session, increments `totalRecipesCooked`, awards XP (`xp += 50`), adds passport stamp
  - Resume: `resumeCookSession()` returns persisted session from AsyncStorage
  - Cook tab reads real `activeCookSession` for hero card and CTA
  - CookingPill floating indicator: renders above tab bar when session active, shows recipe name + step progress, tappable → Cook Mode. Hidden when already in Cook Mode.
- **Persistence:** AsyncStorage (`@fork_compass_cook_session`)
- **Missing:** Swipe gesture navigation for steps, servings scaler in Cook Mode UI

## 6.7 Ingredient Amount Parsing — IMPLEMENTED

- **AppContext helpers:**
  - `parseAmountParts(amount)` → `{ qty: number, unit: string } | null` — extracts numeric value and unit from display strings like "400g", "2 tbsp", "1/2 tsp"
  - `normalizeUnit(u)` → canonical unit string (handles plurals, abbreviations)
  - `aggregateAmounts(a, b)` → summed amount string with cross-unit conversion (g↔kg, ml↔l)
  - `formatQty(n)` → clean display number
- **`utils/groceryScaling.ts`:**
  - `computeScaledAmount(originalAmount, baseServings, targetServings)` → scaled amount string
  - Handles fractions ("1/2"), mixed fractions ("1 1/2"), ranges ("3-4"), plain numbers
- **`data/helpers.ts`:**
  - `convertAmount(amount, toMetric)` → metric/imperial conversion with 7 conversion rules

## 6.8 Adaptive Cooking Language — IMPLEMENTED

- All 97 recipes have three instruction tiers per step:
  - `instruction` — Home Cook (default)
  - `instructionFirstSteps` — First Steps (beginner-friendly, more detailed)
  - `instructionChefsTable` — Chef's Table (technical, concise)
- `getStepInstruction(step, level)` in Recipe Detail and `getInstructionForLevel(step, level)` in `data/helpers.ts` select the appropriate instruction based on user's `cookingLevel` from AppContext
- Skill level set during onboarding and adjustable in Profile
- Culinary verb highlighting in instructions via `utils/textFormatting.ts`

## 6.9 Nutrition & Allergen System — IMPLEMENTED

- **Nutrition:** `data/nutrition.ts` provides per-recipe `NutritionInfo` (calories, protein, carbs, fat). Injected into recipe objects at build time. Displayed in Recipe Detail.
- **Allergens:** `utils/allergens.ts` with:
  - 9 allergen types (milk, egg, fish, shellfish, tree_nuts, peanuts, wheat, soy, sesame)
  - `detectAllergens(ingredients)` — keyword-based allergen detection from ingredient names (auto-applied to all 97 recipes)
  - `getDietaryConflicts(recipeAllergens, userDietaryFlags)` — checks recipe allergens against user's dietary profile
  - `ALLERGEN_INFO` — labels, icons, and colors for allergen UI
- Search screen allergen exclusion filter (exclude recipes containing specific allergens)
- Recipe Detail shows allergen warnings and dietary conflict badges

## 6.10 Dinner Party System — PARTIALLY IMPLEMENTED

- **Types:** `types/dinnerParty.ts` — `DinnerParty`, `DinnerGuest`, `DinnerPartyMenu`, `DietaryConflict`
- **AppContext CRUD:** Full lifecycle management:
  - `createDinnerParty()`, `updateDinnerParty()`, `cancelDinnerParty()`
  - `addGuest()`, `removeGuest()`, `updateGuestRsvp()`
  - `getDinnerPartyForDate()`, `getActiveDinnerParty()`, `getGuestCount()`
  - `startDinnerPartyCooking()` — sets status to 'cooking'
  - `completeDinnerParty()` — sets status to 'completed'
  - `checkDietaryConflicts()` — cross-references guest restrictions with menu recipes
- **UI:** Dinner Setup screen built (guest management, phone formatting, share invites, menu display, serving time, RSVP tracking). Dinner Complete celebration screen with animated passport stamp.
- **Cook Tab Integration:** Dinner party awareness — shows party card, guest counts, RSVP stats, "Review Party Details" CTA
- **Persistence:** AsyncStorage (`@fork_compass_dinner_parties`)
- **Missing:** Actual SMS/Twilio integration (uses system share sheet), live status view for guests

## 6.11 Multi-Course Timeline — PARTIALLY IMPLEMENTED

- **Types:** `types/kitchen.ts` — `TimelineEvent`, `DinnerPlan`, `CookConfig`, `EventType`
- **Timeline Engine:** `utils/timelineEngine.ts` (264 lines) — `buildDinnerTimeline(recipes, targetTime, config)`:
  - Step duration estimation based on instruction keywords
  - Passive step detection (simmer, roast, bake, marinate, etc.)
  - Active/passive/transition/finish event types
  - Backward planning from target time
  - Buffer minutes between dishes
- **UI:** Cooking Schedule screen built — timeline cards for each event type, start/target time display, "Start Cooking" CTA
- **AppContext:** `pendingDinnerPlan`, `activeDinnerPlan`, `currentDinnerEventIndex`, `createDinnerPlan()`, `startDinnerPlan()`, `advanceDinnerStep()`, `completeDinnerPlan()`
- **Persistence:** AsyncStorage (`@fork_compass_dinner_plan`)
- **Missing:** Full backward-planning algorithm refinement for edge cases, integration with real cook mode (stepping through timeline events in Cook Mode)

## 6.12 Cook Readiness Engine — IMPLEMENTED

- **File:** `utils/cookReadiness.ts`
- **Purpose:** State machine that calculates cook readiness based on today's meals, active session, grocery progress, and time until dinner
- **States:** `hidden`, `now_cooking`, `groceries_needed`, `almost_ready`, `planned_early`, `good_timing`, `time_to_start`, `running_late`, `dinner_passed`
- **Dinner Party Awareness:** Adjusts urgency and copy for dinner party context (guest count, serving time)
- **Output:** Headline, CTA text, CTA style, start/serving time labels, grocery progress

## 6.13 Delivery Integration — DEFERRED

- Online tab in Grocery screen shows retailer cards (Instacart, Walmart, Amazon Fresh) with "Coming Soon" messaging
- No actual API integration

## 6.14 Auth & Subscriptions — DEFERRED

- No auth, no user accounts, no subscription checks
- All data is local (AsyncStorage)

---

# 7. Technical Architecture

## 7.1 Component Library

| Component | File | Purpose |
|-----------|------|---------|
| GlassView | `components/GlassView.tsx` | Frosted glass container with specular top-edge highlight |
| HeaderBar | `components/HeaderBar.tsx` | Shared header: transparent (Discover) or frosted glass (others) |
| RecipeCard | `components/RecipeCard.tsx` | Grid card: image, title, metadata, bookmark icon |
| DestinationCard | `components/DestinationCard.tsx` | Country card: image, flag, name |
| RecipePickerSheet | `components/RecipePickerSheet.tsx` | Bottom sheet: search + browse + select recipe for plan slot |
| AddToPlanSheet | `components/AddToPlanSheet.tsx` | Bottom sheet: pick day + course to add recipe to plan |
| PressableScale | `components/PressableScale.tsx` | Animated pressable with scale feedback |
| AnimatedHeart | `components/AnimatedHeart.tsx` | Heart/bookmark toggle with spring animation |
| AnimatedListItem | `components/AnimatedListItem.tsx` | Staggered fade-in for list items |
| Checkbox | `components/Checkbox.tsx` | Custom checkbox with theme-aware styling |
| CookingPill | `components/CookingPill.tsx` | Floating pill above tab bar showing active cook session |
| SmartCookBar | `components/SmartCookBar.tsx` | Context-aware cooking action bar |
| ErrorBoundary | `components/ErrorBoundary.tsx` | React error boundary wrapper |
| ErrorFallback | `components/ErrorFallback.tsx` | Fallback UI for caught errors |

## 7.2 File Map

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx                    # Root layout: providers, OnboardingGuard, CookingPill
│   ├── +not-found.tsx                 # 404 screen
│   ├── onboarding.tsx                 # 3-step onboarding (name/avatar, diet, cooking level)
│   ├── dinner-setup.tsx               # Dinner party creation & guest management
│   ├── cooking-schedule.tsx           # Multi-course timeline view
│   ├── dinner-complete.tsx            # Post-dinner celebration with passport stamp
│   ├── profile.tsx                    # Profile & Settings (modal)
│   ├── bookmarks.tsx                  # Bookmarks (push)
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Tab navigator: floating glass pill bar, grocery badge
│   │   ├── index.tsx                  # Discover: hero carousel, recipe grid, XP stats
│   │   ├── search.tsx                 # Search: text + mood + allergen filters
│   │   ├── plan.tsx                   # Plan: weekly/daily calendar, RecipePickerSheet, undo
│   │   ├── grocery.tsx                # Grocery: categorized list, scaling, manual entry, undo
│   │   └── cook.tsx                   # Cook: session resume, dinner party, techniques, XP
│   ├── country/[id].tsx               # Country Detail
│   ├── recipe/[id].tsx                # Recipe Detail: ingredients, steps, plan/grocery actions
│   ├── technique/[id].tsx             # Technique article with steps and related recipes
│   └── cook-mode/[id].tsx             # Cook Mode: step-by-step, timer, session persistence
├── components/
│   ├── GlassView.tsx                  # Frosted glass container
│   ├── HeaderBar.tsx                  # Shared header bar
│   ├── RecipeCard.tsx                 # Recipe grid card
│   ├── DestinationCard.tsx            # Country card
│   ├── RecipePickerSheet.tsx          # Recipe selection bottom sheet
│   ├── AddToPlanSheet.tsx             # Date/course picker for adding to plan
│   ├── PressableScale.tsx             # Animated scale pressable
│   ├── AnimatedHeart.tsx              # Bookmark heart toggle
│   ├── AnimatedListItem.tsx           # Staggered list entry animation
│   ├── Checkbox.tsx                   # Custom checkbox
│   ├── CookingPill.tsx                # Floating active session indicator
│   ├── SmartCookBar.tsx               # Context-aware cook action bar
│   ├── ErrorBoundary.tsx              # Error boundary
│   └── ErrorFallback.tsx              # Error fallback UI
├── constants/
│   ├── colors.ts                      # Color palette (light/dark tokens)
│   ├── typography.ts                  # Typography tokens
│   ├── spacing.ts                     # Spacing scale
│   ├── radius.ts                      # Border radius tokens
│   ├── shadows.ts                     # Shadow system (subtle/medium/prominent)
│   ├── glass.ts                       # Glass effect values
│   ├── icons.ts                       # Overlay button constants
│   └── motion.ts                      # Animation constants
├── context/
│   ├── AppContext.tsx                  # Global state: itinerary, grocery, cook, prefs, XP, parties
│   ├── ThemeContext.tsx                # Theme preference (system/light/dark)
│   └── BookmarksContext.tsx            # Bookmark state
├── data/
│   ├── countries.ts                   # 8 countries
│   ├── recipes.ts                     # 97 recipes (with auto-detected allergens + nutrition)
│   ├── nutrition.ts                   # Per-recipe nutrition data
│   ├── techniques.ts                  # Cooking technique articles
│   ├── substitutions.ts               # Ingredient substitutions
│   ├── helpers.ts                     # Lookups, formatting, unit conversion
│   ├── maps.ts                        # Map data
│   └── index.ts                       # Data barrel exports
├── hooks/
│   ├── useThemeColors.ts              # Theme-aware color accessor
│   └── useRecipeData.ts               # Recipe data hook
├── types/
│   ├── dinnerParty.ts                 # DinnerParty, DinnerGuest, DietaryConflict types
│   └── kitchen.ts                     # TimelineEvent, DinnerPlan, CookConfig types
├── utils/
│   ├── storage.ts                     # AsyncStorage abstraction (get/set/remove)
│   ├── dates.ts                       # Local timezone date helpers
│   ├── groceryScaling.ts              # Ingredient amount scaling
│   ├── allergens.ts                   # Allergen detection + dietary conflict checking
│   ├── timelineEngine.ts              # Multi-course backward-planning timeline
│   ├── textFormatting.ts              # Culinary verb highlighting
│   └── cookReadiness.ts              # Cook readiness state machine
├── FLOW_MAP.md                        # Screen flow documentation
└── MASTER_BLUEPRINT.md                # This file
```

## 7.3 Persistence

| Data | Storage Key | Status |
|------|-------------|--------|
| Theme preference | `@fork_compass_theme` (ThemeContext) | IMPLEMENTED |
| Bookmarked recipe IDs | `@fork_compass_bookmarks` (BookmarksContext) | IMPLEMENTED |
| Weekly itinerary | `@fork_compass_itinerary` (AppContext) | IMPLEMENTED |
| Grocery items | `@fork_compass_grocery` (AppContext) | IMPLEMENTED |
| Cook session state | `@fork_compass_cook_session` (AppContext) | IMPLEMENTED |
| User preferences | `@fork_compass_preferences` (AppContext) | IMPLEMENTED |
| History / XP | `@fork_compass_history` (AppContext) | IMPLEMENTED |
| Dinner plan + event index | `@fork_compass_dinner_plan` (AppContext) | IMPLEMENTED |
| Dinner parties | `@fork_compass_dinner_parties` (AppContext) | IMPLEMENTED |
| Kitchen check state | `@fork_compass_kitchen_check` (AppContext) | IMPLEMENTED |
| Auto-gen hint seen | `@fork_compass_autogen_seen` (AsyncStorage direct) | IMPLEMENTED |
| First-time hints (plan, grocery, cook) | `@fork_compass_hint_*_seen` (AsyncStorage direct) | IMPLEMENTED |
| Tonight strip dismissed | `@fork_compass_tonight_dismissed_*` (AsyncStorage direct) | IMPLEMENTED |

AppContext persistence flows through `utils/storage.ts`, a thin abstraction over `@react-native-async-storage/async-storage` designed for a future swap to MMKV. A handful of lightweight flags (hint dismissals, tonight-strip dismissal) use `AsyncStorage` directly for simplicity. ThemeContext and BookmarksContext also use `AsyncStorage` directly (predating the `Storage` abstraction).

## 7.4 Platform Compatibility

- Expo SDK 54, managed workflow
- `expo-keep-awake` v15 (compatible with SDK 54)
- `react-native-keyboard-controller` v1.18.5 (compatible with SDK 54)
- Web fallbacks via `Platform.OS === 'web'` in tab bar positioning and GlassView rendering
- `GlassView` web fallback renders as solid `View` with background color overlay (no BlurView on web)

## 7.5 API Server

- **File:** `artifacts/api-server/src/index.ts` — Fastify server bound to `PORT` env var
- **Current State:** Health check endpoint only (`GET /healthz`)
- **OpenAPI Spec:** `lib/api-spec/openapi.yaml` — defines `HealthStatus` schema
- **Database Schema:** `lib/db/src/schema/index.ts` — empty (commented templates for Drizzle tables)
- **Status:** Scaffolded, not yet functional beyond health check

---

# 8. Accessibility

> Status: **PARTIALLY IMPLEMENTED.** Core accessibility patterns are in place across all screens. Several items require audit before TestFlight submission.

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
| VoiceOver labels | Every interactive element has a descriptive accessibility label | Audit needed — most elements covered, completeness unverified |
| Dynamic Type scaling | All text scales with user preference; tested at largest size | Partial — needs verification at extreme sizes |
| Touch target audit | Minimum 48pt for all interactive elements | Audit needed before TestFlight |
| Color independence | Never use color as sole indicator of meaning | Needs audit across badges and states |
| Reduce Motion | Simpler transitions when OS setting enabled | NOT BUILT — `useReducedMotion()` not yet wired into screens/components |
| Nielsen heuristics scorecard | 20 criteria (Pass/Partial/Fail) | Not yet scored against current build |

---

# 9. Execution Roadmap

> The original V3 roadmap (P1: AppContext, P2: Plan→Grocery→Cook wiring, P3: Cook Mode polish) is **CORE COMPLETE**. All three priorities have been implemented end-to-end. Two polish items remain from P3: swipe gesture navigation in Cook Mode and a servings scaler in Cook Mode UI. The roadmap below addresses these remaining gaps and defines the next phase.

Applying the Top 10 List Protocol — the Jobsian framework of listing ten priorities and crossing out the bottom seven — Fork & Compass's immediate execution focuses on three things only:

## Priority 1: Cook Mode Polish

**Goal:** Complete the cook mode experience with the remaining UX features.

**Scope:**
1. **Swipe gesture navigation** — Add `GestureDetector` with horizontal pan gesture for step navigation. Spring animation (280ms, damping: 18, stiffness: 120) with medium haptic on step change. Must coexist with scroll for long instruction text.
2. **Servings scaler in Cook Mode** — Top bar control that reads from session, updates `servings` in `CookSession`, and scales contextual ingredient pill amounts in real time.
3. **CookingPill refinement** — Currently functional. Polish: add pulse animation when timer is active, show timer countdown on pill.

**Unblocks:** TestFlight-ready cook experience.

## Priority 2: Backend & Data Migration

**Goal:** Move from local mock data to server-served data with user accounts.

**Scope:**
1. **API server buildout** — Expand `artifacts/api-server` beyond health check. Add Fastify routes for recipes, countries, user data.
2. **Database schema** — Define Drizzle tables in `lib/db/src/schema/`: users, recipes, meal_plans, grocery_lists, cook_sessions, dinner_parties. Migrate recipe data from `data/recipes.ts` to PostgreSQL.
3. **Authentication** — User accounts (email/password or social auth). Replace local AsyncStorage persistence with server-synced state.
4. **Data sync** — `@tanstack/react-query` already installed. Wire up queries to fetch from API instead of local imports.

**Depends on:** P1 (polish first, then migrate)

## Priority 3: Production Readiness

**Goal:** Prepare for App Store submission and TestFlight.

**Scope:**
1. **Reduce Motion support** — Wire `useReducedMotion()` into all remaining animated components (currently only in tab bar, Discover, and dinner-complete). Every animated transition should respect the OS accessibility setting.
2. **Accessibility audit** — Full VoiceOver walkthrough, Dynamic Type at maximum scale, touch target verification (48pt minimum), color independence check.
3. **Performance optimization** — Lazy-load heavy modules (recipe data, technique data). Embed fonts (currently loaded via Google Fonts at runtime). Code-split large screens.
4. **App icon** — Design app icon for Liquid Glass era (translucent material, dynamic color).

**Depends on:** P2 (ship on real backend)

## On the Horizon (Deferred, Not Forgotten)

- **Delivery integration** — Instacart, Walmart, Amazon Fresh API integration for grocery ordering. Currently UI placeholder only.
- **Pantry Inventory** — Track what the user already has at home. Auto-subtract from grocery lists. Camera scanning via `expo-camera`.
- **SMS/Twilio for dinner parties** — Replace system share sheet with direct SMS invites and RSVP link tracking.
- **Timeline engine refinement** — Full backward-planning algorithm with parallel cooking tracks, equipment conflict detection, and real Cook Mode integration.
- **Admin dashboard** — Next.js admin panel (admin.forkandcompass.app) for recipe management, user analytics, content moderation.
- **RevenueCat premium tier** — Subscription gating for advanced features (dinner party hosting, chef-level techniques, expanded country catalog).
- **Expanded country catalog** — Beyond the initial 8 countries. Add Southeast Asia, South America, Middle East, Africa.
- **Social features** — Share completed dinners, follow friends' cooking journeys, dinner party photo galleries.

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
