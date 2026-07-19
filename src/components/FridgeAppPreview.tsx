import { AppAtmosphere } from "./AppAtmosphere";
import { BottomNav } from "./BottomNav";
import { LayoutVariantProvider } from "../context/LayoutVariantContext";
import { GroceryScreen } from "../screens/GroceryScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { MealsScreen } from "../screens/MealsScreen";
import { SavedScreen } from "../screens/SavedScreen";
import { YouScreen } from "../screens/YouScreen";
import type {
  AppSettings,
  GroceryItem,
  PersonaId,
  SavedMeal,
  TabId,
  UserProfile,
} from "../types/app";
import type { FridgeThemeId } from "../types/theme";
import { layoutVariantForTheme } from "../types/theme";
import type { HealthStatus, MealSuggestion, MealWithVideos, ScanResult } from "../types/scan";

const noop = () => {};
const noopBool = () => false;

export interface FridgeAppPreviewProps {
  themeId: FridgeThemeId;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  health: HealthStatus;
  profile: UserProfile;
  persona: PersonaId;
  settings: AppSettings;
  savedMeals: SavedMeal[];
  groceryItems: GroceryItem[];
  scanResult: ScanResult | null;
  mealVideos: MealWithVideos[];
  scanPreview: string | null;
}

export function FridgeAppPreview({
  themeId,
  activeTab,
  onTabChange,
  health,
  profile,
  persona,
  settings,
  savedMeals,
  groceryItems,
  scanResult,
  mealVideos,
  scanPreview,
}: FridgeAppPreviewProps) {
  const handleToggleSave = (_meal: MealSuggestion) => noop();
  const layoutVariant = layoutVariantForTheme(themeId);

  return (
    <div className="device-frame theme-preview__frame">
      <div className="device-frame__chrome" aria-hidden>
        <span className="device-frame__time">9:41</span>
        <span className="device-frame__island" />
        <span className="device-frame__signal">
          <span />
          <span />
          <span />
        </span>
      </div>

      <LayoutVariantProvider variant={layoutVariant}>
        <div
          className={`app theme-preview__app${scanResult ? " home-results" : ""}`}
          data-active-tab={activeTab}
          data-fridge-theme={themeId}
        >
          <AppAtmosphere tab={activeTab} themeId={themeId} />
          <div className="app__viewport">
            <div className="shell">
              <div className="tab-panels">
              <div
                className={`tab-panel tab-panel--home${activeTab === "home" ? " tab-panel--active" : ""}`}
                aria-hidden={activeTab !== "home"}
              >
                <HomeScreen
                  health={health}
                  persona={persona}
                  avoidAllergies={profile.avoidAllergies}
                  scanStreak={profile.scanStreak}
                  file={scanResult ? ({} as File) : null}
                  preview={scanPreview}
                  loadingPhase={null}
                  error={null}
                  result={scanResult}
                  mealVideos={mealVideos}
                  savedMeals={savedMeals}
                  onFile={noop}
                  onScan={noop}
                  onScanAgain={noop}
                  onPersonaSelect={noop}
                  onToggleSave={handleToggleSave}
                  onOpenGrocery={() => onTabChange("grocery")}
                  onShare={noop}
                  onStarRated={noop}
                />
              </div>

              <div
                className={`tab-panel tab-panel--grocery${activeTab === "grocery" ? " tab-panel--active" : ""}`}
                aria-hidden={activeTab !== "grocery"}
              >
                <GroceryScreen
                  items={groceryItems}
                  onAddItems={noop}
                  onToggleItem={noop}
                  onRenameItem={() => noopBool()}
                  onRemoveItem={noop}
                  onClearChecked={noop}
                />
              </div>

              <div
                className={`tab-panel tab-panel--saved${activeTab === "saved" ? " tab-panel--active" : ""}`}
                aria-hidden={activeTab !== "saved"}
              >
                <SavedScreen
                  savedMeals={savedMeals}
                  onRemoveMeal={noop}
                  onStartScan={() => onTabChange("home")}
                />
              </div>

              <div
                className={`tab-panel tab-panel--meals${activeTab === "meals" ? " tab-panel--active" : ""}`}
                aria-hidden={activeTab !== "meals"}
              >
                <MealsScreen
                  health={health}
                  savedMeals={savedMeals}
                  persona={persona}
                  avoidAllergies={profile.avoidAllergies}
                  bookMode={settings.bookMode ?? true}
                  onBookModeChange={noop}
                  onToggleSave={handleToggleSave}
                  onAddToGrocery={noop}
                  onOpenGrocery={() => onTabChange("grocery")}
                />
              </div>

              <div
                className={`tab-panel tab-panel--you${activeTab === "you" ? " tab-panel--active" : ""}`}
                aria-hidden={activeTab !== "you"}
              >
                <YouScreen
                  profile={profile}
                  persona={persona}
                  history={[]}
                  savedMeals={savedMeals}
                  settings={settings}
                  health={health}
                  onProfileChange={noop}
                  onPersonaSelect={noop}
                  onSettingsChange={noop}
                  onToggleSave={handleToggleSave}
                  onClearHistory={noop}
                />
              </div>
            </div>
          </div>
        </div>

        <BottomNav
          active={activeTab}
          onChange={onTabChange}
          savedCount={savedMeals.length}
          groceryCount={groceryItems.filter((item) => !item.checked).length}
        />
        </div>
      </LayoutVariantProvider>
    </div>
  );
}
