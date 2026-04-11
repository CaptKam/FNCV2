/**
 * Seed regions + country_metadata from the hardcoded values in
 * artifacts/mobile/data/countries.ts.
 *
 * Strategy:
 *   1. Upsert each distinct region name from the country list into
 *      the `regions` table, with a sensible default sortOrder.
 *   2. For each country, upsert a `country_metadata` row linking
 *      countryId → regionId, with isFeatured=true as the default
 *      (matches pre-feature-flag behavior where every country was
 *      in the Discover rotation).
 *
 * Idempotent — re-running preserves any admin edits. The regions
 * table only gets its name/sortOrder synced on conflict; the
 * country_metadata table only gets its regionId re-linked on
 * conflict (isFeatured is preserved).
 *
 * This file duplicates the country list from the mobile TS file
 * because lib/db can't import from artifacts/mobile without the
 * same tsx loader tricks we used for api-server. Adding a new
 * country means updating both the mobile TS file AND this seed
 * (or just running the seed by hand with new values).
 *
 * Run with:
 *   pnpm --filter @workspace/db seed:regions
 */
import { eq, sql } from "drizzle-orm";
import { db } from "../index";
import { regionsTable, type InsertRegion } from "../schema/regions";
import {
  countryMetadataTable,
  type InsertCountryMetadata,
} from "../schema/countryMetadata";

// Mirror of the region strings currently in
// artifacts/mobile/data/countries.ts, with a display ordering that
// groups Europe → Asia → Americas → Africa.
const SEED_REGIONS: (InsertRegion & { sortOrder: number })[] = [
  { name: "Southern Europe", sortOrder: 10 },
  { name: "Western Europe", sortOrder: 20 },
  { name: "East Asia", sortOrder: 30 },
  { name: "Southeast Asia", sortOrder: 40 },
  { name: "South Asia", sortOrder: 50 },
  { name: "North America", sortOrder: 60 },
  { name: "North Africa", sortOrder: 70 },
];

// Mirror of the countries + their region assignments from
// artifacts/mobile/data/countries.ts.
const SEED_COUNTRIES: { countryId: string; regionName: string }[] = [
  { countryId: "italy", regionName: "Southern Europe" },
  { countryId: "spain", regionName: "Southern Europe" },
  { countryId: "france", regionName: "Western Europe" },
  { countryId: "japan", regionName: "East Asia" },
  { countryId: "thailand", regionName: "Southeast Asia" },
  { countryId: "india", regionName: "South Asia" },
  { countryId: "mexico", regionName: "North America" },
  { countryId: "morocco", regionName: "North Africa" },
];

async function seed(): Promise<void> {
  if (!process.env["DATABASE_URL"]) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  console.log(
    `Seeding ${SEED_REGIONS.length} regions and ${SEED_COUNTRIES.length} country metadata rows…`,
  );

  // Step 1: upsert regions. We need their ids back to use in step 2.
  const regionIdByName = new Map<string, number>();
  for (const row of SEED_REGIONS) {
    const [upserted] = await db
      .insert(regionsTable)
      .values(row)
      .onConflictDoUpdate({
        target: regionsTable.name,
        set: {
          sortOrder: row.sortOrder,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: regionsTable.id, name: regionsTable.name });
    if (upserted) regionIdByName.set(upserted.name, upserted.id);
  }

  let regionsApplied = 0;
  for (const [, id] of regionIdByName) if (id) regionsApplied++;
  console.log(`  regions: ${regionsApplied} upserted`);

  // Step 2: upsert country metadata linking each country to its region.
  // isFeatured defaults to true in the schema, so existing countries
  // stay featured; re-seeding only updates regionId so a country
  // toggled hidden by an admin stays hidden.
  let metaUpserted = 0;
  for (const country of SEED_COUNTRIES) {
    const regionId = regionIdByName.get(country.regionName);
    if (regionId === undefined) {
      console.warn(
        `  ! country "${country.countryId}" references unknown region "${country.regionName}", skipping`,
      );
      continue;
    }
    const values: InsertCountryMetadata = {
      countryId: country.countryId,
      regionId,
      isFeatured: true,
    };
    await db
      .insert(countryMetadataTable)
      .values(values)
      .onConflictDoUpdate({
        target: countryMetadataTable.countryId,
        // Only sync the region link on re-seed. isFeatured is
        // admin-editable and must not be clobbered.
        set: {
          regionId,
          updatedAt: sql`now()`,
        },
      });
    metaUpserted++;
  }

  console.log(`  country_metadata: ${metaUpserted} upserted`);
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
