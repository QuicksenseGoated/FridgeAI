import { useState } from "react";
import { StarRating } from "./StarRating";

const DISMISS_KEY = "fridgeai:rate-banner-dismissed";

function isDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function dismissBanner() {
  localStorage.setItem(DISMISS_KEY, "1");
}

interface RateUsBannerProps {
  scanStreak: number;
  onRated?: (stars: number, openedStore: boolean) => void;
}

export function RateUsBanner({ scanStreak, onRated }: RateUsBannerProps) {
  const [visible, setVisible] = useState(() => !isDismissed());

  if (!visible) return null;

  const handleDismiss = () => {
    dismissBanner();
    setVisible(false);
  };

  return (
    <div className="rate-banner">
      <button
        type="button"
        className="rate-banner__close"
        onClick={handleDismiss}
        aria-label="Dismiss rating prompt"
      >
        ✕
      </button>
      <StarRating size="medium" onRated={onRated} />
      <p className="rate-banner__copy">
        {scanStreak > 1
          ? `${scanStreak}-day streak — enjoy Fridge AI? Tap a star to rate us`
          : "Enjoying Fridge AI? Tap a star to rate us"}
      </p>
    </div>
  );
}
