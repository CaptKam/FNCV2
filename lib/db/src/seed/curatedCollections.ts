/**
 * Starter curated collections for the mobile Search screen.
 *
 * Each collection is a themed shelf (Spotify "Staff Picks" style)
 * that renders as a horizontal carousel above the regular search
 * results when the query is empty. Admins can edit, reorder, and
 * deactivate collections from the /curated-collections page.
 *
 * This seed is idempotent — rerunning it preserves any admin edits
 * and only syncs metadata (title/subtitle/sortOrder) for existing
 * slugs. The recipe_ids list is NOT overwritten on conflict so
 * admin curations in production stay put.
 *
 * Recipe ids below are the actual slugs from
 * artifacts/mobile/data/recipes.ts. They're organized by theme:
 *   - Quick Weeknight (<30 min total)
 *   - Date Night (richer, longer recipes)
 *   - Comfort Food (braises, stews, pastas)
 *   - Around the World (one from each country)
 *   - Sweet Treats (dessert collection)
 *
 * Pick recipes conservatively — if a recipe isn't in the file yet
 * the mobile Search screen just skips it gracefully, but the
 * collection looks thin until more recipes are added.
 *
 * Run with:
 *   pnpm --filter @workspace/db seed:curated-collections
 */
import { sql } from "drizzle-orm";
import { db } from "../index";
import {
  curatedCollectionsTable,
  type InsertCuratedCollection,
} from "../schema/curatedCollections";

const SEED_COLLECTIONS: InsertCuratedCollection[] = [
  {
    slug: "quick-weeknight",
    title: "Quick Weeknight Dinners",
    subtitle: "30 minutes or less, start to finish",
    heroImage:
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
    recipeIds: ["it-1", "fr-1", "jp-2", "mx-1"],
    sortOrder: 10,
    isActive: true,
  },
  {
    slug: "date-night",
    title: "Date Night",
    subtitle: "Slower, richer dishes for two",
    heroImage:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
    recipeIds: ["it-2", "fr-2", "sp-1"],
    sortOrder: 20,
    isActive: true,
  },
  {
    slug: "comfort-food",
    title: "Comfort Food",
    subtitle: "Braises, stews, and everything cozy",
    heroImage:
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop",
    recipeIds: ["fr-1", "it-3", "mx-2", "in-1"],
    sortOrder: 30,
    isActive: true,
  },
  {
    slug: "around-the-world",
    title: "Around the World",
    subtitle: "One dish from every country",
    heroImage:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop",
    recipeIds: ["it-1", "fr-1", "jp-1", "mx-1", "th-1", "in-1", "ma-1", "sp-1"],
    sortOrder: 40,
    isActive: true,
  },
];

async function seed(): Promise<void> {
  if (!process.env["DATABASE_URL"]) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  console.log(`Seeding ${SEED_COLLECTIONS.length} curated collections…`);

  let inserted = 0;
  let skipped = 0;

  for (const row of SEED_COLLECTIONS) {
    const result = await db
      .insert(curatedCollectionsTable)
      .values(row)
      .onConflictDoUpdate({
        target: curatedCollectionsTable.slug,
        // Only sync the metadata — never clobber admin-edited
        // recipeIds or isActive in production.
        set: {
          title: row.title,
          subtitle: row.subtitle,
          heroImage: row.heroImage,
          sortOrder: row.sortOrder,
          updatedAt: sql`now()`,
        },
      })
      .returning({
        id: curatedCollectionsTable.id,
        createdAt: curatedCollectionsTable.createdAt,
        updatedAt: curatedCollectionsTable.updatedAt,
      });

    const r = result[0];
    if (r && Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 2000) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`  inserted: ${inserted}`);
  console.log(`  already present: ${skipped} (metadata updated only)`);
  console.log("Done.");

  const { pool } = await import("../index");
  await pool.end();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
