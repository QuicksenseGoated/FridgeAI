import { MEAL_CATALOG } from "./mealCatalog";
import type {
  AppSettings,
  GroceryItem,
  PersonaId,
  SavedMeal,
  TabId,
  UserProfile,
} from "../types/app";
import type { HealthStatus, MealWithVideos, ScanResult } from "../types/scan";

function catalogMeal(name: string) {
  const meal = MEAL_CATALOG.find((item) => item.name === name);
  if (!meal) throw new Error(`Demo meal not found: ${name}`);
  return meal;
}

export const DEMO_HEALTH: HealthStatus = {
  ok: true,
  ai: "ready",
  youtube: "ready",
};

export const DEMO_PROFILE: UserProfile = {
  name: "Alex",
  joinedAt: "2026-01-15T10:00:00.000Z",
  onboardingComplete: true,
  scanStreak: 4,
  lastScanDate: "2026-07-17",
  avoidAllergies: [],
};

export const DEMO_PERSONA: PersonaId = "balanced";

export const DEMO_SETTINGS: AppSettings = {
  mealReminders: true,
  saveHistory: true,
  bookMode: true,
};

export const DEMO_GROCERY: GroceryItem[] = [
  { id: "g1", name: "Cherry tomatoes", checked: false },
  { id: "g2", name: "Fresh basil", checked: false },
  { id: "g3", name: "Parmesan", checked: true },
  { id: "g4", name: "Heavy cream", checked: false },
  { id: "g5", name: "Garlic", checked: false },
];

const savedAt = "2026-07-10T12:00:00.000Z";

export const DEMO_SAVED_MEALS: SavedMeal[] = [
  {
    id: "s1",
    savedAt,
    meal: catalogMeal("Creamy Garlic Pasta"),
  },
  {
    id: "s2",
    savedAt,
    meal: catalogMeal("Chicken Curry"),
  },
  {
    id: "s3",
    savedAt,
    meal: catalogMeal("Greek Salad Bowl"),
  },
];

export const DEMO_SCAN_RESULT: ScanResult = {
  ingredients: [
    "eggs",
    "cherry tomatoes",
    "spinach",
    "feta cheese",
    "olive oil",
    "garlic",
    "onion",
  ],
  meals: [
    catalogMeal("Greek Salad Bowl"),
    catalogMeal("Creamy Garlic Pasta"),
    catalogMeal("Beef Tacos"),
  ],
  notes: "Plenty of fresh produce and pantry staples for quick dinners.",
  shoppingList: ["lemon", "cucumber"],
  usedAI: true,
};

export const DEMO_MEAL_VIDEOS: MealWithVideos[] = DEMO_SCAN_RESULT.meals.map(
  (meal) => ({ meal, videos: [] }),
);

export type DemoView = "home" | "home-results" | "grocery" | "saved" | "meals" | "you";

export function demoTabForView(view: DemoView): TabId {
  if (view === "home-results") return "home";
  return view;
}

export function demoScanForView(view: DemoView): {
  result: ScanResult | null;
  mealVideos: MealWithVideos[];
  preview: string | null;
} {
  if (view !== "home-results") {
    return { result: null, mealVideos: [], preview: null };
  }

  return {
    result: DEMO_SCAN_RESULT,
    mealVideos: DEMO_MEAL_VIDEOS,
    preview:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=75",
  };
}
