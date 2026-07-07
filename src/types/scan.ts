export interface MealSuggestion {
  name: string;
  why: string;
  uses: string[];
  youtubeQuery: string;
  prepTime?: string;
}

export interface ScanResult {
  ingredients: string[];
  meals: MealSuggestion[];
  notes: string;
  usedAI: boolean;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
}

export interface HealthStatus {
  ok: boolean;
  ai: "ready" | "none";
  youtube: "ready" | "invalid" | "none";
}
