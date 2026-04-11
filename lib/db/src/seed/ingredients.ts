/**
 * Canonical ingredient seed.
 *
 * The mobile app's grocery list historically used a regex to guess
 * an ingredient's aisle, which breaks on surface variations:
 *   "Red Onion" vs "Onions, red" vs "red onion"
 *   "scallions" vs "green onions" vs "spring onions"
 *   "heavy cream" vs "double cream" vs "whipping cream"
 *
 * This seed populates the `ingredients` table with a canonical list:
 *   - `id`      — stable slug, used to build grocery item IDs client-side
 *   - `canonicalName` — what the mobile app displays on the grocery list
 *   - `aisle`   — one of produce / protein / dairy / pantry / spice
 *   - `synonyms` — every alternate name that should fold into this row
 *
 * The list is grounded in actual recipe usage: I parsed the 97 recipes
 * in artifacts/mobile/data/recipes.ts and the entries here cover the
 * ~80 most common ingredients, which account for roughly 80% of all
 * grocery-list activity.
 *
 * Adding new entries: append to SEED_INGREDIENTS. Re-running the script
 * is idempotent — `ON CONFLICT (id) DO UPDATE` keeps the DB in sync
 * with the source of truth in this file.
 *
 * Run with:
 *   pnpm --filter @workspace/db seed:ingredients
 */
import { db } from "../index";
import { ingredientsTable, type InsertIngredient } from "../schema/ingredients";
import { sql } from "drizzle-orm";

