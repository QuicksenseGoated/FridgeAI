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
}

function getYouTubeKey(): string {
  loadEnv();
  const key = process.env.YOUTUBE_API_KEY?.trim() ?? "";
  if (!key.startsWith("AIza")) return "";
  return key;
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
          thumbnails?: { medium?: { url?: string } };
        };
      }[];
    };

    const videos: YouTubeVideo[] = (data.items ?? [])
      .filter((item) => item.id?.videoId)
      .map((item) => {
        const videoId = item.id!.videoId!;
        return {
          videoId,
          title: item.snippet?.title ?? "Video",
          channelTitle: item.snippet?.channelTitle ?? "",
          url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? "",
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
