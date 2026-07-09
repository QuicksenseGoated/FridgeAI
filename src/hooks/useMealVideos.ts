import { useEffect, useState } from "react";
import { searchYouTube } from "../services/scanApi";
import type { YouTubeVideo } from "../types/scan";

interface CachedVideos {
  videos: YouTubeVideo[];
  error?: string;
}

const videoCache = new Map<string, CachedVideos>();

export function useMealVideos(query: string | undefined, enabled: boolean) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query?.trim();
    if (!enabled || !trimmed) {
      setVideos([]);
      setError(null);
      setLoading(false);
      return;
    }

    const cached = videoCache.get(trimmed);
    if (cached) {
      setVideos(cached.videos);
      setError(cached.error ?? null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    searchYouTube(trimmed)
      .then((results) => {
        if (cancelled) return;
        videoCache.set(trimmed, { videos: results });
        setVideos(results);
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Video search failed";
        videoCache.set(trimmed, { videos: [], error: message });
        setVideos([]);
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, query]);

  return { videos, loading, error };
}
