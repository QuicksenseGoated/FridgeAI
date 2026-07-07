import type {
  HealthStatus,
  ScanResult,
  YouTubeVideo,
} from "../types/scan";

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("API unreachable");
  return res.json() as Promise<HealthStatus>;
}

export async function scanFridge(
  imageBase64: string,
  mimeType: string
): Promise<ScanResult> {
  const res = await fetch("/api/scan-fridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  const data = (await res.json()) as ScanResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Scan failed");
  }

  return data;
}

export async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const res = await fetch(
    `/api/youtube-search?q=${encodeURIComponent(query)}`
  );
  const data = (await res.json()) as {
    videos?: YouTubeVideo[];
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "YouTube search failed");
  }

  return data.videos ?? [];
}

export function youtubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const [, base64 = result] = result.split(",");
      resolve({ base64, mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = () => reject(new Error("Could not read photo"));
    reader.readAsDataURL(file);
  });
}
