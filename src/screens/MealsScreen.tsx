import { useCallback, useMemo, useState } from "react";
import { CookbookReader } from "../components/cookbook/CookbookReader";
import { CookbookShelf } from "../components/cookbook/CookbookShelf";
import { MealLibraryList } from "../components/cookbook/MealLibraryList";
import {
  getCookbook,
  getCookbookWithCounts,
  MEAL_CATALOG,
  mealsForCollection,
  type CookbookId,
} from "../data/mealCatalog";
import { searchMeals } from "../services/scanApi";
import {
  findCatalogMeal,
  searchCatalogMeals,
} from "../services/mealSearch";
import type { SavedMeal } from "../types/app";
import type { HealthStatus, MealSuggestion } from "../types/scan";

interface MealsScreenProps {
  health: HealthStatus | null;
  savedMeals: SavedMeal[];
  persona?: string;
  avoidAllergies?: string[];
  bookMode: boolean;
  onBookModeChange: (bookMode: boolean) => void;
  onToggleSave: (meal: MealSuggestion) => void;
  onAddToGrocery: (names: string[]) => void;
  onOpenGrocery: () => void;
}

type View =
  | { mode: "shelf" }
  | { mode: "book"; bookId: CookbookId; startAtId?: string }
  | { mode: "search"; query: string; results: ReturnType<typeof searchCatalogMeals> };

function BookModeToggle({
  bookMode,
  onChange,
}: {
  bookMode: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="book-mode-toggle" role="group" aria-label="Library view">
      <button
        type="button"
        className={`book-mode-toggle__btn${bookMode ? " book-mode-toggle__btn--active" : ""}`}
        aria-pressed={bookMode}
        onClick={() => onChange(true)}
      >
        <span aria-hidden>📚</span> Books
      </button>
      <button
        type="button"
        className={`book-mode-toggle__btn${!bookMode ? " book-mode-toggle__btn--active" : ""}`}
        aria-pressed={!bookMode}
        onClick={() => onChange(false)}
      >
        <span aria-hidden>📋</span> List
      </button>
    </div>
  );
}

export function MealsScreen({
  health,
  savedMeals,
  persona,
  avoidAllergies,
  bookMode,
  onBookModeChange,
  onToggleSave,
  onAddToGrocery,
  onOpenGrocery,
}: MealsScreenProps) {
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>({ mode: "shelf" });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const cookbooks = useMemo(() => getCookbookWithCounts(), []);

  const runAiSearch = useCallback(
    async (trimmed: string) => {
      if (health?.ai !== "ready") {
        setSearchError("AI search needs GEMINI_API_KEY — browse the library below.");
        return [];
      }

      setSearching(true);
      setSearchError(null);

      try {
        const result = await searchMeals(trimmed, persona, avoidAllergies);
        return result.meals
          .map((meal) => findCatalogMeal(meal.name) ?? null)
          .filter((meal): meal is NonNullable<typeof meal> => meal !== null);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
        return [];
      } finally {
        setSearching(false);
      }
    },
    [health?.ai, persona, avoidAllergies]
  );

  const handleSearchSubmit = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (!bookMode) {
      setSearchError(null);
      return;
    }

    let results = searchCatalogMeals(trimmed, null);
    if (results.length < 2) {
      const aiMatches = await runAiSearch(trimmed);
      const catalog = results;
      const merged = [...catalog, ...aiMatches];
      const seen = new Set<string>();
      results = merged.filter((m) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
    }

    if (results.length === 0) {
      setSearchError("No recipes found — try another word or open a cookbook.");
      return;
    }

    setView({ mode: "search", query: trimmed, results });
    setSearchError(null);
  };

  const openBook = (bookId: CookbookId, startAtId?: string) => {
    setView({ mode: "book", bookId, startAtId });
    setQuery("");
    setSearchError(null);
  };

  const backToShelf = () => {
    setView({ mode: "shelf" });
    setQuery("");
    setSearchError(null);
  };

  const handleBookModeChange = (next: boolean) => {
    onBookModeChange(next);
    if (!next) {
      backToShelf();
    }
  };

  const handleAddIngredients = (names: string[]) => {
    onAddToGrocery(names);
    onOpenGrocery();
  };

  if (bookMode && view.mode === "book") {
    const book = getCookbook(view.bookId);
    const recipes = mealsForCollection(MEAL_CATALOG, view.bookId);
    if (!book) {
      backToShelf();
      return null;
    }

    return (
      <CookbookReader
        book={book}
        recipes={recipes}
        savedMeals={savedMeals}
        health={health}
        startAtId={view.startAtId}
        onClose={backToShelf}
        onToggleSave={onToggleSave}
        onAddToGrocery={handleAddIngredients}
      />
    );
  }

  if (bookMode && view.mode === "search") {
    const pseudoBook = {
      id: "quick" as CookbookId,
      title: `Search: ${view.query}`,
      subtitle: `${view.results.length} matches in the library`,
      emoji: "🔍",
      spine: "#4a5568",
      cover: "linear-gradient(145deg, #718096 0%, #2d3748 100%)",
      accent: "#f7fafc",
      count: view.results.length,
    };

    return (
      <CookbookReader
        book={pseudoBook}
        recipes={view.results}
        savedMeals={savedMeals}
        health={health}
        onClose={backToShelf}
        onToggleSave={onToggleSave}
        onAddToGrocery={handleAddIngredients}
      />
    );
  }

  return (
    <div className={`screen screen--meals${bookMode ? " screen--cookbook-shelf" : " screen--meal-list"}`}>
      <header className="cookbook-library__header">
        <div className="cookbook-library__header-row">
          <div>
            <h1 className="cookbook-library__title">
              {bookMode ? "The Cookbook Library" : "Recipe Library"}
            </h1>
            <p className="cookbook-library__subtitle">
              {bookMode
                ? "Pick a book from the shelf. Swipe pages left and right like a real cookbook."
                : "Every recipe in one place — search, filter, and expand any card."}
            </p>
          </div>
          <BookModeToggle bookMode={bookMode} onChange={handleBookModeChange} />
        </div>
      </header>

      <section className="meals-toolbar">
        <div className="meals-search-bar">
          <input
            type="search"
            className="meals-search-bar__input"
            placeholder="Search cakes, pasta, curry, bread…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSearchError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleSearchSubmit();
            }}
          />
          <button
            type="button"
            className="btn btn--primary meals-search-bar__btn"
            onClick={() => void handleSearchSubmit()}
            disabled={searching || query.trim().length < 2}
          >
            {searching ? "…" : bookMode ? "Go" : "Search"}
          </button>
        </div>
        {searchError && <p className="alert alert--warn meals-toolbar__error">{searchError}</p>}
      </section>

      {bookMode ? (
        <CookbookShelf
          books={cookbooks}
          totalRecipes={MEAL_CATALOG.length}
          onOpen={(id) => openBook(id)}
        />
      ) : (
        <MealLibraryList
          meals={MEAL_CATALOG}
          query={query}
          health={health}
          savedMeals={savedMeals}
          onToggleSave={onToggleSave}
          onAddToGrocery={handleAddIngredients}
        />
      )}
    </div>
  );
}
