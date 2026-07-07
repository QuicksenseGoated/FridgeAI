import { youtubeSearchUrl } from "../services/scanApi";
import type { HealthStatus, ScanResult, YouTubeVideo } from "../types/scan";

interface MealWithVideos {
  meal: ScanResult["meals"][number];
  videos: YouTubeVideo[];
  videoError?: string;
}

interface ScanResultsProps {
  result: ScanResult;
  mealVideos: MealWithVideos[];
  health: HealthStatus | null;
  preview: string | null;
  onScanAgain: () => void;
}

export function ScanResults({
  result,
  mealVideos,
  health,
  preview,
  onScanAgain,
}: ScanResultsProps) {
  return (
    <section className="results">
      <div className="results__hero card">
        <div className="results__hero-copy">
          <p className="results__label">Your scan</p>
          <h2>{result.meals.length} meals from what you have</h2>
          {result.notes && <p className="results__notes">{result.notes}</p>}
        </div>
        {preview && (
          <img src={preview} alt="" className="results__thumb" aria-hidden />
        )}
      </div>

      <div className="card">
        <div className="card__head">
          <h2>Spotted ingredients</h2>
          <p>{result.ingredients.length} items detected</p>
        </div>
        <div className="chips">
          {result.ingredients.map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="meal-list">
        {mealVideos.map(({ meal, videos, videoError }, index) => (
          <article key={`${meal.name}-${index}`} className="meal card">
            <div className="meal__top">
              <span className="meal__index">{index + 1}</span>
              <div>
                <h3>{meal.name}</h3>
                {meal.prepTime && (
                  <p className="meal__time">~{meal.prepTime}</p>
                )}
              </div>
            </div>

            <p className="meal__why">{meal.why}</p>

            <div className="meal__uses">
              {meal.uses.map((item) => (
                <span key={item} className="chip chip--soft">
                  {item}
                </span>
              ))}
            </div>

            <div className="meal__videos">
              <p className="meal__videos-label">How to cook it</p>
              {videos.length > 0 ? (
                <ul className="video-list">
                  {videos.map((video) => (
                    <li key={video.videoId}>
                      <a
                        href={video.url}
                        target="_blank"
                        rel="noreferrer"
                        className="video-link"
                      >
                        {video.thumbnail && (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="video-thumb"
                          />
                        )}
                        <span>
                          <strong>{video.title}</strong>
                          <small>{video.channelTitle}</small>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="video-fallback">
                  {videoError && (
                    <p className="alert alert--warn">{videoError}</p>
                  )}
                  <a
                    href={youtubeSearchUrl(meal.youtubeQuery)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--ghost"
                  >
                    Watch on YouTube →
                  </a>
                  {health?.youtube === "invalid" && (
                    <p className="hint">
                      Add a Cloud Console key (AIza…) for in-app videos.
                    </p>
                  )}
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="btn btn--secondary" onClick={onScanAgain}>
        Scan another photo
      </button>

      <p className="disclaimer">
        Meal suggestions are AI-generated — not medical or dietary advice.
        Double-check allergens before cooking.
      </p>
    </section>
  );
}
