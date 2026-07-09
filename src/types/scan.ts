export interface MealNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  servings: string;
  note?: string;
}

export interface MealSuggestion {
  name: string;
  why: string;
  uses: string[];
  youtubeQuery: string;
  prepTime?: string;
  cookTime?: string;
  steps: string[];
  nutrition: MealNutrition;
}

export interface ScanResult {
  ingredients: string[];
  meals: MealSuggestion[];
  notes: string;
  shoppingList?: string[];
  usedAI: boolean;
  noFoodDetected?: boolean;
  funnyMessage?: string;
  detectedObject?: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
  duration?: string;
  publishedAt?: string;
}

export interface HealthStatus {
  ok: boolean;
  ai: "ready" | "none";
  youtube: "ready" | "invalid" | "none";
}

export interface MealWithVideos {
  meal: MealSuggestion;
  videos: YouTubeVideo[];
  videoError?: string;
}

export type MealTab = "overview" | "recipe" | "nutrition" | "videos";
