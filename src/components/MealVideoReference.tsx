import { useState } from "react";
import { MealVideoPanel } from "./MealVideoPanel";
import type { HealthStatus } from "../types/scan";

interface MealVideoReferenceProps {
  query: string;
  health: HealthStatus | null;
  compact?: boolean;
  className?: string;
  buttonLabel?: string;
}

export function MealVideoReference({
  query,
  health,
  compact = true,
  className = "",
  buttonLabel = "Video as reference",
}: MealVideoReferenceProps) {
  const [open, setOpen] = useState(false);

  if (!query.trim()) return null;

  return (
    <div className={`meal-video-reference${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className={`btn btn--ghost meal-video-reference__btn${open ? " meal-video-reference__btn--open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? "Hide video reference" : buttonLabel}
      </button>

      {open && (
        <MealVideoPanel
          query={query}
          health={health}
          active
          title="Video reference"
          compact={compact}
        />
      )}
    </div>
  );
}
