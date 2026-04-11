/**
 * Remote-config seed — feature flags + app settings.
 *
 * The admin panel at /feature-flags and /app-settings reads/writes
 * these two tables. The mobile app fetches the combined state via
 * the public GET /api/config endpoint once per launch.
 *
 * Adding a new flag/setting: append to SEED_FEATURE_FLAGS or
 * SEED_APP_SETTINGS, then run:
 *
 *   pnpm --filter @workspace/db seed:remote-config
 *
 * This is idempotent (ON CONFLICT DO UPDATE on `key`), so you can
 * rerun it after any edit and the DB stays in sync with this file.
 * Note: only label/description/category/default value are synced —
 * the `enabled` flag and the `value` column are NOT overwritten on
 * re-seed so admin edits in production survive future seed runs.
 */
import { sql } from "drizzle-orm";
import { db } from "../index";
import {
  featureFlagsTable,
  type InsertFeatureFlag,
} from "../schema/featureFlags";
import {
  appSettingsTable,
  type InsertAppSetting,
} from "../schema/appSettings";

// ═══════════════════════════════════════════════════════════════════
// Feature flags (16) — on/off toggles for app features
// ═══════════════════════════════════════════════════════════════════

const SEED_FEATURE_FLAGS: InsertFeatureFlag[] = [
  // ─── Gamification ─────────────────────────────────────────────────
  {
    key: "xp_system",
    label: "XP & Progress Tracking",
    description: "Award XP for cooked recipes and display level progress bars.",
    category: "Gamification",
    enabled: true,
  },
  {
    key: "passport_stamps",
    label: "Passport Stamps",
    description: "Country stamps earned by cooking recipes from that cuisine.",
    category: "Gamification",
    enabled: true,
  },
  {
    key: "level_up_celebrations",
    label: "Level-Up Celebrations",
    description: "Full-screen celebration overlay when a user levels up.",
    category: "Gamification",
    enabled: true,
  },
  {
    key: "streak_tracking",
    label: "Cooking Streaks",
    description: "Track consecutive days the user has cooked (not yet built).",
    category: "Gamification",
    enabled: false,
  },

  // ─── Cooking ──────────────────────────────────────────────────────
  {
    key: "smart_cook_bar",
    label: "Smart Cook Bar",
    description: "Time-aware cook-now prompts at the top of Plan and Cook tabs.",
    category: "Cooking",
    enabled: true,
  },
  {
    key: "cook_mode_step_images",
    label: "AI Step Images in Cook Mode",
    description: "AI-generated visual reference image for each cook-mode step (not yet built).",
    category: "Cooking",
    enabled: false,
  },
  {
    key: "voice_commands",
    label: "Voice Commands in Cook Mode",
    description: "Hands-free next/previous/timer commands (not yet built).",
    category: "Cooking",
    enabled: false,
  },
  {
    key: "measurement_conversion",
    label: "Inline Measurement Conversion",
    description: "Tap any measurement to convert units (not yet built).",
    category: "Cooking",
    enabled: false,
  },
  {
    key: "skill_adaptive_instructions",
    label: "Skill-Adaptive Instructions",
    description: "Show First-Steps vs Chef's-Table instruction text based on user skill.",
    category: "Cooking",
    enabled: true,
  },

  // ─── Planning ─────────────────────────────────────────────────────
  {
    key: "auto_generate_fab",
    label: "Auto-Plan FAB",
    description: "Floating action button that auto-fills the week's itinerary.",
    category: "Planning",
    enabled: true,
  },

  // ─── Discovery ────────────────────────────────────────────────────
  {
    key: "tonight_strip",
    label: "Tonight's Plan on Discover",
    description: "Strip at the top of Discover showing what's planned for tonight.",
    category: "Discovery",
    enabled: true,
  },

  // ─── Social ───────────────────────────────────────────────────────
  {
    key: "dinner_party_system",
    label: "Dinner Party System",
    description: "Plan multi-course meals, track guests, assign courses.",
    category: "Social",
    enabled: true,
  },

  // ─── Grocery ──────────────────────────────────────────────────────
  {
    key: "online_grocery",
    label: "Online Grocery Ordering",
    description: "Export grocery list to Instacart / Kroger / Amazon Fresh (not yet built).",
    category: "Grocery",
    enabled: false,
  },

  // ─── UX ───────────────────────────────────────────────────────────
  {
    key: "pull_to_refresh",
    label: "Pull-to-Refresh on All Tabs",
    description: "Drag-down gesture refetches the tab's data.",
    category: "UX",
    enabled: true,
  },
  {
    key: "swipe_gestures",
    label: "Swipe-to-Delete / Check",
    description: "Left/right swipe on list items for quick actions.",
    category: "UX",
    enabled: true,
  },

  // ─── Education ────────────────────────────────────────────────────
  {
    key: "technique_library",
    label: "Technique Library",
    description: "Browse cooking techniques with short explainer videos.",
    category: "Education",
    enabled: true,
  },
];

