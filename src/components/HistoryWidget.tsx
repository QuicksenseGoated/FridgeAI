import { useState } from "react";
import { HistoryDetail } from "../components/HistoryDetail";
import type { SavedMeal, ScanHistoryEntry } from "../types/app";
import type { MealSuggestion } from "../types/scan";
import { PERSONAS } from "../types/app";

interface HistoryWidgetProps {
  history: ScanHistoryEntry[];
  savedMeals: SavedMeal[];
  onToggleSave: (meal: MealSuggestion) => void;
  onClearHistory: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryWidget({
  history,
  savedMeals,
  onToggleSave,
  onClearHistory,
}: HistoryWidgetProps) {
  const [selected, setSelected] = useState<ScanHistoryEntry | null>(null);
  const preview = history.slice(0, 3);

  if (history.length === 0) {
    return (
      <div className="history-widget history-widget--empty">
        <p>No scans saved yet. Turn on scan history in Preferences, then snap your fridge.</p>
      </div>
    );
  }

  return (
    <div className="history-widget">
      <div className="history-widget__list">
        {preview.map((entry) => {
          const persona = PERSONAS.find((item) => item.id === entry.persona);
          return (
            <button
              key={entry.id}
              type="button"
              className="history-widget__item"
              onClick={() => setSelected(entry)}
            >
              <div>
                <p className="history-widget__date">{formatDate(entry.scannedAt)}</p>
                <p className="history-widget__meta">
                  {entry.mealCount} meals · {entry.ingredientCount} ingredients
                </p>
              </div>
              <span className="history-widget__goal" aria-hidden>
                {persona?.emoji}
              </span>
            </button>
          );
        })}
      </div>

      {history.length > 3 && (
        <p className="history-widget__more">+{history.length - 3} more scans on this device</p>
      )}

      <button type="button" className="btn btn--ghost history-widget__clear" onClick={onClearHistory}>
        Clear history
      </button>

      {selected && (
        <HistoryDetail
          entry={selected}
          savedMeals={savedMeals}
          onClose={() => setSelected(null)}
          onToggleSave={onToggleSave}
        />
      )}
    </div>
  );
}
