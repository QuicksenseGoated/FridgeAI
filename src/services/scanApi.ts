import type {
  HealthStatus,
  MealSuggestion,
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
  mimeType: string,
  persona?: string,
  avoidAllergies?: string[]
): Promise<ScanResult> {
  const res = await fetch("/api/scan-fridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mimeType, persona, avoidAllergies }),
  });

  const data = (await res.json()) as ScanResult & { error?: string; retryable?: boolean };
  if (!res.ok) {
    const message = data.error ?? "Scan failed";
    throw new Error(message);
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

export async function searchMeals(
  query: string,
  persona?: string,
  avoidAllergies?: string[]
): Promise<{ meals: MealSuggestion[]; usedAI: boolean }> {
  const res = await fetch("/api/search-meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, persona, avoidAllergies }),
  });

  const data = (await res.json()) as {
    meals?: MealSuggestion[];
    usedAI?: boolean;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error ?? "Meal search failed");
  }

  return { meals: data.meals ?? [], usedAI: data.usedAI ?? true };
}

export async function transcribeGrocery(
  audioBase64: string,
  mimeType: string,
): Promise<{ text: string }> {
  let res: Response;

  try {
    res = await fetch("/api/transcribe-grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioBase64, mimeType }),
    });
  } catch {
    throw new Error("SERVER_OFFLINE");
  }

  const data = (await res.json()) as { text?: string; error?: string };

  if (!res.ok) {
    throw new Error(data.error ?? "Voice transcription failed");
  }

  if (!data.text?.trim()) {
    throw new Error("Could not understand that. Try again.");
  }

  return { text: data.text };
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
