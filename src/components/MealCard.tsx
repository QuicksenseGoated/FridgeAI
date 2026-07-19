import { useState, type MouseEvent } from "react";
import { shareMeal } from "../services/shareMeal";
import type { HealthStatus, MealSuggestion, MealTab, MealWithVideos } from "../types/scan";
import type { SavedMeal } from "../types/app";
import { isMealSaved } from "../services/appStorage";
import { findCatalogMeal } from "../services/mealSearch";
import { CookMode } from "./CookMode";
import { MealPhoto } from "./MealPhoto";
import { MealVideoPanel } from "./MealVideoPanel";

const TABS: { id: MealTab; label: string }[] = [
  { id: "videos", label: "Videos" },
  { id: "overview", label: "Overview" },
  { id: "recipe", label: "Recipe" },
  { id: "nutrition", label: "Nutrition" },
];

interface MealCardProps {
  mealData: MealWithVideos;
  index: number;
  health: HealthStatus | null;
  savedMeals: SavedMeal[];
  onToggleSave: (meal: MealSuggestion) => void;
  isPick?: boolean;
  onShare?: (shared: boolean) => void;
  accordion?: boolean;
  defaultExpanded?: boolean;
  usesLabel?: string;
  onAddToGrocery?: () => void;
  onExpand?: () => void;
  subtitle?: string;
  emoji?: string;
  tone?: number;
}

