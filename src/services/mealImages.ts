import { MEAL_CATALOG } from "../data/mealCatalog";
import {
  CATEGORY_FALLBACK_PHOTO,
  MEAL_PHOTO_BY_ID,
} from "../data/mealPhotoMap";
import { findCatalogMeal } from "./mealSearch";
import type { MealCategory } from "../data/mealCatalog";

const OBJECT_POSITIONS = [
  "center center",
  "50% 35%",
  "50% 60%",
  "30% 50%",
  "70% 40%",
  "40% 25%",
  "60% 70%",
  "25% 55%",
  "75% 30%",
  "center 20%",
  "center 80%",
  "35% 45%",
  "65% 55%",
];

export interface MealImageSource {
  id?: string;
  name: string;
  category?: MealCategory | string;
  tags?: string[];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildUnsplashUrl(photoId: string, width = 900, height = 620): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(width),
    h: String(height),
    q: "80",
  });
  return `https://images.unsplash.com/${photoId}?${params.toString()}`;
}

function resolvePhotoId(meal: MealImageSource): string {
  if (meal.id && MEAL_PHOTO_BY_ID[meal.id]) {
    return MEAL_PHOTO_BY_ID[meal.id]!;
  }

  const catalogMatch = findCatalogMeal(meal.name);
  if (catalogMatch && MEAL_PHOTO_BY_ID[catalogMatch.id]) {
    return MEAL_PHOTO_BY_ID[catalogMatch.id]!;
  }

  return buildFallbackPhotoId(meal);
}

function buildFallbackPhotoId(meal: MealImageSource): string {
  const category = meal.category as MealCategory | string | undefined;
  if (category && CATEGORY_FALLBACK_PHOTO[category]) {
    return CATEGORY_FALLBACK_PHOTO[category]!;
  }

  const pool = Object.values(MEAL_PHOTO_BY_ID);
  const idx = hashString(meal.name.toLowerCase()) % pool.length;
  return pool[idx] ?? CATEGORY_FALLBACK_PHOTO.default!;
}

export function getMealImageUrl(meal: MealImageSource): string {
  return buildUnsplashUrl(resolvePhotoId(meal));
}

export function getMealImageStyle(meal: MealImageSource): {
  objectPosition: string;
} {
  const key = meal.id ?? meal.name;
  return {
    objectPosition: OBJECT_POSITIONS[hashString(key) % OBJECT_POSITIONS.length]!,
  };
}

export function getMealImageAlt(meal: MealImageSource): string {
  return `${meal.name} — finished dish`;
}

/** Ensures every catalog meal has a curated photo (dev/build sanity check). */
export function assertCatalogPhotosComplete(): void {
  const missing = MEAL_CATALOG.filter((meal) => !MEAL_PHOTO_BY_ID[meal.id]);
  if (missing.length > 0) {
    throw new Error(
      `Missing curated photos for: ${missing.map((m) => m.id).join(", ")}`
    );
  }
}

assertCatalogPhotosComplete();
