export function CompareCard() {
  const rows = [
    { feature: "Photo → meals in seconds", fridge: true, mealime: false, samsung: false },
    { feature: "AI from YOUR fridge", fridge: true, mealime: false, samsung: false },
    { feature: "Recipe videos", fridge: true, mealime: true, samsung: true },
    { feature: "Grocery list", fridge: true, mealime: true, samsung: true },
    { feature: "Save favorites", fridge: true, mealime: true, samsung: true },
    { feature: "Pantry tracking", fridge: true, mealime: false, samsung: "paid" as const },
    { feature: "Allergen filters", fridge: true, mealime: true, samsung: true },
    { feature: "Cook mode steps", fridge: true, mealime: true, samsung: "paid" as const },
    { feature: "No account needed", fridge: true, mealime: false, samsung: false },
  ];

  return (
    <div className="compare-card">
      <p className="compare-card__intro">
        Fridge AI focuses on what top apps charge for: snap your real kitchen, get meals fast.
      </p>
      <div className="compare-table" role="table">
        <div className="compare-table__row compare-table__row--head" role="row">
          <span role="columnheader">Feature</span>
          <span role="columnheader">Fridge AI</span>
          <span role="columnheader">Mealime</span>
          <span role="columnheader">Samsung Food</span>
        </div>
        {rows.map((row) => (
          <div key={row.feature} className="compare-table__row" role="row">
            <span className="compare-table__feature" role="cell">
              {row.feature}
            </span>
            <CompareCell value={row.fridge} highlight />
            <CompareCell value={row.mealime} />
            <CompareCell value={row.samsung} />
          </div>
        ))}
      </div>
      <p className="compare-card__note">
        Mealime &amp; Samsung Food excel at curated recipes and store delivery. Fridge AI wins when
        you want meals from what you actually have right now.
      </p>
    </div>
  );
}

function CompareCell({
  value,
  highlight,
}: {
  value: boolean | "paid";
  highlight?: boolean;
}) {
  const label =
    value === true ? "✓" : value === "paid" ? "$" : "—";

  return (
    <span
      className={`compare-table__cell${highlight ? " compare-table__cell--highlight" : ""}`}
      role="cell"
      aria-label={value === true ? "Yes" : value === "paid" ? "Paid tier" : "No"}
    >
      {label}
    </span>
  );
}
