import { useState } from "react";
import { HistoryWidget } from "../components/HistoryWidget";
import { CompareCard } from "../components/CompareCard";
import { ExpandableCard } from "../components/ExpandableCard";
import { PageHeader } from "../components/PageHeader";
import { GoalsScreen } from "./GoalsScreen";
import { SettingsScreen } from "./SettingsScreen";
import type {
  AllergyId,
  AppSettings,
  PersonaId,
  SavedMeal,
  ScanHistoryEntry,
  UserProfile,
} from "../types/app";
import { ALLERGY_OPTIONS, PERSONAS } from "../types/app";
import type { HealthStatus, MealSuggestion } from "../types/scan";

interface YouScreenProps {
  profile: UserProfile;
  persona: PersonaId;
  history: ScanHistoryEntry[];
  savedMeals: SavedMeal[];
  settings: AppSettings;
  health: HealthStatus | null;
  onProfileChange: (profile: UserProfile) => void;
  onPersonaSelect: (persona: PersonaId) => void;
  onSettingsChange: (settings: AppSettings) => void;
  onToggleSave: (meal: MealSuggestion) => void;
  onClearHistory: () => void;
}

export function YouScreen({
  profile,
  persona,
  history,
  savedMeals,
  settings,
  health,
  onProfileChange,
  onPersonaSelect,
  onSettingsChange,
  onToggleSave,
  onClearHistory,
}: YouScreenProps) {
  const totalMeals = history.reduce((sum, entry) => sum + entry.mealCount, 0);
  const activePersona = PERSONAS.find((item) => item.id === persona);
  const memberSince = new Date(profile.joinedAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const allergySummary =
    profile.avoidAllergies.length > 0
      ? `${profile.avoidAllergies.length} avoided`
      : "None set";

  const toggleAllergy = (id: AllergyId) => {
    const has = profile.avoidAllergies.includes(id);
    const avoidAllergies = has
      ? profile.avoidAllergies.filter((item) => item !== id)
      : [...profile.avoidAllergies, id];
    onProfileChange({ ...profile, avoidAllergies });
  };

  return (
    <div className="screen">
      <PageHeader title="You" subtitle="Profile, goals, and app settings." />

      <div className="profile-hero card">
        <img
          src="/brand/mascot.svg"
          alt=""
          className="profile-hero__avatar"
          width={96}
          height={96}
          aria-hidden
        />
        <label className="profile-hero__name-field">
          <span className="profile-hero__label">Display name</span>
          <input
            type="text"
            className="profile-hero__input"
            value={profile.name}
            maxLength={24}
            placeholder="Your name"
            onChange={(event) =>
              onProfileChange({ ...profile, name: event.target.value.trimStart() })
            }
            onBlur={() => {
              if (!profile.name.trim()) {
                onProfileChange({ ...profile, name: "Chef" });
              }
            }}
          />
        </label>
        <p className="profile-hero__since">Cooking with Fridge AI since {memberSince}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-card card">
          <span className="stat-card__value">{profile.scanStreak}</span>
          <span className="stat-card__label">Day streak</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card__value">{history.length}</span>
          <span className="stat-card__label">Scans</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card__value">{totalMeals}</span>
          <span className="stat-card__label">Meals found</span>
        </div>
      </div>

      <div className="card pro-tease">
        <p className="pro-tease__badge">Coming soon</p>
        <h2>Fridge AI Pro</h2>
        <p>Unlimited scans, weekly meal plans, and ad-free cooking — the model top apps use.</p>
        <p className="pro-tease__goal">
          Current goal: <span aria-hidden>{activePersona?.emoji}</span> {activePersona?.label}
        </p>
      </div>

      <ExpandableCard
        title="Meal goals"
        summary={
          activePersona ? `${activePersona.emoji} ${activePersona.label}` : "Pick your style"
        }
        isOpen={goalsOpen}
        onToggle={() => setGoalsOpen((open) => !open)}
      >
        <GoalsScreen persona={persona} onSelect={onPersonaSelect} compact embedded />
      </ExpandableCard>

      <ExpandableCard
        title="Allergies & avoids"
        summary={allergySummary}
        isOpen={dietOpen}
        onToggle={() => setDietOpen((open) => !open)}
      >
        <p className="diet-panel__copy">Meals will skip these — like Samsung Food &amp; Mealime filters.</p>
        <div className="allergy-grid">
          {ALLERGY_OPTIONS.map((item) => {
            const active = profile.avoidAllergies.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className={`allergy-chip${active ? " allergy-chip--active" : ""}`}
                onClick={() => toggleAllergy(item.id)}
                aria-pressed={active}
              >
                <span aria-hidden>{item.emoji}</span> {item.label}
              </button>
            );
          })}
        </div>
      </ExpandableCard>

      <ExpandableCard
        title="How we compare"
        summary="vs Mealime & Samsung Food"
        isOpen={compareOpen}
        onToggle={() => setCompareOpen((open) => !open)}
      >
        <CompareCard />
      </ExpandableCard>

      <ExpandableCard
        title="Scan history"
        summary={history.length > 0 ? `${history.length} saved scans` : "No scans yet"}
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen((open) => !open)}
      >
        <HistoryWidget
          history={history}
          savedMeals={savedMeals}
          onToggleSave={onToggleSave}
          onClearHistory={onClearHistory}
        />
      </ExpandableCard>

      <SettingsScreen
        settings={settings}
        health={health}
        onSettingsChange={onSettingsChange}
        embedded
      />
    </div>
  );
}
