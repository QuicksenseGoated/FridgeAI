import { useState } from "react";
import {
  getMealImageAlt,
  getMealImageStyle,
  getMealImageUrl,
  type MealImageSource,
} from "../services/mealImages";

interface MealPhotoProps {
  meal: MealImageSource;
  variant?: "thumb" | "hero" | "banner" | "toc";
  className?: string;
}

export function MealPhoto({ meal, variant = "thumb", className }: MealPhotoProps) {
  const [failed, setFailed] = useState(false);
  const src = getMealImageUrl(meal);
  const style = getMealImageStyle(meal);

  if (failed) {
    return (
      <div
        className={`meal-photo meal-photo--${variant} meal-photo--fallback${className ? ` ${className}` : ""}`}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={src}
      alt={getMealImageAlt(meal)}
      className={`meal-photo meal-photo--${variant}${className ? ` ${className}` : ""}`}
      style={style}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
