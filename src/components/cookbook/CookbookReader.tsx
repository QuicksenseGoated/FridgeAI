import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CookMode } from "../CookMode";
import { MealPhoto } from "../MealPhoto";
import { isMealSaved } from "../../services/appStorage";
import type { CatalogMeal, CookbookCollection } from "../../data/mealCatalog";
import type { SavedMeal } from "../../types/app";
import type { HealthStatus, MealSuggestion } from "../../types/scan";

const SWIPE_THRESHOLD = 0.28;
const SETTLE_MS = 420;

type PageKind =
  | { kind: "cover" }
  | { kind: "toc"; recipes: CatalogMeal[] }
  | { kind: "recipe"; recipe: CatalogMeal; spread: number };

type TurnDirection = "forward" | "backward";

interface PageTurn {
  from: number;
  to: number;
  direction: TurnDirection;
  progress: number;
  settling: boolean;
}

interface CookbookReaderProps {
  book: CookbookCollection;
  recipes: CatalogMeal[];
  savedMeals: SavedMeal[];
  health: HealthStatus | null;
  startAtId?: string;
  onClose: () => void;
  onToggleSave: (meal: MealSuggestion) => void;
  onAddToGrocery: (names: string[]) => void;
}

function buildPages(recipes: CatalogMeal[]): PageKind[] {
  const pages: PageKind[] = [{ kind: "cover" }, { kind: "toc", recipes }];

  recipes.forEach((recipe, index) => {
    pages.push({ kind: "recipe", recipe, spread: index + 1 });
  });

  return pages;
}

function pageForRecipe(pages: PageKind[], recipeId: string): number {
  const index = pages.findIndex((page) => page.kind === "recipe" && page.recipe.id === recipeId);
  return index >= 0 ? index : 0;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return !!target.closest("button, a, input, textarea, select, .cookbook-toc__item");
}

function flipTransform(direction: TurnDirection, progress: number): CSSProperties {
  const angle = (direction === "forward" ? -180 : 180) * progress;
  const lift = Math.sin(progress * Math.PI) * 22;
  const bend = Math.sin(progress * Math.PI) * (direction === "forward" ? -2.2 : 2.2);

  return {
    transform: `translateZ(${lift}px) rotateY(${angle}deg) rotateZ(${bend}deg)`,
    transformOrigin: direction === "forward" ? "left center" : "right center",
  };
}

function paperClass(page: PageKind): string {
  if (page.kind === "cover") return "cookbook-page__paper--cover";
  if (page.kind === "toc") return "cookbook-page__paper--toc";
  if (page.kind === "recipe") return "cookbook-page__paper--recipe";
  return "";
}

