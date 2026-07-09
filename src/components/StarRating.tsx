import { useState } from "react";
import { openStoreReview } from "../services/storeReview";

const STORAGE_KEY = "fridgeai:star-rating";

function loadSavedRating(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const value = raw ? Number(raw) : 0;
    return value >= 1 && value <= 5 ? value : 0;
  } catch {
    return 0;
  }
}

function saveRating(value: number) {
  localStorage.setItem(STORAGE_KEY, String(value));
}

interface StarRatingProps {
  size?: "large" | "medium" | "compact";
  onRated?: (stars: number, openedStore: boolean) => void;
}

export function StarRating({ size = "large", onRated }: StarRatingProps) {
  const [savedRating, setSavedRating] = useState(loadSavedRating);
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = hoverRating || savedRating;

  const handleSelect = (stars: number) => {
    setSavedRating(stars);
    saveRating(stars);
    const openedStore = openStoreReview();
    onRated?.(stars, openedStore);
  };

  return (
    <div
      className={`star-rating star-rating--${size}`}
      role="group"
      aria-label="Rate Fridge AI"
      onMouseLeave={() => setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayRating;
        return (
          <button
            key={star}
            type="button"
            className={`star-rating__star${filled ? " star-rating__star--filled" : ""}`}
            aria-label={`Rate ${star} out of 5 stars`}
            onMouseEnter={() => setHoverRating(star)}
            onFocus={() => setHoverRating(star)}
            onBlur={() => setHoverRating(0)}
            onClick={() => handleSelect(star)}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path
                d="M12 2.5l2.76 5.59 6.17.9-4.47 4.35 1.05 6.14L12 17.77l-5.51 2.9 1.05-6.14-4.47-4.35 6.17-.9L12 2.5Z"
                fill={filled ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
