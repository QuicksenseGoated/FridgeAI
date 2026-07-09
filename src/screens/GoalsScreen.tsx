import { PageHeader } from "../components/PageHeader";
import type { PersonaId } from "../types/app";
import { PERSONAS } from "../types/app";

interface GoalsScreenProps {
  persona: PersonaId;
  onSelect: (persona: PersonaId) => void;
  compact?: boolean;
  embedded?: boolean;
}

export function GoalsScreen({ persona, onSelect, compact, embedded }: GoalsScreenProps) {
  if (embedded) {
    return (
      <div className="goals-embedded goals-embedded--panel">
        <div className="goal-grid">
          {PERSONAS.map((item) => {
            const active = item.id === persona;
            return (
              <button
                key={item.id}
                type="button"
                className={`goal-card card${active ? " goal-card--active" : ""}`}
                onClick={() => onSelect(item.id)}
                aria-pressed={active}
              >
                <span className="goal-card__emoji" aria-hidden>
                  {item.emoji}
                </span>
                <div className="goal-card__copy">
                  <strong>{item.label}</strong>
                  <p>{item.description}</p>
                </div>
                {active && <span className="goal-card__check" aria-hidden>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "goals-embedded" : "screen"}>
      {!compact && (
        <PageHeader
          title="Your goals"
          subtitle="Pick what kind of meals you want. Fridge AI will tailor ideas to match."
        />
      )}

      {compact && <h2 className="goals-embedded__title">Meal goals</h2>}

      <div className="goal-grid">
        {PERSONAS.map((item) => {
          const active = item.id === persona;
          return (
            <button
              key={item.id}
              type="button"
              className={`goal-card card${active ? " goal-card--active" : ""}`}
              onClick={() => onSelect(item.id)}
              aria-pressed={active}
            >
              <span className="goal-card__emoji" aria-hidden>
                {item.emoji}
              </span>
              <div className="goal-card__copy">
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
              {active && <span className="goal-card__check" aria-hidden>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
