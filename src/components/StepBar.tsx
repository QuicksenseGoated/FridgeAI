interface StepBarProps {
  current: 1 | 2;
}

const STEPS = ["Photo", "Yummy meals"];

export function StepBar({ current }: StepBarProps) {
  return (
    <ol className="steps steps--two" aria-label="Progress">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;

        return (
          <li
            key={label}
            className={`steps__item ${active ? "steps__item--active" : ""} ${done ? "steps__item--done" : ""}`}
          >
            <span className="steps__num">{done ? "✓" : step}</span>
            <span>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
