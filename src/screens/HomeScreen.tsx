import { AppHeader } from "../components/AppHeader";
import { LoadingOverlay, type LoadingPhase } from "../components/LoadingOverlay";
import { PhotoCapture } from "../components/PhotoCapture";
import { ScanResults } from "../components/ScanResults";
import { NoFoodRoast } from "../components/NoFoodRoast";
import { RateUsBanner } from "../components/RateUsBanner";
import { StepBar } from "../components/StepBar";
import type { HealthStatus, MealWithVideos, ScanResult } from "../types/scan";
import type { PersonaId, SavedMeal } from "../types/app";

interface HomeScreenProps {
  health: HealthStatus | null;
  persona: PersonaId;
  scanStreak: number;
  file: File | null;
  preview: string | null;
  loadingPhase: LoadingPhase | null;
  error: string | null;
  result: ScanResult | null;
  mealVideos: MealWithVideos[];
  savedMeals: SavedMeal[];
  onFile: (file: File | null) => void;
  onScan: () => void;
  onScanAgain: () => void;
  onPersonaSelect: (persona: PersonaId) => void;
  onToggleSave: (meal: MealWithVideos["meal"]) => void;
  onOpenGrocery: () => void;
  onShare?: (shared: boolean) => void;
  onStarRated?: (stars: number, openedStore: boolean) => void;
}

export function HomeScreen({
  health,
  scanStreak,
  file,
  preview,
  loadingPhase,
  error,
  result,
  mealVideos,
  savedMeals,
  onFile,
  onScan,
  onScanAgain,
  onToggleSave,
  onOpenGrocery,
  onShare,
  onStarRated,
}: HomeScreenProps) {
  const loading = loadingPhase !== null;
  const currentStep = result ? 2 : 1;

  return (
    <div className={result ? undefined : "home-pre-scan"}>
      <AppHeader health={health} compact={Boolean(result)} />

      {!result && <RateUsBanner scanStreak={scanStreak} onRated={onStarRated} />}

      <StepBar current={currentStep} />

      <main className="main">
        {!result && (
          <PhotoCapture
            preview={preview}
            hasFile={Boolean(file)}
            loading={loading}
            error={error}
            onFile={onFile}
            onScan={onScan}
          />
        )}

        {result?.noFoodDetected && (
          <NoFoodRoast
            message={
              result.funnyMessage ??
              "Almost had us! Snap what's inside your fridge and we'll find you real meals."
            }
            detectedObject={result.detectedObject}
            preview={preview}
            onScanAgain={onScanAgain}
          />
        )}

        {result && !result.noFoodDetected && (
          <ScanResults
            result={result}
            mealVideos={mealVideos}
            health={health}
            preview={preview}
            savedMeals={savedMeals}
            onScanAgain={onScanAgain}
            onToggleSave={onToggleSave}
            onOpenGrocery={onOpenGrocery}
            onShare={onShare}
          />
        )}
      </main>

      {loadingPhase && <LoadingOverlay phase={loadingPhase} />}
    </div>
  );
}
