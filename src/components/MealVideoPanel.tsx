import { useMealVideos } from "../hooks/useMealVideos";
import { youtubeSearchUrl } from "../services/scanApi";
import type { HealthStatus, YouTubeVideo } from "../types/scan";
import { VideoCard } from "./VideoCard";

interface MealVideoPanelProps {
  query: string;
  health: HealthStatus | null;
  active?: boolean;
  videos?: YouTubeVideo[];
  videoError?: string;
  title?: string;
  compact?: boolean;
  className?: string;
}

export function MealVideoPanel({
  query,
  health,
  active = true,
  videos: preloaded,
  videoError: preloadedError,
  title = "Recipe videos",
  compact = false,
  className = "",
}: MealVideoPanelProps) {
  const shouldFetch = active && !preloaded?.length && health?.youtube === "ready";
  const { videos: fetched, loading, error: fetchError } = useMealVideos(
    query,
    shouldFetch
  );

  const videos = preloaded?.length ? preloaded : fetched;
  const error = preloadedError ?? fetchError;
  const youtubeReady = health?.youtube === "ready";
  const youtubeInvalid = health?.youtube === "invalid";

  if (!query.trim() || !active) return null;

  return (
    <section className={`meal-video-panel${className ? ` ${className}` : ""}`}>
      <h4 className="meal-video-panel__title">{title}</h4>

      {loading && (
        <p className="meal-video-panel__status">Finding recipe videos…</p>
      )}

      {!loading && videos.length > 0 && (
        <div className={`meal-video-panel__grid${compact ? " meal-video-panel__grid--compact" : ""}`}>
          {videos.map((video) => (
            <VideoCard key={video.videoId} video={video} compact={compact} />
          ))}
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="meal-video-panel__fallback">
          {error && <p className="alert alert--warn">{error}</p>}
          {!youtubeReady && (
            <p className="meal-video-panel__hint">
              {youtubeInvalid
                ? "Add a valid YOUTUBE_API_KEY (AIza…) in .env to show videos in the app."
                : "Recipe videos load when the YouTube API is connected."}
            </p>
          )}
          <a
            href={youtubeSearchUrl(query)}
            target="_blank"
            rel="noreferrer"
            className="btn btn--ghost meal-video-panel__search"
          >
            Search on YouTube →
          </a>
        </div>
      )}
    </section>
  );
}
