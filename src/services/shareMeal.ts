import type { MealSuggestion } from "../types/scan";
import { youtubeSearchUrl } from "./scanApi";

export async function shareMeal(meal: MealSuggestion): Promise<boolean> {
  const text = [
    `${meal.name} — from Fridge AI`,
    meal.why,
    meal.uses.length > 0 ? `Uses: ${meal.uses.join(", ")}` : "",
    `Recipe video: ${youtubeSearchUrl(meal.youtubeQuery)}`,
  ]
    .filter(Boolean)
    .join("\n");

  if (navigator.share) {
    try {
      await navigator.share({ title: meal.name, text });
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false;
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
