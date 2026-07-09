import { useCallback, useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { InstallApp } from "./components/InstallApp";
import { Onboarding } from "./components/Onboarding";
import { Toast } from "./components/Toast";
import {
  addGroceryItems,
  addHistoryEntry,
  clearCheckedGrocery,
  clearHistory,
  loadGroceryItems,
  loadHistory,
  loadPersona,
  loadProfile,
  loadSavedMeals,
  loadSettings,
  mergeGroceryFromScan,
  mergePantryFromScan,
  migrateLegacyGrocery,
  recordScanActivity,
  removeGroceryItem,
  renameGroceryItem,
  savePersona,
  saveProfile,
  saveSettings,
  saveSavedMeals,
  toggleGroceryItem,
  toggleSavedMeal,
} from "./services/appStorage";
import {
  fetchHealth,
  fileToBase64,
  scanFridge,
  searchYouTube,
} from "./services/scanApi";
import { GroceryScreen } from "./screens/GroceryScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { MealsScreen } from "./screens/MealsScreen";
import { SavedScreen } from "./screens/SavedScreen";
import { YouScreen } from "./screens/YouScreen";
import type {
  AppSettings,
  GroceryItem,
  PersonaId,
  SavedMeal,
  ScanHistoryEntry,
  TabId,
  UserProfile,
} from "./types/app";
import type { HealthStatus, MealSuggestion, MealWithVideos, ScanResult } from "./types/scan";
import type { LoadingPhase } from "./components/LoadingOverlay";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [persona, setPersona] = useState<PersonaId>(() => loadPersona());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<ScanHistoryEntry[]>(() => loadHistory());
  const [savedMeals, setSavedMeals] = useState<SavedMeal[]>(() => loadSavedMeals());
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => loadGroceryItems());
  const [toast, setToast] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [mealVideos, setMealVideos] = useState<MealWithVideos[]>([]);

  const showOnboarding = !profile.onboardingComplete;

  useEffect(() => {
    migrateLegacyGrocery();
    setGroceryItems(loadGroceryItems());
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, []);

  useEffect(() => {
    const syncDevicePreview = () => {
      document.body.classList.toggle("device-preview", window.innerWidth >= 520);
    };

    syncDevicePreview();
    window.addEventListener("resize", syncDevicePreview);
    return () => window.removeEventListener("resize", syncDevicePreview);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const pollHealth = async () => {
      if (cancelled || attempts >= 8) return;
      attempts += 1;

      try {
        const next = await fetchHealth();
        if (!cancelled) setHealth(next);
        return;
      } catch {
        if (!cancelled) {
          setHealth((current) => current ?? { ok: false, ai: "none", youtube: "none" });
        }
      }

      if (!cancelled) {
        window.setTimeout(() => void pollHealth(), 2000);
      }
    };

    void pollHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "grocery") return;

    fetchHealth()
      .then(setHealth)
      .catch(() => {});
  }, [activeTab]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    savePersona(persona);
  }, [persona]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const clearToast = useCallback(() => setToast(null), []);

  const handleFile = (next: File | null) => {
    setFile(next);
    setResult(null);
    setMealVideos([]);
    setError(null);

    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : null);
  };

  const handleScanAgain = () => {
    setResult(null);
    setMealVideos([]);
    setError(null);
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const recordScan = (scan: ScanResult) => {
    if (scan.noFoodDetected) return;

    setGroceryItems(mergeGroceryFromScan(scan));
    mergePantryFromScan(scan.ingredients);
    setProfile((current) => recordScanActivity(current));

    if (!settings.saveHistory) return;

    const entry: ScanHistoryEntry = {
      id: crypto.randomUUID(),
      scannedAt: new Date().toISOString(),
      persona,
      ingredientCount: scan.ingredients.length,
      mealCount: scan.meals.length,
      ingredients: scan.ingredients,
      mealNames: scan.meals.map((meal) => meal.name),
      shoppingList: scan.shoppingList ?? [],
      snapshot: {
        ingredients: scan.ingredients,
        meals: scan.meals,
        notes: scan.notes,
        shoppingList: scan.shoppingList,
        usedAI: scan.usedAI,
      },
    };

    addHistoryEntry(entry);
    setHistory(loadHistory());
  };

  const handleScan = async () => {
    if (!file) {
      setError("Take or choose a fridge photo first.");
      return;
    }

    if (health?.ai !== "ready") {
      setError("Add GEMINI_API_KEY to .env and restart npm run dev.");
      return;
    }

    setLoadingPhase("reading");
    setError(null);
    setResult(null);
    setMealVideos([]);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      setLoadingPhase("meals");
      const scan = await scanFridge(
        base64,
        mimeType,
        persona,
        profile.avoidAllergies.length > 0 ? profile.avoidAllergies : undefined
      );
      setResult(scan);

      if (scan.noFoodDetected) {
        return;
      }

      recordScan(scan);

      if (health?.youtube === "ready") {
        setLoadingPhase("videos");
        const withVideos: MealWithVideos[] = await Promise.all(
          scan.meals.map(async (meal) => {
            try {
              const videos = await searchYouTube(meal.youtubeQuery);
              return { meal, videos };
            } catch (err) {
              return {
                meal,
                videos: [],
                videoError:
                  err instanceof Error ? err.message : "Video search failed",
              };
            }
          })
        );
        setMealVideos(withVideos);
      } else {
        setMealVideos(scan.meals.map((meal) => ({ meal, videos: [] })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoadingPhase(null);
    }
  };

  const handlePersonaSelect = (next: PersonaId) => {
    setPersona(next);
    setToast("Goal updated — meals will match this style.");
  };

  const handleToggleSave = (meal: MealSuggestion) => {
    const { saved, meals } = toggleSavedMeal(meal);
    setSavedMeals(meals);
    setToast(saved ? `Saved ${meal.name}` : `Removed ${meal.name}`);
  };

  const handleRemoveSaved = (id: string) => {
    const next = savedMeals.filter((item) => item.id !== id);
    saveSavedMeals(next);
    setSavedMeals(next);
    setToast("Removed from saved meals");
  };

  const handleToggleGrocery = (id: string) => {
    setGroceryItems(toggleGroceryItem(id));
  };

  const handleAddGrocery = (names: string[]) => {
    const { items, added } = addGroceryItems(names);
    setGroceryItems(items);
    if (added > 0) {
      setToast(`Added ${added} item${added === 1 ? "" : "s"} to your list`);
    }
  };

  const handleRemoveGrocery = (id: string) => {
    setGroceryItems(removeGroceryItem(id));
  };

  const handleRenameGrocery = (id: string, name: string) => {
    const { items, renamed } = renameGroceryItem(id, name);
    setGroceryItems(items);
    return renamed;
  };

  const handleClearCheckedGrocery = () => {
    setGroceryItems(clearCheckedGrocery());
    setToast("Cleared checked grocery items");
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
    setToast("History cleared");
  };

  const handleOnboardingComplete = () => {
    setProfile((current) => ({ ...current, onboardingComplete: true }));
    setToast("You're ready — snap your first fridge photo!");
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHome = () => setActiveTab("home");
  const openGrocery = () => setActiveTab("grocery");

  return (
    <div className="device-stage">
      <div className="device-frame">
        <div className="device-frame__chrome" aria-hidden>
          <span className="device-frame__time">9:41</span>
          <span className="device-frame__island" />
          <span className="device-frame__signal">
            <span />
            <span />
            <span />
          </span>
        </div>

        <div className="app">
          <div className="app__viewport">
            <div className="shell">
          <InstallApp />

          {activeTab === "home" && (
            <HomeScreen
              health={health}
              persona={persona}
              scanStreak={profile.scanStreak}
              file={file}
              preview={preview}
              loadingPhase={loadingPhase}
              error={error}
              result={result}
              mealVideos={mealVideos}
              savedMeals={savedMeals}
              onFile={handleFile}
              onScan={handleScan}
              onScanAgain={handleScanAgain}
              onPersonaSelect={handlePersonaSelect}
              onToggleSave={handleToggleSave}
              onOpenGrocery={openGrocery}
              onShare={(shared) =>
                setToast(shared ? "Meal shared!" : "Could not share meal")
              }
              onStarRated={(stars, openedStore) => {
                setToast(
                  openedStore
                    ? `Thanks for ${stars} stars! Opening the store to leave your review.`
                    : `Thanks for ${stars} stars! Store link will work once we launch.`,
                );
              }}
            />
          )}

          {activeTab === "grocery" && (
            <GroceryScreen
              items={groceryItems}
              onAddItems={handleAddGrocery}
              onToggleItem={handleToggleGrocery}
              onRenameItem={handleRenameGrocery}
              onRemoveItem={handleRemoveGrocery}
              onClearChecked={handleClearCheckedGrocery}
            />
          )}

          {activeTab === "saved" && (
            <SavedScreen
              savedMeals={savedMeals}
              onRemoveMeal={handleRemoveSaved}
              onStartScan={openHome}
            />
          )}

          {activeTab === "meals" && (
            <MealsScreen
              health={health}
              savedMeals={savedMeals}
              persona={persona}
              avoidAllergies={profile.avoidAllergies}
              bookMode={settings.bookMode ?? true}
              onBookModeChange={(bookMode) =>
                setSettings((current) => ({ ...current, bookMode }))
              }
              onToggleSave={handleToggleSave}
              onAddToGrocery={(names) => handleAddGrocery(names)}
              onOpenGrocery={openGrocery}
            />
          )}

          {activeTab === "you" && (
            <YouScreen
              profile={profile}
              persona={persona}
              history={history}
              savedMeals={savedMeals}
              settings={settings}
              health={health}
              onProfileChange={setProfile}
              onPersonaSelect={handlePersonaSelect}
              onSettingsChange={setSettings}
              onToggleSave={handleToggleSave}
              onClearHistory={handleClearHistory}
            />
          )}
            </div>
          </div>

          <BottomNav
            active={activeTab}
            onChange={handleTabChange}
            savedCount={savedMeals.length}
            groceryCount={groceryItems.filter((item) => !item.checked).length}
          />

          {showOnboarding && (
            <Onboarding
              persona={persona}
              onPersonaSelect={setPersona}
              onComplete={handleOnboardingComplete}
            />
          )}

          <Toast message={toast} onClear={clearToast} />
        </div>
      </div>
      <p className="device-stage__label" aria-hidden>
        Mobile preview · 412px
      </p>
    </div>
  );
}
