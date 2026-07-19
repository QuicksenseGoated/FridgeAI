const ALLERGEN_KEYWORDS: Record<string, string[]> = {
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

function textContainsAllergen(text: string, allergen: string): boolean {
  const keywords = ALLERGEN_KEYWORDS[allergen];
  if (!keywords) return false;

  const lower = text.toLowerCase();
  return keywords.some((keyword) => {
    const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, "i");
    return pattern.test(lower);
  });
}

interface MealLike {
  name: string;
  why?: string;
  uses?: string[];
  steps?: string[];
}

export function mealConflictsWithAllergies(
  meal: MealLike,
  avoidAllergies: string[] | undefined
): string | null {
  if (!avoidAllergies?.length) return null;

  const haystack = [meal.name, meal.why, ...(meal.uses ?? []), ...(meal.steps ?? [])]
    .filter(Boolean)
    .join(" ");

  for (const allergen of avoidAllergies) {
    if (textContainsAllergen(haystack, allergen)) return allergen;
  }

  return null;
}

export function filterMealsByAllergies<T extends MealLike>(
  meals: T[],
  avoidAllergies: string[] | undefined
): T[] {
  if (!avoidAllergies?.length) return meals;
  return meals.filter((meal) => !mealConflictsWithAllergies(meal, avoidAllergies));
}
