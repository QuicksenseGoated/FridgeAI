import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { InstallApp } from "./components/InstallApp";
import { LoadingOverlay, type LoadingPhase } from "./components/LoadingOverlay";
import { PhotoCapture } from "./components/PhotoCapture";
import { ScanResults } from "./components/ScanResults";
import { StepBar } from "./components/StepBar";
import {
  fetchHealth,
  fileToBase64,
  scanFridge,
  searchYouTube,
} from "./services/scanApi";
import type { HealthStatus, ScanResult, YouTubeVideo } from "./types/scan";
import "./App.css";

interface MealWithVideos {
  meal: ScanResult["meals"][number];
  videos: YouTubeVideo[];
  videoError?: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [mealVideos, setMealVideos] = useState<MealWithVideos[]>([]);

  const loading = loadingPhase !== null;
  const currentStep = result ? 2 : 1;

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(() => setHealth({ ok: false, ai: "none", youtube: "none" }));
  }, []);

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
      const scan = await scanFridge(base64, mimeType);
      setResult(scan);

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

  return (
    <div className="shell">
      <AppHeader health={health} />
      <InstallApp />
      <StepBar current={currentStep} />

      <main className="main">
        {!result && (
          <PhotoCapture
            preview={preview}
            hasFile={Boolean(file)}
            loading={loading}
            error={error}
            onFile={handleFile}
            onScan={handleScan}
          />
        )}

        {result && (
          <ScanResults
            result={result}
            mealVideos={mealVideos}
            health={health}
            preview={preview}
            onScanAgain={handleScanAgain}
          />
        )}
      </main>

      {loadingPhase && <LoadingOverlay phase={loadingPhase} />}
    </div>
  );
}
