import { useState } from "react";
import { ExpandableCard } from "../components/ExpandableCard";
import { PageHeader } from "../components/PageHeader";
import type { AppSettings } from "../types/app";
import type { HealthStatus } from "../types/scan";

type SettingsPanel = "preferences" | "services" | "data" | "about";

interface SettingsScreenProps {
  settings: AppSettings;
  health: HealthStatus | null;
  onSettingsChange: (settings: AppSettings) => void;
  embedded?: boolean;
}

function serviceSummary(health: HealthStatus | null) {
  const vision = health?.ai === "ready" ? "Vision ready" : "Vision off";
  const recipes =
    health?.youtube === "ready"
      ? "Videos ready"
      : health?.youtube === "invalid"
        ? "Videos need setup"
        : "Videos off";
  return `${vision} · ${recipes}`;
}

export function SettingsScreen({
  settings,
  health,
  onSettingsChange,
  embedded,
}: SettingsScreenProps) {
  const [openPanel, setOpenPanel] = useState<SettingsPanel | null>(null);

  const toggle = (panel: SettingsPanel) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  return (
    <div className={embedded ? "settings-embedded" : "screen"}>
      {!embedded && (
        <PageHeader title="Settings" subtitle="Tap a section to expand it." />
      )}

      {embedded && <h2 className="settings-embedded__title">Settings</h2>}

      <div className="settings-accordion">
        <ExpandableCard
          title="Preferences"
          summary="History & reminders"
          isOpen={openPanel === "preferences"}
          onToggle={() => toggle("preferences")}
        >
          <label className="settings-toggle">
            <span>
              <strong>Save scan history</strong>
              <small>Keep past meal ideas on this device.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.saveHistory}
              onChange={(event) =>
                onSettingsChange({ ...settings, saveHistory: event.target.checked })
              }
            />
          </label>
          <label className="settings-toggle">
            <span>
              <strong>Meal reminders</strong>
              <small>Coming soon — weekly nudge to scan your fridge.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.mealReminders}
              onChange={(event) =>
                onSettingsChange({ ...settings, mealReminders: event.target.checked })
              }
            />
          </label>
        </ExpandableCard>

        <ExpandableCard
          title="Services"
          summary={serviceSummary(health)}
          isOpen={openPanel === "services"}
          onToggle={() => toggle("services")}
        >
          <div className="settings-status-list">
            <SettingsStatus label="Vision AI" ok={health?.ai === "ready"} />
            <SettingsStatus
              label="Recipe videos"
              ok={health?.youtube === "ready"}
              warn={health?.youtube === "invalid"}
            />
          </div>
        </ExpandableCard>

        <ExpandableCard
          title="Data"
          summary="Stored on this device"
          isOpen={openPanel === "data"}
          onToggle={() => toggle("data")}
        >
          <p className="settings-data__copy">
            Scan history, saved meals, and your grocery list stay on this phone. Clear scan
            history from the Scan history section above.
          </p>
        </ExpandableCard>

        <ExpandableCard
          title="About Fridge AI"
          summary="Version 1.0"
          isOpen={openPanel === "about"}
          onToggle={() => toggle("about")}
        >
          <div className="settings-about">
            <p>Version 1.0 · Snap a fridge photo, get meal ideas with recipe videos.</p>
            <ul className="settings-about__list">
              <li>No accounts or payments in v1</li>
              <li>Photos are sent to AI for analysis only</li>
              <li>Profile and history stay on your device</li>
            </ul>
          </div>
        </ExpandableCard>
      </div>
    </div>
  );
}

function SettingsStatus({
  label,
  ok,
  warn,
}: {
  label: string;
  ok?: boolean;
  warn?: boolean;
}) {
  const state = ok ? "Connected" : warn ? "Needs setup" : "Not configured";
  return (
    <div className="settings-status">
      <span>{label}</span>
      <span
        className={`settings-status__badge settings-status__badge--${ok ? "ok" : warn ? "warn" : "idle"}`}
      >
        {state}
      </span>
    </div>
  );
}
