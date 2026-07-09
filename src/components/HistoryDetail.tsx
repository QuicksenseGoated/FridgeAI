import { MealCard } from "./MealCard";
import type { ScanHistoryEntry } from "../types/app";
import { PERSONAS } from "../types/app";
import type { SavedMeal } from "../types/app";

interface HistoryDetailProps {
  entry: ScanHistoryEntry;
  savedMeals: SavedMeal[];
  onClose: () => void;
  onToggleSave: (meal: ScanHistoryEntry["snapshot"]["meals"][number]) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryDetail({ entry, savedMeals, onClose, onToggleSave }: HistoryDetailProps) {
  const persona = PERSONAS.find((item) => item.id === entry.persona);
  const snapshot = entry.snapshot;

  if (!snapshot?.meals?.length) {
    return (
      <div className="history-detail" role="dialog" aria-modal="true" aria-label="Past scan details">
        <div className="history-detail__sheet">
          <div className="history-detail__head">
            <button type="button" className="history-detail__close" onClick={onClose} aria-label="Close">
              ✕
            </button>
            <p className="history-detail__date">{formatDate(entry.scannedAt)}</p>
            <h2>{entry.mealCount} meals from this scan</h2>
            <p className="history-detail__meta">
              <span aria-hidden>{persona?.emoji}</span> {persona?.label}
            </p>
          </div>
          <div className="card">
            <p>Full recipes weren&apos;t saved for this older scan. Run a new scan to get cook mode and videos.</p>
            <div className="chips">
              {entry.mealNames.map((name) => (
                <span key={name} className="chip chip--soft">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-detail" role="dialog" aria-modal="true" aria-label="Past scan details">
      <div className="history-detail__sheet">
        <div className="history-detail__head">
          <button type="button" className="history-detail__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <p className="history-detail__date">{formatDate(entry.scannedAt)}</p>
          <h2>{entry.mealCount} meals from this scan</h2>
          <p className="history-detail__meta">
            <span aria-hidden>{persona?.emoji}</span> {persona?.label}
          </p>
        </div>

        <div className="history-detail__body">
          <div className="card">
            <div className="card__head">
              <h2>Ingredients spotted</h2>
            </div>
            <div className="chips">
              {snapshot.ingredients.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="meal-list">
            {snapshot.meals.map((meal, index) => (
              <MealCard
                key={`${meal.name}-${index}`}
                mealData={{ meal, videos: [] }}
                index={index}
                health={null}
                savedMeals={savedMeals}
                onToggleSave={onToggleSave}
                isPick={index === 0}
                accordion
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
