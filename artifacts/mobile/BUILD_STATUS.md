# Fork & Compass — Build Status Report

**Last Updated:** April 7, 2026
**Comparison:** V1 Blueprint Vision vs Current Build Reality

---

## Executive Summary

The app has **12 screens**, **3 context systems**, **8 shared components**, and a **complete design system**. The core loop — Discover → Plan → Grocery → Cook → Progress — is structurally wired end-to-end through AppContext. Most features that the blueprint marked as "NOT BUILT" have since been implemented.

| Category | Total Features | Fully Working | Partial / Visual Only | Not Built |
|----------|---------------|---------------|----------------------|-----------|
| Screens & Navigation | 12 | 12 | 0 | 0 |
| Core Loop (Plan→Grocery→Cook) | 1 loop | Connected | Scaling missing | — |
| Context Systems | 3 needed | 3 built | — | 0 |
| Design System | All tokens | All implemented | — | 0 |
| Accessibility | 6 areas | 4 solid | 2 need audit | 0 |
| Deferred Systems | 7 | 0 | 0 | 7 (by design) |

---

## Part 1: What's Fully Built & Working

### Core Loop — End to End
| Step | What Works | How It's Connected |
|------|-----------|-------------------|
| **Discover** | Hero carousel (5 countries), Tonight's Plan (reads today's itinerary), Trending Bites with "Tonight"/"Week" quick-add | → Country Detail, → Cook Mode, → Plan (via day picker modal) |
| **Plan** | Weekly/Daily views, week navigation with arrows, today indicator (blue), recipe picker sheet, add/remove meals, auto-generate week, dinner party toggle, course slots (appetizer/main/dessert) | → Grocery (auto-adds ingredients), → Recipe Detail |
| **Grocery** | Auto-generated from planned meals, categorized checklist, toggle items, remove recipe's ingredients, clear completed/all, online/in-store toggle, retailer selector | ← Plan (ingredients flow in automatically) |
| **Cook** | Kitchen reputation (XP/level from real data), active session hero, tonight's dinner card, technique library | → Cook Mode, → Profile |
| **Cook Mode** | Full-screen dark UI, step navigation, countdown timers, play/pause/reset, contextual ingredient pills, haptic feedback, keep-awake, finish cooking flow | → Awards XP, → Adds passport stamp, → Clears session |

### Context Systems (All 3 Built)
| Context | State Managed | Persistence | Used By |
|---------|--------------|-------------|---------|
| **AppContext** | Itinerary, grocery items, cook session, XP/level/stamps, user preferences | AsyncStorage (all keys) | Plan, Grocery, Cook, Cook Mode, Profile, Discover, Tab bar |
| **BookmarksContext** | Saved recipe IDs, count | AsyncStorage | Recipe Detail, Bookmarks screen, Profile |
| **ThemeContext** | Light/Dark/System preference | AsyncStorage | Every screen via useThemeColors |

### Design System (Complete)
| Token Set | File | Status |
|-----------|------|--------|
| Colors (light + dark + today blue) | `constants/colors.ts` | Complete |
| Typography (Noto Serif + Inter) | `constants/typography.ts` | Complete |
| Spacing (4pt/8pt grid) | `constants/spacing.ts` | Complete |
| Border Radius (5 tokens) | `constants/radius.ts` | Complete |
| Shadows (3-tier) | `constants/shadows.ts` | Complete |
| Glass effects | `constants/glass.ts` | Complete |
| Motion presets | `constants/motion.ts` | Complete |

### Data Layer
- **8 countries** with full cultural context
- **97 recipes** with ingredients, steps, cultural notes, difficulty, prep/cook times
- **Ingredient model:** `{ name, amount (display string), category }`

---

## Part 2: What's Partially Built (Gaps Within Working Features)

### Ingredient Amount Scaling — NOT WORKING
| Where | What's Missing |
|-------|---------------|
| Recipe Detail servings adjuster | +/- buttons change the number but ingredient amounts don't scale |
| Grocery list | Duplicate ingredients merge by name but amounts aren't summed numerically |
| Cook Mode | No servings scaler at all |
| **Root Cause** | Amounts are display strings ("400g", "2 tbsp, freshly cracked") — no parsing utility exists to extract numeric values and units |

### Search Screen Bookmarks — NOT WIRED
- Heart/bookmark buttons on search result cards are visual only
- The BookmarksContext exists and works everywhere else (Recipe Detail, Bookmarks screen)
- Just needs the import and toggle call added

### Cook Mode — Missing Polish
| Feature | Status |
|---------|--------|
| Swipe gesture for step navigation | Not built — button-based only |
| Servings scaler in cook mode | Not built |
| Session persistence | Working (survives app restarts via AsyncStorage) |
| CookingPill floating indicator | Component exists in layout but may not render visibly |

### Grocery Tab Badge
- `getUncheckedCount()` exists in AppContext
- Tab bar layout references it but badge may not be rendering visually

### Plan Tab — Minor Gaps
| Feature | Status |
|---------|--------|
| Week picker dropdown options | Switches between This Week / Next Week / Past but "Daily View" option text may be inconsistent |
| "Add to Plan" from Country Detail | Not built (only works from Recipe Detail and Discover) |
| Course slot drink pairings | Not built (appetizer + dessert work) |

### Profile Screen — Visual-Only Items
| Feature | Status |
|---------|--------|
| Notification toggles | UI exists, not connected to any notification system |
| Support/About/Privacy links | Buttons exist, no targets |
| Sign out | Shows confirmation alert, no auth system to sign out of |

---

## Part 3: What's Not Built (Deferred by Design)

