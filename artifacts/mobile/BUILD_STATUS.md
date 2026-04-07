# Fork & Compass — What We've Built

**Last Updated:** April 7, 2026

---

## The App

A premium culinary travel mobile app. Pick a country, plan a dinner, shop the ingredients, cook the meal, feel like you traveled. Built with Expo React Native, fully local mock data, no backend required.

---

## Screens (12 Total)

### Tab Screens (5)

**1. Discover (Home)**
- Hero carousel of 5 countries with vertical pagination dots
- "Explore [Country]" button navigates to Country Detail
- Tonight's Plan strip showing today's planned dinner from the itinerary
- "Cook Tonight" button starts a cooking session directly
- Curated Regions grid with destination cards
- Trending Bites recipe grid with "Tonight" and "Week" quick-add buttons
- Day picker modal for adding a recipe to a specific day
- Toast notifications for feedback on actions

**2. Search**
- Text search filtering recipes by title and ingredient name
- 7 mood filter chips (Quick & Easy, Comfort Food, Date Night, etc.) with real filter logic
- Two-column recipe results grid with images
- "ADD +" button on cards navigates to recipe detail

**3. Plan**
- Weekly view with vertical timeline showing all 7 days
- Daily view with 3 course slots (Appetizer, Main, Dessert)
- Week navigation arrows (skip weeks in weekly view, skip days in daily view)
- Day crosses week boundaries automatically (Sunday right → next week Monday)
- Week picker dropdown (This Week / Next Week / Past Journeys / Daily Plan)
- Day selector strip with dot indicators showing which days have meals
- Blue "TODAY" indicator badge in weekly timeline and day selector
- Date range subtitle in weekly view header (e.g., "Apr 6 – Apr 12")
- "· Today" label in daily view header when viewing today
- Default day selection starts on today's day of the week
- Recipe Picker Sheet — search and browse recipes to add to any day/course
- Long-press to remove a planned meal
- Auto-generate week button (fills dinner slots from a country's recipes)
- Dinner Party toggle per day
- Multiple Meals toggle to switch between single dinner and 3-course view
- Grocery List Update banner linking to grocery tab with unchecked count

**4. Grocery**
- Categorized ingredient list (Produce, Protein, Dairy, Spice, Pantry, Other)
- Auto-generated from recipes in the meal plan
- Checkbox toggle per ingredient
- Active recipe source carousel at top
- Remove a recipe's ingredients by tapping X on its card
- "Clear Completed" and "Clear All" buttons with confirmation
- Online / In-Store shopping mode toggle
- Retailer selector (Instacart, Walmart, Amazon Fresh)
- Zip code input for retailer
- Sticky bottom order bar with item count
- Eco banner showing CO₂ savings estimate

**5. Cook (Kitchen Hub)**
- Kitchen Reputation header showing level name, XP progress bar, and level number
- Active cooking session hero card with "Resume Session" button
- Tonight's Dinner card when no active session but dinner is planned
- Technique Library horizontal carousel (video lesson cards)
- Upcoming Class card
- Pantry stocked percentage display

### Detail Screens (5)

**6. Country Detail**
- Full-bleed hero image with country flag pill overlay
- Culinary Heritage description text
- Signature Recipes list filtered by country
- Glass back button

**7. Recipe Detail**
- Hero image with country flag badge
- Stats row (prep time, cook time, difficulty, servings)
- Servings adjuster with +/- buttons
- Ingredients grouped by category
- Step-by-step instructions with duration per step
- Cultural Note section
- Bookmark toggle (heart icon) wired to BookmarksContext
- "Start Cooking" button launches Cook Mode
- "Add to Plan" button with day and course picker

**8. Cook Mode**
- Full-screen dark immersive UI
- Large-format step instructions
- Progress bar showing current step / total steps
- Countdown timer per step with play/pause/reset
- Contextual ingredient pills matched to current step
- Previous / Next step navigation buttons
- Haptic feedback on step changes and timer completion
- Keep-awake prevents screen dimming
- "Finish Cooking" on last step — awards XP, adds passport stamp, clears session

**9. Profile & Settings**
- Profile card with level name, XP, and progress bar
- Stats row (recipes cooked, countries explored, bookmarks count)
- Dietary preferences grid (toggleable flags)
- Cooking skill level selector
- Course preference selector
- Default servings picker
- Grocery partner picker
- Theme picker (System / Light / Dark) wired to ThemeContext
- Notification toggles
- Sign out with confirmation alert

**10. Bookmarks**
- Saved recipe count
- Recipes grouped by country of origin
- Heart icon to remove bookmark
- Tap recipe row to navigate to Recipe Detail
- "Explore Recipes" link in empty state
- Persistence via AsyncStorage

### Utility Screens (2)

**11. Tab Bar Layout**
- Floating pill tab bar with GlassView background
- 5 tabs: Discover, Search, Plan, Grocery, Cook
- MaterialCommunityIcons for all tab icons
- Grocery tab badge showing unchecked item count
- Custom glass styling with specular top-edge highlight

**12. Not Found (404)**
- Error handling for invalid routes

---

## Shared State (3 Context Systems)

**AppContext**
- Itinerary: weekly meal plan (day → appetizer/main/dessert → recipe)
- Grocery: items list with categories, checked state, recipe sources
- Cook Session: active recipe, current step, timer seconds, timer running state, servings
- User Progress: XP, level, total recipes cooked, passport stamps per country
- Preferences: cooking level, course preference, dietary flags, allergens, default servings, grocery partner
- All state persisted to AsyncStorage across app restarts

**BookmarksContext**
- Saved recipe IDs array
- Bookmark count
- Toggle, check, and persist functions
- Persisted to AsyncStorage

**ThemeContext**
- User preference: system, light, or dark
- Derived `isDark` boolean from preference + device color scheme
- Persisted to AsyncStorage

---

## Shared Components (8)

| Component | What It Does |
|-----------|-------------|
| **GlassView** | Frosted glass container with expo-blur, specular top-edge highlight, light/dark variants |
| **HeaderBar** | Top navigation bar — transparent on Discover, frosted glass on other tabs |
| **RecipeCard** | Recipe grid card with image, title, metadata, bookmark icon |
| **DestinationCard** | Country card with hero image, flag, and name |
| **SectionHeader** | Section label + title + optional "View All" link |
| **RecipePickerSheet** | Bottom sheet for searching and selecting recipes to add to the plan |
| **CookingPill** | Floating indicator above tab bar when a cook session is active |
| **ErrorBoundary** | Catches JavaScript errors and shows a fallback UI |

---

## Design System

**Color Palette**
- Primary: Terracotta #9A4100 (both modes)
- Surface: Cream #FEF9F3 (light) / #161412 (dark)
- Today indicator: Blue #005CAF (light) / #4DA3E8 (dark)
- Full token set: primary, onPrimary, surface, surfaceContainer (5 levels), onSurface, onSurfaceVariant, outline, outlineVariant, secondary, secondaryContainer, error, success, warning, overlay, shadow, textOnImage, today, and 5 category colors

**Typography**
- Headlines: Noto Serif (500–700 weight)
- Body/Labels: Inter (400–600 weight)
- 13 semantic tokens from displayLarge (44pt) down to small (13pt)

**Spacing**
- 4pt/8pt grid: xs(4), sm(8), md(16), lg(24), xl(32), xxl(48), page(20)

**Border Radius**
- 5 tokens: sm(8), md(12), lg(16), xl(24), full(9999)

**Shadows**
- 3-tier system: subtle, medium, prominent

**Glass Effects**
- Blur intensity: 32 (light) / 40 (dark)
- Background overlay with specular top-edge highlight
- Web fallback: solid View with background color

**Motion Presets**
- Spring and timing animation configurations

---

## Data Layer

- **8 Countries:** Italy, France, Japan, Mexico, Thailand, Morocco, India, Spain — each with id, name, flag, region, hero image, cuisine label, description
- **97 Recipes:** Full data per recipe — id, countryId, title, image, category, prepTime, cookTime, servings, difficulty, ingredients array, steps array, cultural note
- **Ingredient Model:** `{ name, amount (display string), category }`
- **Helper Functions:** getRecipeById, getRecipesForCountry, parseTimeToMinutes, search/filter utilities

---

## Accessibility

- All Pressable elements have accessibilityRole and accessibilityLabel
- Checkboxes use accessibilityRole="checkbox" with checked state
- Tab bar items have tabBarAccessibilityLabel
- Hero carousel has accessibilityRole="adjustable"
- Decorative images use accessible={false}
- Haptic feedback provides non-visual confirmation
- Color contrast meets WCAG standards (terracotta on cream passes AA)
- Full dark mode support

---

## Platform & Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 (managed workflow) |
| Router | expo-router ~6.0.17 (file-based) |
| Language | TypeScript 5.x |
| State | React Context + AsyncStorage |
| Images | expo-image |
| Effects | expo-blur, expo-linear-gradient |
| Haptics | expo-haptics |
| Keep Awake | expo-keep-awake v15 |
| Keyboard | react-native-keyboard-controller v1.18.5 |
| Gestures | react-native-gesture-handler |
| Data Fetching | @tanstack/react-query |
| Splash | expo-splash-screen |

---

## Persistence

| Data | Storage Key | Status |
|------|------------|--------|
| Theme preference | `@fork_compass_theme` | Working |
| Bookmarked recipe IDs | `@fork_compass_bookmarks` | Working |
| Meal itinerary | `@fork_compass_itinerary` | Working |
| Grocery items | `@fork_compass_grocery` | Working |
| Cook session state | `@fork_compass_cook_session` | Working |
| User progress (XP, level, stamps) | `@fork_compass_progress` | Working |
| User preferences | `@fork_compass_preferences` | Working |
