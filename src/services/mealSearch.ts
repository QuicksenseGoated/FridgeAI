import {
  MEAL_CATALOG,
  mealsForCollection,
  type CatalogMeal,
  type CookbookId,
} from "../data/mealCatalog";
import {
  filterCatalogByAllergies,
} from "./allergyFilter";
import type { AllergyId } from "../types/app";
import type { MealSuggestion } from "../types/scan";

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function matchesMeal(meal: CatalogMeal, query: string) {
  if (!query) return true;

  const words = query.split(/\s+/).filter(Boolean);
  const haystack = [
    meal.name,
    meal.why,
    meal.category,
    ...meal.collections,
    ...meal.tags,
    ...meal.uses,
  ]
    .join(" ")
    .toLowerCase();

  return words.every((word) => haystack.includes(word));
}

export function searchCatalogMeals(
  query: string,
  collection?: CookbookId | null,
  avoidAllergies?: AllergyId[]
): CatalogMeal[] {
  const q = normalizeQuery(query);
  const pool = collection ? mealsForCollection(MEAL_CATALOG, collection) : MEAL_CATALOG;

  return filterCatalogByAllergies(
    pool.filter((meal) => matchesMeal(meal, q)),
    avoidAllergies
  );
}

export function catalogMealToSuggestion(meal: CatalogMeal): MealSuggestion {
  return {
    name: meal.name,
    why: meal.why,
    uses: meal.uses,
    youtubeQuery: meal.youtubeQuery,
    prepTime: meal.prepTime,
    cookTime: meal.cookTime,
    steps: meal.steps,
    nutrition: meal.nutrition,
  };
}

export function dedupeMealsByName(meals: MealSuggestion[]): MealSuggestion[] {
  const seen = new Set<string>();
  return meals.filter((meal) => {
    const key = meal.name.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function findCatalogMeal(name: string): CatalogMeal | undefined {
  const key = name.trim().toLowerCase();
  return MEAL_CATALOG.find((meal) => meal.name.toLowerCase() === key);
}