These are V1 vision features explicitly deferred — they are future releases, not current gaps.

| System | V1 Vision | Why Deferred |
|--------|----------|-------------|
| **Multi-Course Timeline** | Backward-planning engine: "Set dinner at 7 PM, 3 dishes, start at 4:25 PM" | Competitive differentiator for later release; solo cook mode comes first |
| **Dinner Party** | Guest invites via SMS (Twilio), RSVPs, dietary conflict detection, live dinner status | Requires backend infrastructure |
| **Delivery Integration** | Instacart, Walmart, Kroger grocery delivery | Requires API partnerships |
| **Auth & Accounts** | Supabase auth, user accounts, cloud sync | Current build is local-only by design |
| **Subscriptions** | RevenueCat premium tier gating | Depends on auth |
| **Adaptive Language** | 3 skill tiers change recipe instruction voice (First Steps / Home Cook / Chef's Table) | AI-generated rewrites at build time |
| **Pantry Inventory** | Kitchen scanner via expo-camera, auto-subtract from grocery | Hardware-dependent feature |

---

## Part 4: What Changed Since Blueprint V3 Was Written

The Master Blueprint V3 was written when many features were still hardcoded. Since then, **AppContext was merged** and significant wiring was done. Here's what the blueprint says is "NOT BUILT" that is now actually working:

| Blueprint Says | Current Reality |
|---------------|----------------|
| "AppContext / Global Session State — NOT BUILT" | **BUILT** — full AppContext with itinerary, grocery, cook session, XP/level |
| "Adding/removing recipes to days — NOT BUILT" | **BUILT** — RecipePickerSheet, long-press remove, add from Recipe Detail |
| "Recipe picker modal — NOT BUILT" | **BUILT** — RecipePickerSheet component with search |
| "Auto-generate itinerary from country — NOT BUILT" | **BUILT** — FAB button on Plan tab |
| "Persistent itinerary state — NOT BUILT" | **BUILT** — AsyncStorage persistence |
| "Tab badge for unchecked count — NOT BUILT" | **BUILT** — getUncheckedCount() in AppContext, wired to tab layout |
| "Cook session state resets on unmount" | **FIXED** — AsyncStorage persistence, session survives restarts |
| "Resume Session hardcoded to recipes[3]" | **FIXED** — reads from activeCookSession in AppContext |
| "No CookingPill floating indicator" | **BUILT** — CookingPill component in root layout |

---

## Part 5: Remaining Work Priority

### P1 — High Impact, Achievable Now
1. **Ingredient amount parser** — unlocks scaling everywhere (Recipe Detail, Grocery, Cook Mode)
2. **Search bookmark wiring** — 5-minute fix, connects hearts to BookmarksContext
3. **Cook Mode swipe gestures** — step navigation via horizontal swipe
4. **Cook Mode servings scaler** — top bar control, scales ingredient pills

### P2 — Polish & Completeness
5. **Grocery amount summation** — with parser, sum "200g + 200g = 400g" for duplicate ingredients
6. **"Add to Plan" from Country Detail** — auto-fill dinner slots with country's recipes
7. **Verify CookingPill visibility** — ensure floating indicator renders above tab bar during active session
8. **Verify grocery tab badge** — ensure unchecked count badge renders on tab icon
9. **Update Master Blueprint V3** — reflect AppContext merge and current reality

### P3 — Accessibility & Launch Prep
10. **`useReducedMotion()` wiring** — respect OS reduced motion setting
11. **VoiceOver label audit** — verify every interactive element
12. **Touch target audit** — minimum 48pt everywhere
13. **Dynamic Type verification** — test at largest accessibility sizes

---

## Screen-by-Screen Connectivity Map

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  DISCOVER    │────→│ COUNTRY      │────→│ RECIPE       │
│  (home)      │     │ DETAIL       │     │ DETAIL       │
│              │     │              │     │              │
│ Hero Carousel│     │ Signature    │     │ Ingredients  │
│ Tonight Plan │     │ Recipes      │     │ Steps        │
│ Trending     │     │              │     │ Bookmark ♥   │
│ Quick-Add    │     │              │     │ Add to Plan  │
└──────┬───────┘     └──────────────┘     │ Start Cook   │
       │                                   └──────┬───────┘
       │                                          │
       ▼                                          ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  PLAN        │────→│  GROCERY     │     │  COOK MODE   │
│              │     │              │     │  (fullscreen) │
│ Weekly/Daily │     │ Auto-gen list│     │  Steps+Timer │
│ Recipe Picker│     │ Check items  │     │  Haptics     │
│ Add/Remove   │     │ Remove recipe│     │  Keep-awake  │
│ Auto-generate│     │ Online/Store │     │  XP on finish│
│ Today (blue) │     │              │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
       ┌──────────────────────────────────────────┘
       ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  COOK HUB    │     │  PROFILE     │     │  BOOKMARKS   │
│              │     │              │     │              │
│ XP / Level   │     │ Preferences  │     │ Saved recipes│
│ Active Sess. │     │ Theme toggle │     │ By country   │
│ Resume btn   │     │ Skill level  │     │ Remove       │
│ Techniques   │     │ Stats        │     │              │
└──────────────┘     └──────────────┘     └──────────────┘

SHARED STATE FLOWS:
  AppContext ───→ Plan ←→ Grocery (ingredients auto-sync)
  AppContext ───→ Cook Mode → XP/Level → Cook Hub + Profile
  BookmarksContext ───→ Recipe Detail ←→ Bookmarks screen
  ThemeContext ───→ Every screen (light/dark/system)
```
