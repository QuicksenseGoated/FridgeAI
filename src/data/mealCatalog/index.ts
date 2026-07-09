import { CORE_MEALS } from "./coreMeals";
import { EXTRA_MEALS } from "./extraMeals";
import { BAKING_MEALS } from "./bakingMeals";
import { BREAKFAST_MEALS } from "./breakfastMeals";
import {
  COOKBOOK_COLLECTIONS,
  countByCollection,
  getCookbook,
  mealsForCollection,
  type CatalogMeal,
  type CookbookCollection,
  type CookbookId,
  type MealCategory,
} from "./types";

export * from "./types";

export const MEAL_CATALOG: CatalogMeal[] = [
  ...CORE_MEALS,
  ...EXTRA_MEALS,
  ...BREAKFAST_MEALS,
  ...BAKING_MEALS,
];

export { COOKBOOK_COLLECTIONS, countByCollection, getCookbook, mealsForCollection };

export function getCookbookWithCounts(): (CookbookCollection & { count: number })[] {
  const counts = countByCollection(MEAL_CATALOG);
  return COOKBOOK_COLLECTIONS.map((book) => ({
    ...book,
    count: counts[book.id],
  }));
}

export type { CatalogMeal, CookbookCollection, CookbookId, MealCategory };
