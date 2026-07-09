import type { Request, Response } from "express";
import dotenv from "dotenv";
import path from "node:path";

function loadEnv() {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    override: true,
  });
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
  thumbnail: string;
  duration?: string;
  publishedAt?: string;
}

function getYouTubeKey(): string {
  loadEnv();
  const key = process.env.YOUTUBE_API_KEY?.trim() ?? "";
  if (!key.startsWith("AIza")) return "";
  return key;
}

function formatDuration(isoDuration: string | undefined): string | undefined {
  if (!isoDuration) return undefined;

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchVideoDetails(
  apiKey: string,
  videoIds: string[]
): Promise<Map<string, { duration?: string; publishedAt?: string }>> {
  if (videoIds.length === 0) return new Map();

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails,snippet");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const response = await fetch(url);
  if (!response.ok) return new Map();

  const data = (await response.json()) as {
    items?: {
      id?: string;
      contentDetails?: { duration?: string };
      snippet?: { publishedAt?: string };
    }[];
  };

  const details = new Map<string, { duration?: string; publishedAt?: string }>();

  for (const item of data.items ?? []) {
    if (!item.id) continue;
    details.set(item.id, {
      duration: formatDuration(item.contentDetails?.duration),
      publishedAt: item.snippet?.publishedAt,
    });
  }

  return details;
}

export async function youtubeSearchHandler(req: Request, res: Response) {
  try {
    const query = String(req.query.q ?? "").trim();
    if (!query) {
      res.status(400).json({ error: "Query is required" });
      return;
    }

    const apiKey = getYouTubeKey();
    if (!apiKey) {
      res.status(503).json({
        error: "YouTube API key missing. Add YOUTUBE_API_KEY to .env",
      });
      return;
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "3");
    url.searchParams.set("safeSearch", "strict");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url);
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`YouTube ${response.status}: ${err}`);
    }

    const data = (await response.json()) as {
      items?: {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: {
            medium?: { url?: string };
            high?: { url?: string };
          };
        };
      }[];
    };

    const baseVideos = (data.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => {
        const videoId = item.id!.videoId!;
        return {
          videoId,
          title: item.snippet?.title ?? "Video",
          channelTitle: item.snippet?.channelTitle ?? "",
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail:
            item.snippet?.thumbnails?.high?.url ??
            item.snippet?.thumbnails?.medium?.url ??
            "",
        };
      });

    const details = await fetchVideoDetails(
      apiKey,
      baseVideos.map((video) => video.videoId)
    );

    const videos: YouTubeVideo[] = baseVideos.map((video) => {
      const meta = details.get(video.videoId);
      return {
        ...video,
        duration: meta?.duration,
        publishedAt: meta?.publishedAt,
      };
    });

    res.json({ query, videos });
  } catch (err) {
    console.error("youtube-search failed:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "YouTube search failed",
    });
  }
}
