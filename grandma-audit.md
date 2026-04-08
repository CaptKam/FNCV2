# Fork & Compass — Grandma Audit

> **What's a Grandma Audit?** We pretend Grandma Rose (72, uses an iPhone to FaceTime and look up recipes, not a power user) just downloaded the app. Every screen is evaluated for: clarity, readability, intuitive interactions, confusing jargon, and accessibility.

**Overall Grade: B+** — The app is well-designed with a warm, inviting aesthetic. Most flows are intuitive. But several areas would leave Grandma tapping randomly or squinting at the screen.

---

## 1. Onboarding (3 screens)

### What Works
- Warm, welcoming tone — "Pick a country, cook a dinner, feel like you traveled" is delightful
- Large, legible headline (32px Noto Serif bold)
- Clear "Continue" button at the bottom — big, terracotta, easy to find
- Progress dots at top show where you are in the flow
- Back arrow appears on steps 2 and 3 — clear escape hatch
- "(optional)" on the name field reduces pressure

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **Avatar icons have no labels** | Medium | The 7 circles (A, chef hat, globe, fire, heart, star, compass) have no text underneath. Grandma might wonder "What does the fire mean? Am I picking a mood?" |
| **"Skip" button is low-contrast** | Medium | Small (14px), colored #897267 on cream — contrast ratio ~3.6:1, below WCAG AA. Grandma might not notice it exists |
| **No accessibility labels on avatars** | High | Screen reader users hear "button, selected" but not *which* avatar they're selecting |
| **"Pick Your Avatar" is unclear** | Low | Grandma might not know what an "avatar" is. "Pick your icon" or "Choose your picture" is plainer |
| **Dietary options aren't explained** | Low | "Gluten-Free" is clear, but what does selecting it actually *do*? A one-line subtitle like "We'll warn you about recipes with gluten" would help |

---

## 2. Home Screen (Discover Tab)

### What Works
- Hero carousel with big, beautiful food photos — immediately appealing
- Personalized greeting ("Good evening, Rose") — warm touch
- "Explore [Country]" button is large, labeled, and obvious
- Recipe cards show photo, title, time, and difficulty — all the info you need
- Country flags next to region names — charming and scannable

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **Tab bar labels are 10px** | High | The bottom nav labels ("Discover", "Search", "Plan", "Grocery", "Cook") are 10px. Grandma literally cannot read them. **Minimum should be 12px.** |
| **Inactive tab color fails contrast** | High | Inactive tabs use #897267 on the glass background — approximately 3.6:1 contrast ratio, failing WCAG AA for small text |
| **"Discover" tab icon is a compass** | Low | Might not immediately connect "compass" to "home/recipes." Most apps use a house icon for home |
| **"Tonight" and "Week" quick-action buttons** | Medium | Small 12px labels with moon/calendar icons. Purpose isn't clear until you tap |
| **XP and level badges** | Low | If visible in the greeting area, gamification terms like "Level 2" are confusing without context |

---

## 3. Search Screen

### What Works
- Large search bar at the top — obviously a search field
- Filter chips for countries and categories — visually clear
- "No matches found" empty state is helpful with suggestions
- Results show recipe cards with all key info

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **Filter chip text is small** | Low | Country/category chips use caption-size text (12px) |
| **No "clear all filters" button** | Medium | If Grandma selects multiple filters and gets no results, she might not know how to reset |

---

## 4. Plan Screen (Meal Planner)

### What Works
- Calendar-based layout is familiar
- Clear day labels (Monday, Tuesday, etc.)

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **"CURRENT PLANNING" label** | Medium | Jargon. "This Week's Meals" or "Your Meal Plan" is plainer |
| **Swap/Remove icons lack text labels** | High | Small icons overlaid on meal cards. Grandma will not know what the X or swap arrows mean without labels |
| **Empty state is poetic, not practical** | Medium | Something like "You haven't planned any meals yet" with a "Browse Recipes" button would be clearer than atmospheric copy |

---

## 5. Grocery Screen

### What Works
- Checkbox-based grocery list is familiar
- Category grouping (Produce, Dairy, etc.) is helpful
- Manual "Add item" field exists

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **"Online" tab shows "Coming Soon"** | Low | Retailer icons at 50% opacity look broken. Grandma will tap them repeatedly thinking something's wrong |
| **No explanation of where items come from** | Medium | If the list auto-populates from the meal plan, there's no label saying "From your planned meals" |

---

## 6. Cook Screen ("Kitchen Lab")

### What Works
- Shows today's planned recipe prominently
- "Start Cooking" is a big, obvious CTA

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **"Kitchen Lab" name** | High | Grandma does not want to enter a "lab." She wants to cook dinner. "Ready to Cook" or "Tonight's Recipe" is far clearer |
| **"Ready to initiate kitchen lab sequence"** | Critical | This sounds like a spaceship, not a kitchen. Should be: "Ready to start cooking?" |
| **"Kitchen Reputation" / XP system** | Medium | Gamification terms like "300 XP to next level" are confusing. "You've cooked 12 recipes!" is warmer and clearer |
| **Empty state when no meal is planned** | Medium | "Ready when you are" is vague. A direct "Plan a meal first" with a button to the planner would help |

---

## 7. Recipe Detail

