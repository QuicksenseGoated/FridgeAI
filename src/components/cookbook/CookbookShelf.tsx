import type { CSSProperties } from "react";
import type { CookbookCollection } from "../../data/mealCatalog";

interface CookbookShelfProps {
  books: (CookbookCollection & { count: number })[];
  totalRecipes: number;
  onOpen: (id: CookbookCollection["id"]) => void;
}

export function CookbookShelf({ books, totalRecipes, onOpen }: CookbookShelfProps) {
  return (
    <div className="cookbook-shelf">
      <div className="cookbook-shelf__ledge" aria-hidden />
      <p className="cookbook-shelf__label">
        {books.length} cookbooks · {totalRecipes} recipes
      </p>
      <div className="cookbook-shelf__row">
        {books.map((book, index) => (
          <button
            key={book.id}
            type="button"
            className="cookbook-volume"
            style={
              {
                "--book-cover": book.cover,
                "--book-spine": book.spine,
                "--book-accent": book.accent,
                "--book-rotate": `${(index % 3) - 1}deg`,
              } as CSSProperties
            }
            onClick={() => onOpen(book.id)}
          >
            <span className="cookbook-volume__spine" aria-hidden />
            <span className="cookbook-volume__cover">
              <span className="cookbook-volume__emoji" aria-hidden>
                {book.emoji}
              </span>
              <span className="cookbook-volume__title">{book.title}</span>
              <span className="cookbook-volume__subtitle">{book.subtitle}</span>
              <span className="cookbook-volume__count">{book.count} recipes</span>
            </span>
          </button>
        ))}
      </div>
      <p className="cookbook-shelf__hint">Tap a book to open it — swipe left or right to turn pages.</p>
    </div>
  );
}
