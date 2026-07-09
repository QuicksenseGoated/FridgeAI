import type { HealthStatus } from "../types/scan";

interface AppHeaderProps {
  health: HealthStatus | null;
  compact?: boolean;
}

export function AppHeader({ health, compact }: AppHeaderProps) {
  return (
    <header className={`header${compact ? " header--compact" : ""}`}>
      <div className="header__hero">
        <img
          src="/brand/mascot.svg"
          alt="Friendly cartoon fridge mascot"
          className="header__icon"
          width={compact ? 56 : 110}
          height={compact ? 56 : 110}
        />
        <div className="header__titles">
          <p className="header__name">
            <span>fridge</span> <span className="header__name-ai">ai</span>
          </p>
          {!compact && (
            <p className="header__tagline">Your friendly fridge helper!</p>
          )}
        </div>
      </div>

      {!compact && (
        <p className="header__sub">
          One photo in → meal ideas + recipe videos out.
        </p>
      )}

      <div className="header__status" aria-label="Service status">
        <StatusDot
          label="Vision"
          ok={health?.ai === "ready"}
          warn={health?.ai === "none"}
        />
        <StatusDot
          label="Recipes"
          ok={health?.youtube === "ready"}
          warn={health?.youtube === "invalid"}
          idle={health?.youtube === "none"}
        />
      </div>
    </header>
  );
}

function StatusDot({
  label,
  ok,
  warn,
  idle,
}: {
  label: string;
  ok?: boolean;
  warn?: boolean;
  idle?: boolean;
}) {
  const state = ok ? "ok" : warn ? "warn" : idle ? "idle" : "pending";
  return (
    <span className={`status status--${state}`}>
      <span className="status__dot" />
      {label}
    </span>
  );
}
