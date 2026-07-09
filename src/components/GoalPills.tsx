import type { PersonaId } from "../types/app";
import { PERSONAS } from "../types/app";

interface GoalPillsProps {
  persona: PersonaId;
  onSelect: (persona: PersonaId) => void;
}

export function GoalPills({ persona, onSelect }: GoalPillsProps) {
  return (
    <div className="goal-pills" role="group" aria-label="Meal goal">
      {PERSONAS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`goal-pill${persona === item.id ? " goal-pill--active" : ""}`}
          onClick={() => onSelect(item.id)}
          aria-pressed={persona === item.id}
        >
          <span aria-hidden>{item.emoji}</span> {item.label}
        </button>
      ))}
    </div>
  );
}
