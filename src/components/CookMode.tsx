import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { expandCookSteps } from "../services/expandCookSteps";
import { getStepVisual } from "../services/cookStepVisuals";
import { MealVideoReference } from "./MealVideoReference";
import { MealPhoto } from "./MealPhoto";
import type { MealImageSource } from "../services/mealImages";
import type { HealthStatus, MealNutrition } from "../types/scan";

export interface CookModeMeal {
  name: string;
  emoji?: string;
  imageMeal?: MealImageSource;
  steps: string[];
  uses: string[];
  prepTime?: string;
  cookTime?: string;
  youtubeQuery?: string;
  nutrition?: MealNutrition;
}

interface CookModeProps {
  meal: CookModeMeal;
  health: HealthStatus | null;
  onClose: () => void;
  embedded?: boolean;
}

type Screen = "overview" | "cooking" | "done";

export function CookMode({ meal, health, onClose, embedded = false }: CookModeProps) {
  const { name, emoji = "🍳", imageMeal, uses, prepTime, cookTime, youtubeQuery } = meal;
  const photoMeal = imageMeal ?? { name };
  const steps = useMemo(() => expandCookSteps(meal.steps), [meal.steps]);

  const [screen, setScreen] = useState<Screen>("overview");
  const [stepIndex, setStepIndex] = useState(0);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(() => new Set());

  const scrollRef = useRef<HTMLDivElement>(null);

  const stepVisual = useMemo(
    () => getStepVisual(steps[stepIndex] ?? "", stepIndex, steps.length, emoji, uses),
    [emoji, stepIndex, steps, uses]
  );

  const totalTime =
    prepTime && cookTime ? `${prepTime} prep · ${cookTime} cook` : prepTime ?? cookTime ?? null;

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [embedded, screen, stepIndex, name]);

  const toggleIngredient = (item: string) => {
    setCheckedIngredients((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const allIngredientsReady = uses.length > 0 && uses.every((item) => checkedIngredients.has(item));

  const goNext = () => {
    if (stepIndex < steps.length - 1) setStepIndex((value) => value + 1);
    else setScreen("done");
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((value) => value - 1);
  };

  const rootClass = `cook-mode${embedded ? " cook-mode--embedded" : " cook-mode--overlay"}`;

  const Surface = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
    if (embedded) {
      return <div className={`cook-mode__content ${className}`.trim()}>{children}</div>;
    }
    return (
      <div className={`cookbook-page__paper cookbook-page__paper--cook ${className}`.trim()}>
        {children}
      </div>
    );
  };

  const CookHead = ({ chapter, trailing }: { chapter: string; trailing?: ReactNode }) => {
    if (embedded) return null;
    return (
      <header className="cookbook-recipe__head">
        <span className="cookbook-recipe__chapter">{chapter}</span>
        {trailing}
      </header>
    );
  };

  const ScrollPad = () => (embedded ? <div className="cook-mode__scroll-pad" aria-hidden /> : null);

  if (screen === "overview") {
    return (
      <div
        ref={embedded ? scrollRef : undefined}
        className={rootClass}
        role="region"
        aria-label={`Cook mode: ${name}`}
      >
        <Surface>
          <CookHead
            chapter="Cook mode"
            trailing={
              <button type="button" className="cook-mode__back" onClick={onClose}>
                ← Recipe
              </button>
            }
          />

          <MealPhoto meal={photoMeal} variant="hero" className="cook-mode__photo" />

          {embedded && <p className="cook-mode__embedded-kicker">Cook mode</p>}

          <div className="cookbook-recipe__hero cookbook-recipe__hero--compact">
            <div>
              <h3 className="cookbook-recipe__title">{name}</h3>
              {totalTime && <p className="cookbook-recipe__time">{totalTime}</p>}
            </div>
          </div>

          <p className="cookbook-recipe__why">
            Check off your ingredients, then step through the method one page at a time.
          </p>

          <h4 className="cookbook-recipe__section">Before you start</h4>
          <p className="cook-mode__hint">Tap each ingredient when it&apos;s on the counter.</p>
          <ul className="cook-mode__ingredients">
            {uses.map((item) => {
              const ready = checkedIngredients.has(item);
              return (
                <li key={item}>
                  <button
                    type="button"
                    className={`cook-mode__ingredient${ready ? " cook-mode__ingredient--done" : ""}`}
                    onClick={() => toggleIngredient(item)}
                    aria-pressed={ready}
                  >
                    <span className="cook-mode__ingredient-check" aria-hidden>
                      {ready ? "✓" : ""}
                    </span>
                    {item}
                  </button>
                </li>
              );
            })}
          </ul>

          <h4 className="cookbook-recipe__section">Roadmap</h4>
          <ol className="cookbook-recipe__steps cook-mode__roadmap">
            {steps.map((step, index) => (
              <li key={`roadmap-${index}`}>
                <span className="cookbook-recipe__step-num">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div className="cookbook-recipe__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setStepIndex(0);
                setScreen("cooking");
              }}
            >
              {allIngredientsReady ? "Start cooking" : "Start anyway"}
            </button>
          </div>

          <ScrollPad />
        </Surface>
      </div>
    );
  }

  if (screen === "done") {
    return (
      <div
        ref={embedded ? scrollRef : undefined}
        className={rootClass}
        role="region"
        aria-label={`Cook mode complete: ${name}`}
      >
        <Surface className="cook-mode__paper--center">
          <MealPhoto meal={photoMeal} variant="hero" className="cook-mode__photo cook-mode__photo--done" />
          <h3 className="cookbook-recipe__title">Bon appétit!</h3>
          <p className="cookbook-recipe__why">
            You finished <strong>{name}</strong>. Back to the recipe anytime.
          </p>
          <button type="button" className="btn btn--primary" onClick={onClose}>
            ← Back to recipe
          </button>
          <ScrollPad />
        </Surface>
      </div>
    );
  }

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div
      ref={embedded ? scrollRef : undefined}
      className={rootClass}
      role="region"
      aria-label={`Cooking ${name}, step ${stepIndex + 1}`}
    >
      <Surface>
        <CookHead
          chapter={name}
          trailing={
            <span className="cookbook-recipe__page-num">
              Step {stepIndex + 1} of {steps.length}
            </span>
          }
        />

        {embedded && (
          <p className="cook-mode__embedded-kicker">
            Step {stepIndex + 1} of {steps.length}
          </p>
        )}

        <div className="cook-mode__progress">
          <div className="cook-mode__progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className={`cook-mode__reference cook-mode__reference--${stepVisual.phase}`}>
          <div className="cook-mode__reference-stage">
            <span className="cook-mode__reference-meal" aria-hidden>
              {emoji}
            </span>
            <span className="cook-mode__reference-action" aria-hidden>
              {stepVisual.emoji}
            </span>
            <p className="cook-mode__reference-scene">{stepVisual.scene}</p>
          </div>
          <div className="cook-mode__reference-meta">
            <span className={`cook-mode__phase cook-mode__phase--${stepVisual.phase}`}>
              {stepVisual.phase}
            </span>
            {stepVisual.timer && <span className="cook-mode__timer">⏱ {stepVisual.timer}</span>}
          </div>
          <p className="cook-mode__tip">
            <strong>Tip:</strong> {stepVisual.tip}
          </p>
        </div>

        <section className="cook-mode__step-card">
          <span className="cookbook-recipe__step-num">{stepIndex + 1}</span>
          <p className="cook-mode__step-text">{steps[stepIndex]}</p>
        </section>

        <h4 className="cookbook-recipe__section">For this step</h4>
        <div className="cook-mode__step-chips">
          {stepVisual.ingredients.map((item) => (
            <span key={item} className="chip chip--soft">
              {item}
            </span>
          ))}
        </div>

        <div className="cook-mode__dots" aria-hidden>
          {steps.map((_, index) => (
            <span
              key={`dot-${index}`}
              className={`cook-mode__dot${index === stepIndex ? " cook-mode__dot--active" : ""}${index < stepIndex ? " cook-mode__dot--done" : ""}`}
            />
          ))}
        </div>

        <div className="cookbook-recipe__actions">
          <button type="button" className="btn btn--secondary" disabled={isFirst} onClick={goBack}>
            ← Back
          </button>
          <button type="button" className="btn btn--primary" onClick={goNext}>
            {isLast ? "Done cooking" : "Next step →"}
          </button>
        </div>

        <div className="cook-mode__footer-links">
          <button
            type="button"
            className="cook-mode__back cook-mode__back--inline"
            onClick={() => setScreen("overview")}
          >
            Overview
          </button>
        </div>

        {youtubeQuery && (
          <MealVideoReference query={youtubeQuery} health={health} className="cook-mode__videos" />
        )}

        <ScrollPad />
      </Surface>
    </div>
  );
}
