import type { ReactElement } from "react";
import type { TabId } from "../types/app";

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  savedCount?: number;
  groceryCount?: number;
}

const TABS: { id: TabId; label: string; icon: (active: boolean) => ReactElement }[] = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 20v-9.5Z"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.18 : 0}
        />
      </svg>
    ),
  },
  {
    id: "grocery",
    label: "Shop",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 6h15l-1.5 9H7.5L6 6Z"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinejoin="round"
        />
        <path
          d="M6 6 5 3H2"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinecap="round"
        />
        <circle cx="9" cy="20" r="1.5" fill="currentColor" />
        <circle cx="18" cy="20" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "saved",
    label: "Saved",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20.5s-7-4.6-7-10a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5c0 5.4-7 10-7 10Z"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.18 : 0}
        />
      </svg>
    ),
  },
  {
    id: "meals",
    label: "Meals",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M8 3v9.5c0 1.1.9 2 2 2h4c1.1 0 2-.9 2-2V3"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinecap="round"
        />
        <path
          d="M6 3h12M9 18h6M10 21h4"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinecap="round"
        />
        <path
          d="M9 14.5h6"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "you",
    label: "You",
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.18 : 0}
        />
        <path
          d="M5 20c1.2-3.5 4-5.5 7-5.5s5.8 2 7 5.5"
          stroke="currentColor"
          strokeWidth={active ? 2.4 : 2}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNav({
  active,
  onChange,
  savedCount = 0,
  groceryCount = 0,
}: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const badge =
          tab.id === "saved" ? savedCount : tab.id === "grocery" ? groceryCount : 0;

        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`}
            data-tab={tab.id}
            aria-current={isActive ? "page" : undefined}
            onClick={() => onChange(tab.id)}
          >
            <span className="bottom-nav__icon">
              {tab.icon(isActive)}
              {badge > 0 && <span className="bottom-nav__badge">{badge}</span>}
            </span>
            <span className="bottom-nav__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
