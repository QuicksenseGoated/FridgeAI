import { useEffect, useMemo, useState } from "react";
import { FridgeAppPreview } from "../components/FridgeAppPreview";
import {
  DEMO_GROCERY,
  DEMO_HEALTH,
  DEMO_PERSONA,
  DEMO_PROFILE,
  DEMO_SAVED_MEALS,
  DEMO_SETTINGS,
  demoScanForView,
  demoTabForView,
  type DemoView,
} from "../data/demoPreviewState";
import { FRIDGE_THEMES, initialPhoneTabs, type FridgeThemeId } from "../types/theme";
import type { TabId } from "../types/app";
import "../App.css";
import "../spark.css";
import "../themes/theme-skin-base.css";
import "../themes/theme-a-kitchen.css";
import "../themes/theme-b-dynamic.css";
import "../themes/theme-c-illustrated.css";
import "../themes/theme-d-immersive.css";
import "../themes/theme-e-market.css";
import "../themes/theme-f-hero.css";
import "../themes/theme-g-sticker.css";
import "../themes/theme-h-editorial.css";
import "../styles/theme-comparison.css";

const DEMO_VIEWS: { id: DemoView; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "home-results", label: "Scan results" },
  { id: "meals", label: "Meals" },
  { id: "grocery", label: "Shop" },
  { id: "saved", label: "Saved" },
  { id: "you", label: "You" },
];

const TAB_LABELS: Record<TabId, string> = {
  home: "Home",
  grocery: "Shop",
  saved: "Saved",
  meals: "Meals",
  you: "You",
};

export default function ThemeComparisonScreen() {
  const [demoView, setDemoView] = useState<DemoView>("home");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [phoneTabs, setPhoneTabs] = useState<Record<FridgeThemeId, TabId>>(() =>
    initialPhoneTabs("home"),
  );

  const scanState = useMemo(() => demoScanForView(demoView), [demoView]);

  useEffect(() => {
    document.body.classList.add("theme-comparison", "has-bottom-nav");
    return () => {
      document.body.classList.remove("theme-comparison", "has-bottom-nav");
    };
  }, []);

  useEffect(() => {
    const tab = demoTabForView(demoView);
    setActiveTab(tab);
    setPhoneTabs(initialPhoneTabs(tab));
  }, [demoView]);

  const handlePhoneTabChange = (themeId: FridgeThemeId, tab: TabId) => {
    setPhoneTabs((current) => ({ ...current, [themeId]: tab }));
    setActiveTab(tab);
  };

  return (
    <div className="theme-comparison">
      <header className="theme-comparison__header">
        <div className="theme-comparison__intro">
          <h1 className="theme-comparison__title">Surface &amp; color skins</h1>
          <p className="theme-comparison__subtitle">
            Same normal FridgeAI layout on all eight phones — scan card, step bar,
            meal cards, bottom nav. Each phone only changes backgrounds, corner
            radius, transparency, blur, and accent highlights so you can mix what
            you like.
          </p>
        </div>

        <div className="theme-comparison__controls">
          <span className="theme-comparison__control-label">Screen</span>
          <div className="theme-comparison__chips">
            {DEMO_VIEWS.map((view) => (
              <button
                key={view.id}
                type="button"
                className={`theme-comparison__chip${demoView === view.id ? " theme-comparison__chip--active" : ""}`}
                onClick={() => setDemoView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        <p className="theme-comparison__hint">
          Synced tab: <strong>{TAB_LABELS[activeTab]}</strong>
          {" · "}
          <a href="/">Back to main app</a>
        </p>
      </header>

      <div className="theme-comparison__grid">
        {FRIDGE_THEMES.map((theme) => (
          <section
            key={theme.id}
            className="theme-comparison__phone"
            aria-label={`${theme.letter} ${theme.name}`}
          >
            <div className="theme-comparison__phone-label">
              <span className="theme-comparison__phone-letter">{theme.letter}</span>
              <div>
                <strong>{theme.name}</strong>
                <span>{theme.subtitle}</span>
                <span className="theme-comparison__pick-notes">{theme.pickNotes}</span>
              </div>
            </div>

            <div className="theme-comparison__phone-shell">
              <FridgeAppPreview
                themeId={theme.id}
                activeTab={phoneTabs[theme.id]}
                onTabChange={(tab) => handlePhoneTabChange(theme.id, tab)}
                health={DEMO_HEALTH}
                profile={DEMO_PROFILE}
                persona={DEMO_PERSONA}
                settings={DEMO_SETTINGS}
                savedMeals={DEMO_SAVED_MEALS}
                groceryItems={DEMO_GROCERY}
                scanResult={scanState.result}
                mealVideos={scanState.mealVideos}
                scanPreview={scanState.preview}
              />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