### What Works
- Beautiful hero image with recipe title
- Nutrition info is clean and scannable (calories, protein, carbs, fat)
- Serving size controls (+/-) are standard and clear
- Ingredient checkboxes with strikethrough — immediately intuitive
- "Start Cooking" button is sticky at the bottom — hard to miss
- Allergen warnings with colored pills — helpful and clear
- Dietary conflict banner with alert icon — excellent safety feature
- Beginner-friendly instruction toggle is labeled clearly
- Accessibility labels on all interactive elements — well done

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **Substitution swap icon is unexplained** | High | The small circular arrows (swap-horizontal-circle) icon next to some ingredients has no tooltip, label, or first-use explanation. Grandma will never discover this feature |
| **Nutritional label text is 12px** | Low | The "kcal", "protein", "carbs", "fat" labels are small. Fine for young eyes, harder for Grandma |
| **"Add to Plan" vs "Start Cooking"** | Low | Two CTAs that do different things — could be momentarily confusing, but color/placement helps distinguish them |
| **Cultural note section** | None | Actually lovely — Grandma would enjoy the history! |

---

## 8. Cook Mode (Step-by-Step)

### What Works
- Full-screen, distraction-free layout
- Large step text — easy to read while cooking
- Timer integration with haptic feedback
- "Finish" button turns green on last step — clear completion signal
- Keep-awake prevents screen from dimming while cooking

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **"Previous" button is low contrast** | Medium | Uses `onSurfaceVariant` color which is less visible than the "Next" button |
| **No "Exit" or "Back to Recipe" button** | Medium | If Grandma wants to leave mid-cook, the escape path isn't obvious |

---

## 9. Profile & Settings

### What Works
- Avatar display with edit badge is clear
- Display name is editable
- Dietary preference toggles are labeled
- Theme picker (System/Light/Dark) with descriptions

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **"Metric" vs "Imperial" toggle** | Medium | Many older users don't know these terms. "Grams & Celsius" vs "Cups & Fahrenheit" is clearer |
| **XP / Level system in profile** | Low | "Level 3 · 180/300 XP" means nothing to a non-gamer. "You've cooked 15 recipes!" is more meaningful |
| **Grocery partner selection** | Low | Instacart/Kroger/Walmart options exist but the feature is "Coming Soon" — confusing |

---

## 10. Bookmarks Screen

### What Works
- Category filter chips (All, Main, Appetizer, Dessert)
- Sort options (Date Saved, Cuisine, Difficulty)
- Recipe cards are consistent with the rest of the app

### What Would Trip Up Grandma
| Issue | Severity | Details |
|-------|----------|---------|
| **Empty state when no bookmarks** | Medium | Should include a "Browse Recipes" button, not just a message |
| **"Date Saved" sort label** | Low | "Newest First" might be more intuitive |
| **Heart vs Bookmark metaphor** | Low | Consistent throughout app, but mixing "saved" and "bookmarked" terminology could confuse |

---

## Top 10 Priority Fixes

| # | Fix | Effort | Impact |
|---|-----|--------|--------|
| 1 | **Increase tab bar label size from 10px to 12px** | Trivial | High — affects every screen |
| 2 | **Replace "Kitchen Lab" / "initiate sequence" with plain language** | Trivial | High — the Cook tab is a core feature |
| 3 | **Add text labels to avatar icons in onboarding** | Easy | Medium — first impression matters |
| 4 | **Add a small "Swap?" label or first-use tooltip for substitution icons** | Easy | Medium — a key feature that's invisible |
| 5 | **Improve inactive tab contrast** (darken to ~#6B5B52) | Trivial | High — accessibility compliance |
| 6 | **Add text labels to Plan screen swap/remove icons** | Easy | Medium — prevents confusion |
| 7 | **Replace "Metric/Imperial" with descriptive labels** | Trivial | Low-Medium |
| 8 | **Add accessibility labels to avatar options** | Trivial | Medium — screen reader compliance |
| 9 | **Improve "Previous" button contrast in Cook Mode** | Trivial | Low-Medium |
| 10 | **Add "Browse Recipes" CTA to empty bookmark state** | Easy | Low — improves discoverability |

---

## Color Contrast Summary

| Element | Color | Background | Ratio | WCAG AA (small text) |
|---------|-------|------------|-------|---------------------|
| Main text (`onSurface`) | #1D1B18 | #FEF9F3 | 15.6:1 | Pass |
| Secondary text (`onSurfaceVariant`) | #564339 | #FEF9F3 | 7.8:1 | Pass |
| Inactive tabs (`outline`) | #897267 | #FEF9F3 | 3.6:1 | **Fail** |
| Skip button (`outline`) | #897267 | #FEF9F3 | 3.6:1 | **Fail** |
| Outline variant (borders) | #DDC1B4 | #FEF9F3 | 1.9:1 | **Fail** (if used for text) |
| Primary (interactive) | #9A4100 | #FEF9F3 | 5.8:1 | Pass |

---

## What Grandma Would Love

- The warm, earthy design — feels like a cookbook, not a tech app
- Cultural notes on every recipe — she'd read these aloud at dinner
- Beginner-friendly instruction mode — "tells me exactly what to do!"
- Ingredient checkboxes — "I can check things off as I go!"
- Big "Start Cooking" button — impossible to miss
- Beautiful food photography — "Oh, that looks wonderful!"
- Serving size adjuster — "I only cook for two now"

---

*Audit conducted April 2026 against the Fork & Compass Expo app (development build).*