export function CookbookReader({
  book,
  recipes,
  savedMeals,
  health,
  startAtId,
  onClose,
  onToggleSave,
  onAddToGrocery,
}: CookbookReaderProps) {
  const pages = useMemo(() => buildPages(recipes), [recipes]);
  const initialPage = startAtId ? pageForRecipe(pages, startAtId) : 0;

  const [pageIndex, setPageIndex] = useState(initialPage);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [cookMode, setCookMode] = useState<CatalogMeal | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const pointerId = useRef<number | null>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const settleTimer = useRef<number | null>(null);

  const setStageDragging = useCallback((active: boolean) => {
    stageRef.current?.classList.toggle("cookbook-book__stage--dragging", active);
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("cookbook-reader-active");
    return () => {
      document.documentElement.classList.remove("cookbook-reader-active");
      document.documentElement.classList.remove("cookbook-cooking-active");
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
    };
  }, []);

  useEffect(() => {
    if (cookMode) {
      document.documentElement.classList.add("cookbook-cooking-active");
    } else {
      document.documentElement.classList.remove("cookbook-cooking-active");
    }
  }, [cookMode]);

  const canGo = useCallback(
    (direction: TurnDirection) => {
      if (turn?.settling) return false;
      return direction === "forward" ? pageIndex < pages.length - 1 : pageIndex > 0;
    },
    [pageIndex, pages.length, turn?.settling]
  );

  const startSettle = useCallback(
    (from: number, to: number, direction: TurnDirection, startProgress: number, targetProgress: number) => {
      setTurn({
        from,
        to,
        direction,
        progress: startProgress,
        settling: true,
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTurn((current) =>
            current && current.from === from && current.to === to
              ? { ...current, progress: targetProgress, settling: true }
              : current
          );
        });
      });

      if (targetProgress === 1) {
        if (settleTimer.current) window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => {
          setPageIndex(to);
          setTurn(null);
        }, SETTLE_MS);
      } else if (targetProgress === 0) {
        if (settleTimer.current) window.clearTimeout(settleTimer.current);
        settleTimer.current = window.setTimeout(() => {
          setTurn(null);
        }, SETTLE_MS);
      }
    },
    []
  );

  const goToRecipe = useCallback(
    (recipeId: string) => {
      if (turn?.settling) return;
      const target = pageForRecipe(pages, recipeId);
      if (target === pageIndex) return;
      const direction: TurnDirection = target > pageIndex ? "forward" : "backward";
      startSettle(pageIndex, target, direction, 0, 1);
    },
    [pageIndex, pages, startSettle, turn?.settling]
  );

  const isScrollablePage = (page: PageKind) =>
    page.kind === "recipe" || page.kind === "toc";

  const isScrollablePaperTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return !!target.closest(
      ".cookbook-page__paper--recipe, .cookbook-page__paper--toc, .cookbook-page__paper--cook",
    );
  };

  const isEdgePageTurn = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return true;
    const edge = rect.width * 0.18;
    return clientX - rect.left <= edge || rect.right - clientX <= edge;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (turn?.settling || isInteractiveTarget(event.target)) return;

    const currentPage = pages[pageIndex];
    if (
      isScrollablePage(currentPage) &&
      isScrollablePaperTarget(event.target) &&
      !isEdgePageTurn(event.clientX)
    ) {
      return;
    }

    pointerId.current = event.pointerId;
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragging.current = false;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId || turn?.settling) return;

    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;

    if (!dragging.current) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.1) {
        pointerId.current = null;
        return;
      }
      if (Math.abs(dx) < 10) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        pointerId.current = null;
        return;
      }
      dragging.current = true;
      setStageDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const width = stageRef.current?.offsetWidth ?? 320;
    const travel = width * 0.82;

    if (dx < 0 && canGo("forward")) {
      const progress = Math.min(1, -dx / travel);
      setTurn({
        from: pageIndex,
        to: pageIndex + 1,
        direction: "forward",
        progress,
        settling: false,
      });
      return;
    }

    if (dx > 0 && canGo("backward")) {
      const progress = Math.min(1, dx / travel);
      setTurn({
        from: pageIndex,
        to: pageIndex - 1,
        direction: "backward",
        progress,
        settling: false,
      });
      return;
    }

    if (turn && !turn.settling) {
      setTurn(null);
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;

    if (dragging.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
      setStageDragging(false);
    }
    pointerId.current = null;

    if (!dragging.current || !turn || turn.settling) {
      dragging.current = false;
      return;
    }

    dragging.current = false;

    if (turn.progress >= SWIPE_THRESHOLD) {
      startSettle(turn.from, turn.to, turn.direction, turn.progress, 1);
    } else {
      startSettle(turn.from, turn.to, turn.direction, turn.progress, 0);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== event.pointerId) return;
    pointerId.current = null;
    dragging.current = false;
    setStageDragging(false);
    if (turn && !turn.settling) setTurn(null);
  };

  const renderPageContent = (page: PageKind, absolutePage: number): ReactNode => {
    if (page.kind === "cover") {
      return (
        <>
          <span className="cookbook-cover__emoji" aria-hidden>
            {book.emoji}
          </span>
          <h2 className="cookbook-cover__title">{book.title}</h2>
          <p className="cookbook-cover__subtitle">{book.subtitle}</p>
          <p className="cookbook-cover__count">{recipes.length} recipes</p>
          <p className="cookbook-cover__hint">Swipe left to turn the page →</p>
        </>
      );
    }

    if (page.kind === "toc") {
      const fillPage = page.recipes.length <= 14;
      return (
        <>
          <p className="cookbook-toc__label">Contents</p>
          <h3 className="cookbook-toc__title">{book.title}</h3>
          <ol
            className={`cookbook-toc__list${fillPage ? " cookbook-toc__list--fill" : ""}`}
          >
            {page.recipes.map((recipe, index) => (
              <li key={recipe.id}>
                <button
                  type="button"
                  className="cookbook-toc__item"
                  onClick={(event) => {
                    event.stopPropagation();
                    goToRecipe(recipe.id);
                  }}
                >
                  <span className="cookbook-toc__num">{index + 1}</span>
                  <span className="cookbook-toc__name">
                    <MealPhoto meal={recipe} variant="toc" className="cookbook-toc__photo" />
                    {recipe.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </>
      );
    }

    const { recipe } = page;
    const saved = isMealSaved(recipe.name, savedMeals);
    const totalTime =
      recipe.prepTime && recipe.cookTime
        ? `${recipe.prepTime} prep · ${recipe.cookTime} cook`
        : recipe.prepTime ?? recipe.cookTime ?? null;

    return (
      <>
        <header className="cookbook-recipe__head">
          <span className="cookbook-recipe__chapter">{book.title}</span>
          <span className="cookbook-recipe__page-num">p. {absolutePage + 1}</span>
        </header>
        <MealPhoto meal={recipe} variant="hero" className="cookbook-recipe__photo" />
        <div className="cookbook-recipe__hero cookbook-recipe__hero--compact">
          <div>
            <h3 className="cookbook-recipe__title">{recipe.name}</h3>
            {totalTime && <p className="cookbook-recipe__time">{totalTime}</p>}
          </div>
        </div>
        <p className="cookbook-recipe__why">{recipe.why}</p>

        <div className="cookbook-recipe__body">
          <div className="cookbook-recipe__grid">
            <section className="cookbook-recipe__col">
              <h4 className="cookbook-recipe__section">Ingredients</h4>
              <ul className="cookbook-recipe__ingredients">
                {recipe.uses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="cookbook-recipe__col">
              <h4 className="cookbook-recipe__section">Method</h4>
              <ol className="cookbook-recipe__steps">
                {recipe.steps.map((step, stepIndex) => (
                  <li key={`${recipe.id}-step-${stepIndex}`}>
                    <span className="cookbook-recipe__step-num">{stepIndex + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <dl className="cookbook-recipe__nutrition">
            <div>
              <dt>Cal</dt>
              <dd>{recipe.nutrition.calories}</dd>
            </div>
            <div>
              <dt>Protein</dt>
              <dd>{recipe.nutrition.protein}</dd>
            </div>
            <div>
              <dt>Carbs</dt>
              <dd>{recipe.nutrition.carbs}</dd>
            </div>
            <div>
              <dt>Fat</dt>
              <dd>{recipe.nutrition.fat}</dd>
            </div>
          </dl>
        </div>

        <div
          className="cookbook-recipe__actions"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <button type="button" className="btn btn--primary" onClick={() => setCookMode(recipe)}>
            Cook mode
          </button>
          <button type="button" className="btn btn--secondary" onClick={() => onAddToGrocery(recipe.uses)}>
            Shop list
          </button>
          <button
            type="button"
            className={`cookbook-recipe__heart${saved ? " cookbook-recipe__heart--on" : ""}`}
            onClick={() => onToggleSave(recipe)}
            aria-pressed={saved}
          >
            {saved ? "❤️" : "🤍"}
          </button>
        </div>
      </>
    );
  };

  const renderPage = (page: PageKind, absolutePage: number, flipping: boolean): ReactNode => {
    const content = renderPageContent(page, absolutePage);
    const paper = paperClass(page);

    if (!flipping) {
      return (
        <div className={`cookbook-page__paper ${paper}`}>
          {content}
        </div>
      );
    }

    return (
      <div className="cookbook-page-turn">
        <div
          className="cookbook-page-turn__shade"
          style={{ opacity: Math.sin((turn?.progress ?? 0) * Math.PI) * 0.45 }}
          aria-hidden
        />
        <div className="cookbook-page-turn__body">
          <div className="cookbook-page-turn__front">
            <div className={`cookbook-page__paper ${paper}`}>{content}</div>
          </div>
          <div className="cookbook-page-turn__back" aria-hidden />
          <div className="cookbook-page-turn__edge" aria-hidden />
        </div>
      </div>
    );
  };

  const activeTurn = turn && turn.progress > 0 ? turn : null;
  const baseIndex = activeTurn ? activeTurn.to : pageIndex;
  const topIndex = activeTurn ? activeTurn.from : pageIndex;
  const curl = activeTurn?.progress ?? 0;
  const lift = Math.sin(curl * Math.PI);

  const flipStyle: CSSProperties | undefined = activeTurn
    ? {
        ...flipTransform(activeTurn.direction, activeTurn.progress),
        ["--page-curl" as string]: String(curl),
        ["--page-lift" as string]: String(lift),
      }
    : undefined;

  return (
    <div
      className={`cookbook-reader${cookMode ? " cookbook-reader--cooking" : ""}`}
      style={
        {
          "--reader-cover": book.cover,
          "--reader-accent": book.accent,
          "--reader-spine": book.spine,
        } as CSSProperties
      }
    >
      <header className="cookbook-reader__bar">
        <button
          type="button"
          className="cookbook-reader__back"
          onClick={cookMode ? () => setCookMode(null) : onClose}
        >
          {cookMode ? "← Recipe" : "← Shelf"}
        </button>
        <div className="cookbook-reader__meta">
          <span className="cookbook-reader__book">
            {cookMode ? `Cooking · ${cookMode.name}` : book.title}
          </span>
          <span className="cookbook-reader__page">
            {cookMode ? "Cook mode" : `Page ${pageIndex + 1} of ${pages.length}`}
          </span>
        </div>
      </header>

      {cookMode ? (
        <CookMode
          embedded
          health={health}
          meal={{
            name: cookMode.name,
            emoji: cookMode.emoji,
            imageMeal: cookMode,
            steps: cookMode.steps,
            uses: cookMode.uses,
            prepTime: cookMode.prepTime,
            cookTime: cookMode.cookTime,
            youtubeQuery: cookMode.youtubeQuery,
            nutrition: cookMode.nutrition,
          }}
          onClose={() => setCookMode(null)}
        />
      ) : (
      <div className="cookbook-book">
        <div className="cookbook-book__spine" aria-hidden />
        <div
          ref={stageRef}
          className="cookbook-book__stage"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="cookbook-book__gutter" aria-hidden />
          <div className="cookbook-book__sheet cookbook-book__sheet--base">
            {renderPage(pages[baseIndex], baseIndex, false)}
          </div>

          {activeTurn && (
            <div
              className={`cookbook-book__sheet cookbook-book__sheet--flip cookbook-book__sheet--flip-${activeTurn.direction}${activeTurn.settling ? " cookbook-book__sheet--settling" : ""}`}
              style={flipStyle}
            >
              {renderPage(pages[topIndex], topIndex, true)}
            </div>
          )}

          <p className="cookbook-book__swipe-hint" aria-hidden>
            ← swipe →
          </p>
        </div>
      </div>
      )}
    </div>
  );
}
