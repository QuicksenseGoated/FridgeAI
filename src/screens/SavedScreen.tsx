import { PageHeader } from "../components/PageHeader";
import { youtubeSearchUrl } from "../services/scanApi";
import type { SavedMeal } from "../types/app";

interface SavedScreenProps {
  savedMeals: SavedMeal[];
  onRemoveMeal: (id: string) => void;
  onStartScan: () => void;
}

export function SavedScreen({ savedMeals, onRemoveMeal, onStartScan }: SavedScreenProps) {
  return (
    <div className="screen">
      <PageHeader
        title="Saved"
        subtitle="Meals you hearted after a scan."
      />

      {savedMeals.length === 0 ? (
        <div className="empty-state card">
          <p className="empty-state__emoji" aria-hidden>
            ❤️
          </p>
          <h2>No saved meals yet</h2>
          <p>Tap the heart on any meal you want to keep. They&apos;ll show up here.</p>
          <button type="button" className="btn btn--primary" onClick={onStartScan}>
            Scan your fridge
          </button>
        </div>
      ) : (
        <section className="saved-meals">
          {savedMeals.map((entry) => (
            <article key={entry.id} className="saved-meal card">
              <div className="saved-meal__top">
                <div>
                  <h3>{entry.meal.name}</h3>
                  <p className="saved-meal__meta">
                    Saved {new Date(entry.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  className="saved-meal__remove"
                  onClick={() => onRemoveMeal(entry.id)}
                  aria-label={`Remove ${entry.meal.name}`}
                >
                  ✕
                </button>
              </div>
              <p className="saved-meal__why">{entry.meal.why}</p>
              <div className="saved-meal__uses">
                {entry.meal.uses.map((item) => (
                  <span key={item} className="chip chip--soft">
                    {item}
                  </span>
                ))}
              </div>
              <a
                href={youtubeSearchUrl(entry.meal.youtubeQuery)}
                target="_blank"
                rel="noreferrer"
                className="btn btn--ghost"
              >
                Watch recipe video →
              </a>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