export function MealCard({
  mealData,
  index: _index,
  health,
  savedMeals,
  onToggleSave,
  isPick,
  onShare,
  accordion = false,
  defaultExpanded = false,
  usesLabel = "Uses from your fridge",
  onAddToGrocery,
  onExpand,
  subtitle,
  emoji,
  tone,
}: MealCardProps) {
  const { meal, videos, videoError } = mealData;
  const saved = isMealSaved(meal.name, savedMeals);
  const catalogMeal = findCatalogMeal(meal.name);
  const imageMeal = catalogMeal ?? { name: meal.name };
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<MealTab>(
    videos.length > 0 ? "videos" : "overview"
  );
  const [cookMode, setCookMode] = useState(false);

  const totalTime =
    meal.prepTime && meal.cookTime
      ? `~${meal.prepTime} prep · ${meal.cookTime} cook`
      : meal.prepTime
        ? `~${meal.prepTime}`
        : meal.cookTime
          ? `~${meal.cookTime} cook`
          : null;

  const isCollapsed = accordion && !expanded;

  const handleShare = async (event: MouseEvent) => {
    event.stopPropagation();
    const ok = await shareMeal(meal);
    onShare?.(ok);
  };

  const handleSave = (event: MouseEvent) => {
    event.stopPropagation();
    onToggleSave(meal);
  };

  const toggleExpanded = () => {
    if (accordion) {
      setExpanded((open) => {
        const next = !open;
        if (next) onExpand?.();
        return next;
      });
    }
  };

  return (
    <>
      <article
        className={`meal card${tone !== undefined ? ` meal--tone-${tone % 6}` : ""}${isPick && !isCollapsed ? " meal--pick" : ""}${accordion ? " meal--accordion" : ""}${isCollapsed ? " meal--collapsed" : ""}`}
      >
        <div
          className="meal__top"
          role={accordion && isCollapsed ? "button" : undefined}
          tabIndex={accordion && isCollapsed ? 0 : undefined}
          aria-expanded={accordion ? expanded : undefined}
          onClick={accordion && isCollapsed ? toggleExpanded : undefined}
          onKeyDown={
            accordion && isCollapsed
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleExpanded();
                  }
                }
              : undefined
          }
        >
          <MealPhoto meal={imageMeal} variant="thumb" className="meal__photo" />
          <div className="meal__title-wrap">
            <h3>{meal.name}</h3>
            {subtitle && <p className="meal__subtitle">{subtitle}</p>}
            {totalTime && <p className="meal__time">{totalTime}</p>}
          </div>
          <div className="meal__actions">
            {isCollapsed ? (
              <span className="meal__chevron" aria-hidden>
                ▼
              </span>
            ) : (
              <>
                <button
                  type="button"
                  className="meal__action-btn"
                  onClick={handleShare}
                  aria-label={`Share ${meal.name}`}
                >
                  ↗
                </button>
                <button
                  type="button"
                  className={`meal__save${saved ? " meal__save--active" : ""}`}
                  onClick={handleSave}
                  aria-label={saved ? `Unsave ${meal.name}` : `Save ${meal.name}`}
                  aria-pressed={saved}
                >
                  {saved ? "❤️" : "🤍"}
                </button>
                {accordion && (
                  <button
                    type="button"
                    className="meal__chevron-btn"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleExpanded();
                    }}
                    aria-label="Collapse meal"
                  >
                    ▲
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <>
            {isPick && <p className="meal__pick-badge">Tonight&apos;s pick</p>}

            <MealPhoto meal={imageMeal} variant="banner" className="meal__banner" />

            <div className="meal-tabs" role="tablist" aria-label={`${meal.name} details`}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`meal-tabs__btn${activeTab === tab.id ? " meal-tabs__btn--active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.id === "videos" && videos.length > 0 && (
                    <span className="meal-tabs__count">{videos.length}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="meal-panel">
              {activeTab === "overview" && (
                <div className="meal-panel__section">
                  <p className="meal__why">{meal.why}</p>
                  <p className="meal-panel__label">{usesLabel}</p>
                  <div className="meal__uses">
                    {meal.uses.map((item) => (
                      <span key={item} className="chip chip--soft">
                        {item}
                      </span>
                    ))}
                  </div>
                  {onAddToGrocery && meal.uses.length > 0 && (
                    <button
                      type="button"
                      className="btn btn--secondary meal__shop-btn"
                      onClick={onAddToGrocery}
                    >
                      Add to shop list
                    </button>
                  )}
                </div>
              )}

              {activeTab === "recipe" && (
                <div className="meal-panel__section">
                  {meal.steps.length > 0 ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary meal__cook-btn"
                        onClick={() => setCookMode(true)}
                      >
                        Start cook mode
                      </button>
                      <ol className="recipe-steps">
                        {meal.steps.map((step, stepIndex) => (
                          <li key={`${meal.name}-step-${stepIndex}`}>
                            <span className="recipe-steps__num">{stepIndex + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </>
                  ) : (
                    <p className="meal-panel__empty">
                      No written steps returned for this meal. Check the Videos tab for a
                      walkthrough.
                    </p>
                  )}
                </div>
              )}

              {activeTab === "nutrition" && (
                <div className="meal-panel__section">
                  <div className="nutrition-grid">
                    <div className="nutrition-card nutrition-card--highlight">
                      <span className="nutrition-card__label">Calories</span>
                      <strong>{meal.nutrition.calories}</strong>
                    </div>
                    <div className="nutrition-card">
                      <span className="nutrition-card__label">Protein</span>
                      <strong>{meal.nutrition.protein}</strong>
                    </div>
                    <div className="nutrition-card">
                      <span className="nutrition-card__label">Carbs</span>
                      <strong>{meal.nutrition.carbs}</strong>
                    </div>
                    <div className="nutrition-card">
                      <span className="nutrition-card__label">Fat</span>
                      <strong>{meal.nutrition.fat}</strong>
                    </div>
                    {meal.nutrition.fiber && (
                      <div className="nutrition-card">
                        <span className="nutrition-card__label">Fiber</span>
                        <strong>{meal.nutrition.fiber}</strong>
                      </div>
                    )}
                    <div className="nutrition-card">
                      <span className="nutrition-card__label">Servings</span>
                      <strong>{meal.nutrition.servings}</strong>
                    </div>
                  </div>
                  {meal.nutrition.note && (
                    <p className="nutrition-note">{meal.nutrition.note}</p>
                  )}
                  <p className="nutrition-disclaimer">
                    AI-generated estimates — not medical or dietary advice.
                  </p>
                </div>
              )}

              {activeTab === "videos" && (
                <div className="meal-panel__section">
                  <MealVideoPanel
                    query={meal.youtubeQuery}
                    health={health}
                    active={activeTab === "videos"}
                    videos={videos}
                    videoError={videoError}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </article>

      {cookMode && meal.steps.length > 0 && (
        <CookMode
          health={health}
          meal={{
            name: meal.name,
            emoji,
            imageMeal,
            steps: meal.steps,
            uses: meal.uses,
            prepTime: meal.prepTime,
            cookTime: meal.cookTime,
            youtubeQuery: meal.youtubeQuery,
            nutrition: meal.nutrition,
          }}
          onClose={() => setCookMode(false)}
        />
      )}
    </>
  );
}
