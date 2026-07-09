import type { HealthStatus, MealSuggestion, MealWithVideos, ScanResult } from "../types/scan";
import type { SavedMeal } from "../types/app";
import { MealCard } from "./MealCard";

interface ScanResultsProps {
  result: ScanResult;
  mealVideos: MealWithVideos[];
  health: HealthStatus | null;
  preview: string | null;
  savedMeals: SavedMeal[];
  onScanAgain: () => void;
  onToggleSave: (meal: MealSuggestion) => void;
  onOpenGrocery: () => void;
  onShare?: (shared: boolean) => void;
}

export function ScanResults({
  result,
  mealVideos,
  health,
  preview,
  savedMeals,
  onScanAgain,
  onToggleSave,
  onOpenGrocery,
  onShare,
}: ScanResultsProps) {
  const shoppingList = result.shoppingList ?? [];

  return (
    <section className="results">
      <div className="results__celebration card">
        <p className="results__celebration-emoji" aria-hidden>
          🎉
        </p>
        <h2>{result.meals.length} meals ready to cook!</h2>
        <p>Tap a meal to expand it. Heart the ones you love.</p>
        {preview && (
          <img src={preview} alt="" className="results__celebration-thumb" aria-hidden />
        )}
      </div>

      <div className="card results__ingredients">
        <div className="card__head">
          <h2>Spotted in your fridge</h2>
          <p>{result.ingredients.length} ingredients</p>
        </div>
        <div className="chips">
          {result.ingredients.map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
        {shoppingList.length > 0 && (
          <>
            <p className="meal-panel__label results__shop-label">You may also need</p>
            <div className="chips">
              {shoppingList.map((item) => (
                <span key={item} className="chip chip--soft">
                  {item}
                </span>
              ))}
            </div>
          </>
        )}
        <button type="button" className="btn btn--ghost results__grocery-btn" onClick={onOpenGrocery}>
          View grocery list →
        </button>
        {result.notes && <p className="results__notes">{result.notes}</p>}
      </div>

      <div className="meal-list">
        {mealVideos.map((mealData, index) => (
          <MealCard
            key={`${mealData.meal.name}-${index}`}
            mealData={mealData}
            index={index}
            health={health}
            savedMeals={savedMeals}
            onToggleSave={onToggleSave}
            onShare={onShare}
            isPick={index === 0}
            accordion
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      <button type="button" className="btn btn--secondary" onClick={onScanAgain}>
        Scan another fridge
      </button>

      <p className="disclaimer">
        Meal suggestions, nutrition, and recipes are AI-generated — not medical or
        dietary advice. Double-check allergens before cooking.
      </p>
    </section>
  );
}