// ═══════════════════════════════════════════════════════════════════
// App settings (16) — tunable values (numbers, strings, JSON arrays)
// ═══════════════════════════════════════════════════════════════════

const SEED_APP_SETTINGS: InsertAppSetting[] = [
  // ─── Gamification ─────────────────────────────────────────────────
  {
    key: "xp_per_recipe",
    label: "XP per Recipe Completion",
    description: "How much XP a user earns for completing a single recipe.",
    category: "Gamification",
    value: "50",
    valueType: "number",
  },
  {
    key: "xp_per_dinner_party",
    label: "XP per Dinner Party",
    description: "How much XP a user earns for hosting a completed dinner party.",
    category: "Gamification",
    value: "100",
    valueType: "number",
  },
  {
    key: "level_thresholds",
    label: "Level XP Thresholds",
    description: "XP required to reach each level (level 1 through 10).",
    category: "Gamification",
    value: "[0,100,250,500,1000,2000,3500,5500,8000,12000]",
    valueType: "json_array",
  },
  {
    key: "level_names",
    label: "Level Names",
    description: "Display name for each level, in order.",
    category: "Gamification",
    value:
      '["Novice","Home Cook","Skilled Cook","Sous Chef","Head Chef","Executive Chef","Master Chef","Culinary Artist","Grand Master","Legend"]',
    valueType: "json_array",
  },

  // ─── Content ──────────────────────────────────────────────────────
  {
    key: "max_featured_per_country",
    label: "Max Featured Recipes per Country",
    description: "Cap on how many recipes can be flagged as featured for one country.",
    category: "Content",
    value: "5",
    valueType: "number",
  },

  // ─── Discovery ────────────────────────────────────────────────────
  {
    key: "tonight_strip_start_hour",
    label: "Tonight Strip Appears After (hour, 24h)",
    description: "Hour of day (0-23) after which the Tonight strip starts showing.",
    category: "Discovery",
    value: "12",
    valueType: "number",
  },
  {
    key: "tonight_dismiss_reset_days",
    label: "Tonight Dismiss Key Cleanup (days)",
    description: "How long to remember 'I dismissed tonight's plan' before cleanup.",
    category: "Discovery",
    value: "7",
    valueType: "number",
  },

  // ─── Grocery ──────────────────────────────────────────────────────
  {
    key: "grocery_cleanup_days",
    label: "Grocery Cleanup Window (days)",
    description: "Grocery items older than this many days are auto-removed.",
    category: "Grocery",
    value: "28",
    valueType: "number",
  },

  // ─── Planning ─────────────────────────────────────────────────────
  {
    key: "recency_avoidance_days",
    label: "Auto-Generate Recency Window (days)",
    description: "Auto-plan avoids recipes cooked in the last N days.",
    category: "Planning",
    value: "14",
    valueType: "number",
  },
  {
    key: "auto_gen_fallback_pool_min",
    label: "Auto-Generate Minimum Pool Size",
    description: "If filtered pool is smaller than this, fall back to all recipes.",
    category: "Planning",
    value: "3",
    valueType: "number",
  },
  {
    key: "default_course_preference",
    label: "Default Course Preference",
    description: "Default course label used when auto-generating a new week.",
    category: "Planning",
    value: "main",
    valueType: "string",
  },

  // ─── Cooking ──────────────────────────────────────────────────────
  {
    key: "skill_nudge_threshold_1",
    label: "Skill Level Nudge at N Recipes",
    description: "Prompt user to upgrade skill level after cooking this many recipes.",
    category: "Cooking",
    value: "5",
    valueType: "number",
  },
  {
    key: "skill_nudge_threshold_2",
    label: "Skill Level Second Nudge at N Recipes",
    description: "Second skill-level nudge after cooking this many recipes.",
    category: "Cooking",
    value: "15",
    valueType: "number",
  },
  {
    key: "cook_session_stale_hours",
    label: "Stale Cook Session Threshold (hours)",
    description: "Active cook sessions older than this many hours are auto-closed.",
    category: "Cooking",
    value: "24",
    valueType: "number",
  },

  // ─── Branding / General ───────────────────────────────────────────
  {
    key: "app_tagline",
    label: "App Tagline",
    description: "One-line tagline shown on splash and About screen.",
    category: "Branding",
    value: "Pick a country, cook a dinner, feel like you traveled.",
    valueType: "string",
  },
  {
    key: "support_email",
    label: "Support Email",
    description: "Address shown in the Help/Support screen.",
    category: "General",
    value: "support@forkandcompass.com",
    valueType: "string",
  },
];

