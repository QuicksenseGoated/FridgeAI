import type { ReactNode } from "react";

interface ExpandableCardProps {
  title: string;
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function ExpandableCard({
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: ExpandableCardProps) {
  return (
    <section className={`expandable-card card${isOpen ? " expandable-card--open" : ""}`}>
      <button
        type="button"
        className="expandable-card__header"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="expandable-card__titles">
          <strong className="expandable-card__title">{title}</strong>
          {summary && <span className="expandable-card__summary">{summary}</span>}
        </span>
        <span className="expandable-card__chevron" aria-hidden>
          ▾
        </span>
      </button>

      <div className="expandable-card__body">
        <div className="expandable-card__inner">{children}</div>
      </div>
    </section>
  );
}
