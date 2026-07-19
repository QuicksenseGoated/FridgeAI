import type { TabId } from "../types/app";

/** Full-bleed atmosphere photos — Unsplash License (free commercial use). */
function atmosphereUrl(photoId: string, width = 1200, height = 1600): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(width),
    h: String(height),
    q: "75",
  });
  return `https://images.unsplash.com/${photoId}?${params.toString()}`;
}

export const TAB_ATMOSPHERE: Record<TabId, { photo: string; position: string }> = {
  home: {
    photo: atmosphereUrl("photo-1540420773420-3366772f4999"),
    position: "center 25%",
  },
  grocery: {
    photo: atmosphereUrl("photo-1416879595882-ca3221a40714"),
    position: "center 40%",
  },
  saved: {
    photo: atmosphereUrl("photo-1466693908972-6ef022106cc0"),
    position: "center 35%",
  },
  meals: {
    photo: atmosphereUrl("photo-1556910103-1c02745aae4d"),
    position: "center 25%",
  },
  you: {
    photo: atmosphereUrl("photo-1499002238840-d26325114870"),
    position: "center 22%",
  },
};
