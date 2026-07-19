import type { AllergyId } from "../types/app";
import type { CatalogMeal } from "../data/mealCatalog";
import type { MealSuggestion, ScanResult } from "../types/scan";

const ALLERGEN_KEYWORDS: Record<AllergyId, string[]> = {
  gluten: [
    "gluten",
    "wheat",
    "flour",
    "bread",
    "pasta",
    "noodle",
    "noodles",
    "barley",
    "rye",
    "couscous",
    "breadcrumb",
    "breadcrumbs",
    "tortilla",
    "pita",
    "seitan",
    "bulgur",
    "semolina",
    "spaghetti",
    "macaroni",
    "udon",
    "soba",
    "crouton",
    "dough",
    "pastry",
    "bagel",
    "muffin",
    "cake",
    "cookie",
    "cracker",
    "pizza",
    "wrap",
    "bun",
    "roll",
    "toast",
    "naan",
    "gnocchi",
    "lasagna",
    "ravioli",
  ],
  dairy: [
    "dairy",
    "milk",
    "cheese",
    "butter",
    "cream",
    "yogurt",
    "yoghurt",
    "parmesan",
    "mozzarella",
    "cheddar",
    "feta",
    "ricotta",
    "brie",
    "ghee",
    "whey",
    "lactose",
    "custard",
    "ice cream",
    "sour cream",
    "cream cheese",
    "half-and-half",
    "gruyere",
    "provolone",
  ],
  nuts: [
    "peanut",
    "peanuts",
    "almond",
    "almonds",
    "walnut",
    "walnuts",
    "pecan",
    "pecans",
    "cashew",
    "cashews",
    "pistachio",
    "pistachios",
    "hazelnut",
    "hazelnuts",
    "macadamia",
    "pine nut",
    "pine nuts",
    "praline",
    "marzipan",
    "nut butter",
    "peanut butter",
    "almond milk",
    "groundnut",
  ],
  shellfish: [
    "shellfish",
    "shrimp",
    "prawn",
    "prawns",
    "crab",
    "lobster",
    "crayfish",
    "crawfish",
    "scallop",
    "scallops",
    "mussel",
    "mussels",
    "clam",
    "clams",
    "oyster",
    "oysters",
    "squid",
    "calamari",
    "octopus",
    "langoustine",
  ],
  eggs: ["egg", "eggs", "mayonnaise", "mayo", "meringue", "aioli", "frittata", "omelette"],
  soy: ["soy", "soya", "tofu", "tempeh", "edamame", "miso", "soy sauce", "tamari"],
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textContainsAllergen(text: string, allergen: AllergyId): boolean {
  const lower = text.toLowerCase();
  return ALLERGEN_KEYWORDS[allergen].some((keyword) => {
    const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    return pattern.test(lower);
  });
}

function mealTextParts(parts: Array<string | string[] | undefined>): string {
  return parts
    .flatMap((part) => (Array.isArray(part) ? part : part ? [part] : []))
    .join(" ");
}

export function mealConflictsWithAllergies(
  meal: Pick<MealSuggestion, "name" | "why" | "uses" | "steps">,
  avoidAllergies: AllergyId[] | string[] | undefined
): AllergyId | null {
  if (!avoidAllergies?.length) return null;

  const haystack = mealTextParts([meal.name, meal.why, meal.uses, meal.steps]);

  for (const allergen of avoidAllergies) {
    if (allergen in ALLERGEN_KEYWORDS && textContainsAllergen(haystack, allergen as AllergyId)) {
      return allergen as AllergyId;
    }
  }

  return null;
}

export function filterMealsByAllergies<T extends Pick<MealSuggestion, "name" | "why" | "uses" | "steps">>(
  meals: T[],
  avoidAllergies: AllergyId[] | string[] | undefined
): T[] {
  if (!avoidAllergies?.length) return meals;
  return meals.filter((meal) => !mealConflictsWithAllergies(meal, avoidAllergies));
}

export function filterCatalogByAllergies(
  meals: CatalogMeal[],
  avoidAllergies: AllergyId[] | string[] | undefined
): CatalogMeal[] {
  return filterMealsByAllergies(meals, avoidAllergies);
}

export function filterScanResult(result: ScanResult, avoidAllergies: AllergyId[] | undefined): ScanResult {
  if (!avoidAllergies?.length || result.noFoodDetected) return result;

  const meals = filterMealsByAllergies(result.meals, avoidAllergies);
  const filteredCount = result.meals.length - meals.length;

  let notes = result.notes ?? "";
  if (filteredCount > 0) {
    const labels = avoidAllergies.join(", ");
    const suffix = `Filtered ${filteredCount} meal${filteredCount === 1 ? "" : "s"} based on your avoids (${labels}).`;
    notes = notes ? `${notes} ${suffix}` : suffix;
  }

  return { ...result, meals, notes };
}

export function formatAvoidSummary(avoidAllergies: AllergyId[]): string {
  if (avoidAllergies.length === 0) return "None set";
  return avoidAllergies.join(", ");
}
