import type { MealSuggestion } from "../../types/scan";

export type MealCategory =
  | "quick"
  | "pasta"
  | "chicken"
  | "asian"
  | "veggie"
  | "comfort"
  | "seafood"
  | "baking"
  | "breakfast"
  | "dessert";

export type CookbookId =
  | "home-classics"
  | "italian"
  | "asian"
  | "breakfast"
  | "baking"
  | "desserts"
  | "comfort"
  | "quick"
  | "seafood"
  | "garden"
  | "street-food";

export interface CatalogMeal extends MealSuggestion {
  id: string;
  category: MealCategory;
  collections: CookbookId[];
  tags: string[];
  emoji: string;
}

export interface CookbookCollection {
  id: CookbookId;
  title: string;
  subtitle: string;
  emoji: string;
  spine: string;
  cover: string;
  accent: string;
}

export const COOKBOOK_COLLECTIONS: CookbookCollection[] = [
  {
    id: "home-classics",
    title: "Home Kitchen",
    subtitle: "Roasts, skillets & Sunday dinners",
    emoji: "🏠",
    spine: "#8b3a3a",
    cover: "linear-gradient(145deg, #a84848 0%, #6d2e2e 100%)",
    accent: "#f5e6d3",
  },
  {
    id: "italian",
    title: "Italian Table",
    subtitle: "Pasta, risotto & Sunday sauce",
    emoji: "🍝",
    spine: "#2d6a4f",
    cover: "linear-gradient(145deg, #40916c 0%, #1b4332 100%)",
    accent: "#f0fff4",
  },
  {
    id: "asian",
    title: "Asian Pantry",
    subtitle: "Curries, noodles & rice bowls",
    emoji: "🥢",
    spine: "#9d4edd",
    cover: "linear-gradient(145deg, #b185db 0%, #7b2cbf 100%)",
    accent: "#f8f0ff",
  },
  {
    id: "breakfast",
    title: "Rise & Shine",
    subtitle: "Eggs, pancakes & morning rituals",
    emoji: "🌅",
    spine: "#e85d04",
    cover: "linear-gradient(145deg, #f48c06 0%, #dc2f02 100%)",
    accent: "#fff8f0",
  },
  {
    id: "baking",
    title: "The Baking Book",
    subtitle: "Cakes, bread & oven magic",
    emoji: "🎂",
    spine: "#d4a373",
    cover: "linear-gradient(145deg, #e9c46a 0%, #bc6c25 100%)",
    accent: "#fffbf5",
  },
  {
    id: "desserts",
    title: "Sweet Tooth",
    subtitle: "Cookies, puddings & treats",
    emoji: "🍰",
    spine: "#e56b8a",
    cover: "linear-gradient(145deg, #f4a6b8 0%, #c9184a 100%)",
    accent: "#fff5f7",
  },
  {
    id: "comfort",
    title: "Comfort Suppers",
    subtitle: "Stews, bakes & cozy bowls",
    emoji: "🥘",
    spine: "#6c584c",
    cover: "linear-gradient(145deg, #a98467 0%, #6c584c 100%)",
    accent: "#faf3eb",
  },
  {
    id: "quick",
    title: "Quick Suppers",
    subtitle: "On the table in 30 minutes",
    emoji: "⚡",
    spine: "#0077b6",
    cover: "linear-gradient(145deg, #48cae4 0%, #023e8a 100%)",
    accent: "#e8f8ff",
  },
  {
    id: "seafood",
    title: "Ocean & Shore",
    subtitle: "Fish, shellfish & coastal plates",
    emoji: "🐟",
    spine: "#1d7596",
    cover: "linear-gradient(145deg, #2a9d8f 0%, #1d3557 100%)",
    accent: "#e8fffe",
  },
  {
    id: "garden",
    title: "Garden Kitchen",
    subtitle: "Vegetables, grains & meat-free",
    emoji: "🥗",
    spine: "#588157",
    cover: "linear-gradient(145deg, #84a98c 0%, #3a5a40 100%)",
    accent: "#f1faee",
  },
  {
    id: "street-food",
    title: "Modern Favorites",
    subtitle: "Burgers, tacos & viral classics",
    emoji: "🔥",
    spine: "#e36414",
    cover: "linear-gradient(145deg, #fb8500 0%, #bc3908 100%)",
    accent: "#fff4e6",
  },
];

export const N = (cal: string, pro: string, carb: string, fat: string, servings = "2") => ({
  calories: cal,
  protein: pro,
  carbs: carb,
  fat,
  servings,
  note: "Approximate per serving.",
});

export function meal(
  id: string,
  category: MealCategory,
  collections: CookbookId[],
  emoji: string,
  tags: string[],
  data: MealSuggestion
): CatalogMeal {
  return { id, category, collections, emoji, tags, ...data };
}

export function countByCollection(meals: CatalogMeal[]): Record<CookbookId, number> {
  const counts = Object.fromEntries(
    COOKBOOK_COLLECTIONS.map((book) => [book.id, 0])
  ) as Record<CookbookId, number>;

  for (const entry of meals) {
    for (const collection of entry.collections) {
      counts[collection] += 1;
    }
  }

  return counts;
}

export function mealsForCollection(meals: CatalogMeal[], collectionId: CookbookId): CatalogMeal[] {
  return meals.filter((entry) => entry.collections.includes(collectionId));
}

export function getCookbook(id: CookbookId): CookbookCollection | undefined {
  return COOKBOOK_COLLECTIONS.find((book) => book.id === id);
}
