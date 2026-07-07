import type { HealthStatus } from "../types/scan";

interface AppHeaderProps {
  health: HealthStatus | null;
}

export function AppHeader({ health }: AppHeaderProps) {
  return (
    <header className="header">
      <div className="header__hero">
        <img
          src="/brand/icon.png"
          alt=""
          className="header__icon"
          width={88}
          height={88}
        />
        <div className="header__titles">
          <p className="header__name">
            <span>fridge</span> <span className="header__name-ai">ai</span>
          </p>
          <p className="header__tagline">Smart fridge. Smarter you.</p>
        </div>
      </div>

      <p className="header__sub">
        Scan your fridge, pick a goal, get meals with recipe videos.
      </p>

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