// ═══════════════════════════════════════════════════════════════════
// Seed runner
// ═══════════════════════════════════════════════════════════════════

async function seed(): Promise<void> {
  if (!process.env["DATABASE_URL"]) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  console.log(
    `Seeding ${SEED_FEATURE_FLAGS.length} feature flags and ${SEED_APP_SETTINGS.length} app settings…`,
  );

  let flagsInserted = 0;
  let flagsSkipped = 0;
  for (const row of SEED_FEATURE_FLAGS) {
    // Only update metadata (label/description/category) on conflict so admin
    // toggles are never clobbered by a re-seed.
    const result = await db
      .insert(featureFlagsTable)
      .values(row)
      .onConflictDoUpdate({
        target: featureFlagsTable.key,
        set: {
          label: row.label,
          description: row.description,
          category: row.category,
        },
      })
      .returning({ id: featureFlagsTable.id, updatedAt: featureFlagsTable.updatedAt });

    const r = result[0];
    if (r && Math.abs(Date.now() - r.updatedAt.getTime()) < 2000) {
      flagsInserted++;
    } else {
      flagsSkipped++;
    }
  }

  let settingsInserted = 0;
  let settingsSkipped = 0;
  for (const row of SEED_APP_SETTINGS) {
    // Same policy: never overwrite `value` on re-seed — only metadata.
    // If you want to reset a setting to its default, do it from the admin UI.
    const result = await db
      .insert(appSettingsTable)
      .values(row)
      .onConflictDoUpdate({
        target: appSettingsTable.key,
        set: {
          label: row.label,
          description: row.description,
          category: row.category,
          valueType: row.valueType,
        },
      })
      .returning({ id: appSettingsTable.id, updatedAt: appSettingsTable.updatedAt });

    const r = result[0];
    if (r && Math.abs(Date.now() - r.updatedAt.getTime()) < 2000) {
      settingsInserted++;
    } else {
      settingsSkipped++;
    }
  }

  console.log(`  flags:    ${flagsInserted} upserted, ${flagsSkipped} already present`);
  console.log(`  settings: ${settingsInserted} upserted, ${settingsSkipped} already present`);
  console.log("Done.");

  // Close the pg pool so the process can exit cleanly.
  const { pool } = await import("../index");
  await pool.end();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
