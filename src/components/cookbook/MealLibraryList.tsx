import { useMemo, useState } from "react";
import { MealCard } from "../MealCard";
import { getCookbook, type CatalogMeal, type MealCategory } from "../../data/mealCatalog";
import type { HealthStatus } from "../../types/scan";
import type { SavedMeal } from "../../types/app";
import type { MealSuggestion } from "../../types/scan";

const CATEGORY_CHIP_TONE: Record<MealCategory | "all", string> = {
  all: "coral",
  quick: "sun",
  pasta: "tomato",
  chicken: "amber",
  asian: "jade",
  veggie: "sage",
  comfort: "rust",
  seafood: "ocean",
  breakfast: "honey",
  baking: "wheat",
  dessert: "berry",
};

const CATEGORY_CHIPS: { id: MealCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "quick", label: "Quick" },
  { id: "pasta", label: "Pasta" },
  { id: "chicken", label: "Chicken" },
  { id: "asian", label: "Asian" },
  { id: "veggie", label: "Veggie" },
  { id: "comfort", label: "Comfort" },
  { id: "seafood", label: "Seafood" },
  { id: "breakfast", label: "Breakfast" },
  { id: "baking", label: "Baking" },
  { id: "dessert", label: "Dessert" },
];

interface MealLibraryListProps {
  meals: CatalogMeal[];
  query: string;
  health: HealthStatus | null;
  savedMeals: SavedMeal[];
  onToggleSave: (meal: MealSuggestion) => void;
  onAddToGrocery: (names: string[]) => void;
}

export function MealLibraryList({
  meals,
  query,
  health,
  savedMeals,
  onToggleSave,
  onAddToGrocery,
}: MealLibraryListProps) {
  const [category, setCategory] = useState<MealCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const words = trimmed.split(/\s+/).filter(Boolean);

    return meals.filter((meal) => {
      if (category !== "all" && meal.category !== category) return false;
      if (words.length === 0) return true;

      const haystack = [
        meal.name,
        meal.why,
        meal.category,
        ...meal.collections,
        ...meal.tags,
        ...meal.uses,
      ]
        .join(" ")
        .toLowerCase();

      return words.every((word) => haystack.includes(word));
    });
  }, [category, meals, query]);

  return (
    <div className="meal-library">
      <div className="meals-categories" role="tablist" aria-label="Recipe categories">
        {CATEGORY_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={category === chip.id}
            className={`meals-categories__chip meals-categories__chip--${CATEGORY_CHIP_TONE[chip.id]}${category === chip.id ? " meals-categories__chip--active" : ""}`}
            onClick={() => setCategory(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <p className="meal-library__count">
        {filtered.length} recipe{filtered.length === 1 ? "" : "s"}
        {query.trim() ? ` matching "${query.trim()}"` : ""}
      </p>

      {filtered.length === 0 ? (
        <p className="meal-library__empty">No recipes match — try another search or category.</p>
      ) : (
        <div className="meal-library__list">
          {filtered.map((meal, index) => {
            const book = getCookbook(meal.collections[0]);
            return (
              <MealCard
                key={`${meal.id}-${expandedId === meal.id ? "on" : "off"}`}
                mealData={{ meal, videos: [], videoError: undefined }}
                index={index}
                tone={index}
                health={health}
                savedMeals={savedMeals}
                onToggleSave={onToggleSave}
                accordion
                defaultExpanded={expandedId === meal.id}
                onExpand={() => setExpandedId(meal.id)}
                usesLabel="Ingredients"
                emoji={meal.emoji}
                subtitle={book?.title}
                onAddToGrocery={() => onAddToGrocery(meal.uses)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