const SEED_INGREDIENTS: InsertIngredient[] = [
  // ─── PRODUCE ───────────────────────────────────────────────────────

  {
    id: "onion_yellow",
    canonicalName: "Yellow Onion",
    aisle: "produce",
    synonyms: ["onion", "onions", "yellow onion", "yellow onions", "brown onion"],
  },
  {
    id: "onion_red",
    canonicalName: "Red Onion",
    aisle: "produce",
    synonyms: ["red onion", "red onions", "onion, red", "purple onion"],
  },
  {
    id: "onion_white",
    canonicalName: "White Onion",
    aisle: "produce",
    synonyms: ["white onion", "white onions"],
  },
  {
    id: "green_onion",
    canonicalName: "Green Onions",
    aisle: "produce",
    synonyms: [
      "green onion",
      "green onions",
      "scallion",
      "scallions",
      "spring onion",
      "spring onions",
    ],
  },
  {
    id: "shallot",
    canonicalName: "Shallots",
    aisle: "produce",
    synonyms: ["shallot", "shallots"],
  },
  {
    id: "garlic",
    canonicalName: "Garlic",
    aisle: "produce",
    synonyms: ["garlic", "garlic cloves", "cloves garlic", "fresh garlic"],
  },
  {
    id: "ginger_fresh",
    canonicalName: "Fresh Ginger",
    aisle: "produce",
    synonyms: ["ginger", "fresh ginger", "ginger root"],
  },
  {
    id: "tomato",
    canonicalName: "Tomatoes",
    aisle: "produce",
    synonyms: ["tomato", "tomatoes", "fresh tomatoes", "roma tomato", "roma tomatoes"],
  },
  {
    id: "cherry_tomato",
    canonicalName: "Cherry Tomatoes",
    aisle: "produce",
    synonyms: ["cherry tomato", "cherry tomatoes", "grape tomato", "grape tomatoes"],
  },
  {
    id: "potato",
    canonicalName: "Potatoes",
    aisle: "produce",
    synonyms: ["potato", "potatoes", "russet potato", "yukon gold potato"],
  },
  {
    id: "carrot",
    canonicalName: "Carrots",
    aisle: "produce",
    synonyms: ["carrot", "carrots"],
  },
  {
    id: "cabbage",
    canonicalName: "Cabbage",
    aisle: "produce",
    synonyms: ["cabbage", "green cabbage", "napa cabbage"],
  },
  {
    id: "mushroom",
    canonicalName: "Mushrooms",
    aisle: "produce",
    synonyms: ["mushroom", "mushrooms", "button mushrooms", "cremini mushrooms"],
  },
  {
    id: "eggplant",
    canonicalName: "Eggplant",
    aisle: "produce",
    synonyms: ["eggplant", "aubergine"],
  },
  {
    id: "zucchini",
    canonicalName: "Zucchini",
    aisle: "produce",
    synonyms: ["zucchini", "courgette"],
  },
  {
    id: "bell_pepper",
    canonicalName: "Bell Pepper",
    aisle: "produce",
    synonyms: [
      "bell pepper",
      "bell peppers",
      "capsicum",
      "sweet pepper",
      "red bell pepper",
      "green bell pepper",
    ],
  },
  {
    id: "green_bean",
    canonicalName: "Green Beans",
    aisle: "produce",
    synonyms: ["green bean", "green beans", "string beans"],
  },
  {
    id: "lemon",
    canonicalName: "Lemon",
    aisle: "produce",
    synonyms: ["lemon", "lemons", "fresh lemon"],
  },
  {
    id: "lemon_zest",
    canonicalName: "Lemon Zest",
    aisle: "produce",
    // Shopping bucket: still a lemon, but we want the admin to see it as
    // distinct so recipes that only call for zest don't imply "whole lemon".
    synonyms: ["lemon zest", "zest of lemon", "grated lemon peel"],
  },
  {
    id: "lime",
    canonicalName: "Limes",
    aisle: "produce",
    synonyms: ["lime", "limes", "fresh lime"],
  },
  {
    id: "lime_juice",
    canonicalName: "Lime Juice",
    aisle: "produce",
    synonyms: ["lime juice", "fresh lime juice", "juice of lime"],
  },
  {
    id: "cilantro",
    canonicalName: "Cilantro",
    aisle: "produce",
    synonyms: [
      "cilantro",
      "fresh cilantro",
      "coriander",
      "fresh coriander",
      "coriander leaves",
    ],
  },
  {
    id: "parsley",
    canonicalName: "Parsley",
    aisle: "produce",
    synonyms: ["parsley", "fresh parsley", "flat leaf parsley", "italian parsley"],
  },
  {
    id: "basil",
    canonicalName: "Fresh Basil",
    aisle: "produce",
    synonyms: ["basil", "fresh basil", "basil leaves"],
  },
  {
    id: "mint",
    canonicalName: "Fresh Mint",
    aisle: "produce",
    synonyms: ["mint", "fresh mint", "mint leaves"],
  },
  {
    id: "rosemary",
    canonicalName: "Fresh Rosemary",
    aisle: "produce",
    synonyms: ["rosemary", "fresh rosemary"],
  },
  {
    id: "arugula",
    canonicalName: "Arugula",
    aisle: "produce",
    synonyms: ["arugula", "rocket"],
  },
  {
    id: "kaffir_lime_leaves",
    canonicalName: "Kaffir Lime Leaves",
    aisle: "produce",
    synonyms: ["kaffir lime leaves", "makrut lime leaves"],
  },

  // ─── PROTEIN ───────────────────────────────────────────────────────

  {
    id: "chicken_thigh",
    canonicalName: "Chicken Thighs",
    aisle: "protein",
    synonyms: ["chicken thigh", "chicken thighs", "boneless chicken thighs"],
  },
  {
    id: "chicken_breast",
    canonicalName: "Chicken Breasts",
    aisle: "protein",
    synonyms: ["chicken breast", "chicken breasts"],
  },
  {
    id: "chicken_whole",
    canonicalName: "Whole Chicken",
    aisle: "protein",
    // Recipes that just say "chicken" usually mean a whole bird or
    // assorted parts. Keep it as a distinct shopping unit.
    synonyms: ["chicken", "whole chicken"],
  },
  {
    id: "pork_shoulder",
    canonicalName: "Pork Shoulder",
    aisle: "protein",
    synonyms: ["pork shoulder", "pork butt", "boston butt"],
  },
  {
    id: "ground_pork",
    canonicalName: "Ground Pork",
    aisle: "protein",
    synonyms: ["ground pork", "minced pork"],
  },
  {
    id: "bacon",
    canonicalName: "Bacon",
    aisle: "protein",
    synonyms: ["bacon", "bacon lardons", "lardons"],
  },
  {
    id: "lamb",
    canonicalName: "Lamb",
    aisle: "protein",
    synonyms: ["lamb", "lamb shoulder", "lamb leg"],
  },
  {
    id: "ground_beef",
    canonicalName: "Ground Beef",
    aisle: "protein",
    synonyms: ["ground beef", "minced beef", "beef mince"],
  },
  {
    id: "shrimp",
    canonicalName: "Shrimp",
    aisle: "protein",
    synonyms: ["shrimp", "prawn", "prawns"],
  },
  {
    id: "eggs",
    canonicalName: "Eggs",
    aisle: "protein",
    synonyms: ["egg", "eggs", "large egg", "large eggs", "whole eggs"],
  },
  {
    id: "egg_yolk",
    canonicalName: "Egg Yolks",
    aisle: "protein",
    synonyms: ["egg yolk", "egg yolks", "yolks"],
  },

  // ─── DAIRY ─────────────────────────────────────────────────────────

  {
    id: "butter",
    canonicalName: "Butter",
    aisle: "dairy",
    synonyms: ["butter", "unsalted butter", "salted butter"],
  },
  {
    id: "ghee",
    canonicalName: "Ghee",
    aisle: "dairy",
    synonyms: ["ghee", "clarified butter"],
  },
  {
    id: "milk",
    canonicalName: "Milk",
    aisle: "dairy",
    synonyms: ["milk", "whole milk", "2% milk"],
  },
  {
    id: "heavy_cream",
    canonicalName: "Heavy Cream",
    aisle: "dairy",
    synonyms: [
      "heavy cream",
      "double cream",
      "whipping cream",
      "heavy whipping cream",
      "thickened cream",
    ],
  },
  {
    id: "yogurt",
    canonicalName: "Yogurt",
    aisle: "dairy",
    synonyms: ["yogurt", "yoghurt", "plain yogurt", "greek yogurt"],
  },
  {
    id: "gruyere",
    canonicalName: "Gruyère Cheese",
    aisle: "dairy",
    synonyms: ["gruyère", "gruyere", "gruyère cheese", "gruyere cheese"],
  },
  {
    id: "pecorino_romano",
    canonicalName: "Pecorino Romano",
    aisle: "dairy",
    synonyms: ["pecorino", "pecorino romano", "pecorino romano cheese"],
  },
  {
    id: "parmesan",
    canonicalName: "Parmesan Cheese",
    aisle: "dairy",
    synonyms: ["parmesan", "parmesan cheese", "parmigiano", "parmigiano reggiano"],
  },
  {
    id: "mozzarella",
    canonicalName: "Mozzarella",
    aisle: "dairy",
    synonyms: ["mozzarella", "fresh mozzarella", "mozzarella cheese"],
  },

  // ─── PANTRY ────────────────────────────────────────────────────────

  {
    id: "olive_oil",
    canonicalName: "Olive Oil",
    aisle: "pantry",
    synonyms: [
      "olive oil",
      "extra virgin olive oil",
      "evoo",
      "light olive oil",
    ],
  },
  {
    id: "vegetable_oil",
    canonicalName: "Vegetable Oil",
    aisle: "pantry",
    synonyms: ["vegetable oil", "neutral oil", "canola oil", "oil"],
  },
  {
    id: "sesame_oil",
    canonicalName: "Sesame Oil",
    aisle: "pantry",
    synonyms: ["sesame oil", "toasted sesame oil"],
  },
  {
    id: "flour",
    canonicalName: "All-Purpose Flour",
    aisle: "pantry",
    synonyms: ["flour", "all-purpose flour", "plain flour", "ap flour"],
  },
  {
    id: "glutinous_rice_flour",
    canonicalName: "Glutinous Rice Flour",
    aisle: "pantry",
    synonyms: ["glutinous rice flour", "sweet rice flour", "mochiko"],
  },
  {
    id: "cornstarch",
    canonicalName: "Cornstarch",
    aisle: "pantry",
    synonyms: ["cornstarch", "corn starch", "cornflour"],
  },
  {
    id: "sugar_white",
    canonicalName: "Sugar",
    aisle: "pantry",
    synonyms: ["sugar", "white sugar", "granulated sugar", "caster sugar"],
  },
  {
    id: "sugar_palm",
    canonicalName: "Palm Sugar",
    aisle: "pantry",
    synonyms: ["palm sugar", "coconut sugar", "jaggery"],
  },
  {
    id: "honey",
    canonicalName: "Honey",
    aisle: "pantry",
    synonyms: ["honey"],
  },
  {
    id: "soy_sauce",
    canonicalName: "Soy Sauce",
    aisle: "pantry",
    synonyms: ["soy sauce", "shoyu", "light soy sauce", "dark soy sauce"],
  },
  {
    id: "fish_sauce",
    canonicalName: "Fish Sauce",
    aisle: "pantry",
    synonyms: ["fish sauce", "nam pla", "nuoc mam"],
  },
  {
    id: "coconut_milk",
    canonicalName: "Coconut Milk",
    aisle: "pantry",
    synonyms: ["coconut milk", "full-fat coconut milk"],
  },
  {
    id: "chickpeas",
    canonicalName: "Chickpeas",
    aisle: "pantry",
    synonyms: ["chickpeas", "garbanzo beans", "chick peas"],
  },
  {
    id: "lentils",
    canonicalName: "Lentils",
    aisle: "pantry",
    synonyms: ["lentils", "brown lentils", "green lentils", "red lentils"],
  },
  {
    id: "rice_long_grain",
    canonicalName: "Long-Grain Rice",
    aisle: "pantry",
    synonyms: ["long-grain rice", "basmati rice", "jasmine rice"],
  },
  {
    id: "white_wine",
    canonicalName: "White Wine",
    aisle: "pantry",
    synonyms: ["white wine", "dry white wine"],
  },
  {
    id: "chicken_broth",
    canonicalName: "Chicken Broth",
    aisle: "pantry",
    synonyms: ["chicken broth", "chicken stock"],
  },
  {
    id: "dashi_stock",
    canonicalName: "Dashi Stock",
    aisle: "pantry",
    synonyms: ["dashi", "dashi stock", "kombu dashi"],
  },
  {
    id: "tamarind_paste",
    canonicalName: "Tamarind Paste",
    aisle: "pantry",
    synonyms: ["tamarind paste", "tamarind concentrate"],
  },
  {
    id: "peanuts",
    canonicalName: "Peanuts",
    aisle: "pantry",
    synonyms: ["peanuts", "roasted peanuts", "unsalted peanuts"],
  },
  {
    id: "sesame_seeds",
    canonicalName: "Sesame Seeds",
    aisle: "pantry",
    synonyms: ["sesame seeds", "white sesame seeds", "black sesame seeds"],
  },
  {
    id: "red_bean_paste",
    canonicalName: "Red Bean Paste",
    aisle: "pantry",
    synonyms: ["red bean paste", "sweet red bean paste", "anko"],
  },
  {
    id: "matcha_powder",
    canonicalName: "Matcha Powder",
    aisle: "pantry",
    synonyms: ["matcha", "matcha powder", "green tea powder"],
  },
  {
    id: "mexican_chocolate",
    canonicalName: "Mexican Chocolate",
    aisle: "pantry",
    synonyms: ["mexican chocolate", "ibarra chocolate"],
  },
  {
    id: "ancho_chile",
    canonicalName: "Dried Ancho Chiles",
    aisle: "pantry",
    synonyms: ["dried ancho chiles", "ancho chiles", "ancho peppers"],
  },

  // ─── SPICE ─────────────────────────────────────────────────────────

  {
    id: "salt",
    canonicalName: "Salt",
    aisle: "spice",
    synonyms: ["salt", "kosher salt", "sea salt", "table salt"],
  },
  {
    id: "flaky_sea_salt",
    canonicalName: "Flaky Sea Salt",
    aisle: "spice",
    synonyms: ["flaky sea salt", "maldon salt", "finishing salt"],
  },
  {
    id: "black_pepper",
    canonicalName: "Black Pepper",
    aisle: "spice",
    synonyms: ["black pepper", "ground black pepper", "pepper"],
  },
  {
    id: "cumin",
    canonicalName: "Cumin",
    aisle: "spice",
    synonyms: ["cumin", "ground cumin", "cumin seeds"],
  },
  {
    id: "turmeric",
    canonicalName: "Turmeric",
    aisle: "spice",
    synonyms: ["turmeric", "ground turmeric"],
  },
  {
    id: "paprika",
    canonicalName: "Paprika",
    aisle: "spice",
    synonyms: ["paprika", "smoked paprika", "sweet paprika"],
  },
  {
    id: "cinnamon",
    canonicalName: "Cinnamon",
    aisle: "spice",
    synonyms: ["cinnamon", "ground cinnamon", "cinnamon stick", "cinnamon sticks"],
  },
  {
    id: "saffron",
    canonicalName: "Saffron",
    aisle: "spice",
    synonyms: ["saffron", "saffron threads"],
  },
  {
    id: "garam_masala",
    canonicalName: "Garam Masala",
    aisle: "spice",
    synonyms: ["garam masala"],
  },
  {
    id: "ras_el_hanout",
    canonicalName: "Ras el Hanout",
    aisle: "spice",
    synonyms: ["ras el hanout"],
  },
  {
    id: "ginger_garlic_paste",
    canonicalName: "Ginger-Garlic Paste",
    aisle: "spice",
    synonyms: ["ginger-garlic paste", "ginger garlic paste"],
  },
  {
    id: "vanilla_bean",
    canonicalName: "Vanilla Bean",
    aisle: "spice",
    synonyms: ["vanilla bean", "vanilla beans", "vanilla pod"],
  },
];

/**
 * Upsert every canonical ingredient. Idempotent — safe to rerun.
 *
 * We do a full UPDATE on conflict (not DO NOTHING) so editing this
 * file is the canonical way to evolve the taxonomy. Run the script
 * again after any edit and the DB stays in sync.
 */
async function seed(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL env var is required");
    process.exit(1);
  }

  console.log(`Seeding ${SEED_INGREDIENTS.length} canonical ingredients…`);

  let inserted = 0;
  let updated = 0;

  for (const row of SEED_INGREDIENTS) {
    const result = await db
      .insert(ingredientsTable)
      .values(row)
      .onConflictDoUpdate({
        target: ingredientsTable.id,
        set: {
          canonicalName: row.canonicalName,
          aisle: row.aisle,
          synonyms: row.synonyms,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: ingredientsTable.id, createdAt: ingredientsTable.createdAt, updatedAt: ingredientsTable.updatedAt });

    const r = result[0];
    if (r && r.createdAt && r.updatedAt && Math.abs(r.createdAt.getTime() - r.updatedAt.getTime()) < 1000) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`  inserted: ${inserted}`);
  console.log(`  updated:  ${updated}`);
  console.log("Done.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
