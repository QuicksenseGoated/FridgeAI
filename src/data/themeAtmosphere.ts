import type { TabId } from "../types/app";
import type { FridgeThemeId } from "../types/theme";
import { TAB_ATMOSPHERE } from "./decorPhotos";

export interface ThemeAtmosphereLayer {
  photo: string;
  position: string;
  /** 0–1 — how visible the photo is under theme overlays */
  photoStrength?: number;
}

function atmosphereUrl(photoId: string): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: "1200",
    h: "1600",
    q: "75",
  });
  return `https://images.unsplash.com/${photoId}?${params.toString()}`;
}

/** Theme-specific atmosphere — same tabs, different visual philosophy per theme. */
export const THEME_ATMOSPHERE: Record<
  FridgeThemeId,
  Record<TabId, ThemeAtmosphereLayer>
> = {
  a: TAB_ATMOSPHERE,

  b: {
    home: {
      photo: atmosphereUrl("photo-1546069901-ba9599a7e63c"),
      position: "center 30%",
      photoStrength: 1,
    },
    grocery: {
      photo: atmosphereUrl("photo-1610831305168-8b7f3a632875"),
      position: "center 40%",
      photoStrength: 1,
    },
    saved: {
      photo: atmosphereUrl("photo-1504674900247-0877df9cc836"),
      position: "center 35%",
      photoStrength: 1,
    },
    meals: {
      photo: atmosphereUrl("photo-1555939594-58d7cb561ad1"),
      position: "center 25%",
      photoStrength: 1,
    },
    you: {
      photo: atmosphereUrl("photo-1414235077428-338989a2e8c0"),
      position: "center 20%",
      photoStrength: 1,
    },
  },

  c: {
    home: { photo: "", position: "center", photoStrength: 0 },
    grocery: { photo: "", position: "center", photoStrength: 0 },
    saved: { photo: "", position: "center", photoStrength: 0 },
    meals: { photo: "", position: "center", photoStrength: 0 },
    you: { photo: "", position: "center", photoStrength: 0 },
  },

  d: {
    home: {
      photo: atmosphereUrl("photo-1540420773420-3366772f4999"),
      position: "center 30%",
      photoStrength: 0.35,
    },
    grocery: {
      photo: atmosphereUrl("photo-1416879595882-ca3221a40714"),
      position: "center 40%",
      photoStrength: 0.3,
    },
    saved: {
      photo: atmosphereUrl("photo-1466693908972-6ef022106cc0"),
      position: "center 35%",
      photoStrength: 0.3,
    },
    meals: {
      photo: atmosphereUrl("photo-1488459716541-3fb7787b5d73"),
      position: "center 30%",
      photoStrength: 0.85,
    },
    you: {
      photo: atmosphereUrl("photo-1499002238840-d26325114870"),
      position: "center 20%",
      photoStrength: 0.25,
    },
  },

  e: {
    home: {
      photo: atmosphereUrl("photo-1416879595882-ca3221a40714"),
      position: "center 35%",
      photoStrength: 0.75,
    },
    grocery: {
      photo: atmosphereUrl("photo-1610831305168-8b7f3a632875"),
      position: "center 40%",
      photoStrength: 0.9,
    },
    saved: {
      photo: atmosphereUrl("photo-1540420773420-3366772f4999"),
      position: "center 30%",
      photoStrength: 0.5,
    },
    meals: {
      photo: atmosphereUrl("photo-1488459716541-3fb7787b5d73"),
      position: "center 25%",
      photoStrength: 0.55,
    },
    you: {
      photo: atmosphereUrl("photo-1466693908972-6ef022106cc0"),
      position: "center 20%",
      photoStrength: 0.45,
    },
  },

  f: {
    home: {
      photo: atmosphereUrl("photo-1546069901-ba9599a7e63c"),
      position: "center 30%",
      photoStrength: 1,
    },
    grocery: {
      photo: atmosphereUrl("photo-1504674900247-0877df9cc836"),
      position: "center 35%",
      photoStrength: 1,
    },
    saved: {
      photo: atmosphereUrl("photo-1555939594-58d7cb561ad1"),
      position: "center 25%",
      photoStrength: 1,
    },
    meals: {
      photo: atmosphereUrl("photo-1414235077428-338989a2e8c0"),
      position: "center 20%",
      photoStrength: 1,
    },
    you: {
      photo: atmosphereUrl("photo-1499002238840-d26325114870"),
      position: "center 15%",
      photoStrength: 0.85,
    },
  },

  g: {
    home: { photo: "", position: "center", photoStrength: 0 },
    grocery: { photo: "", position: "center", photoStrength: 0 },
    saved: { photo: "", position: "center", photoStrength: 0 },
    meals: { photo: "", position: "center", photoStrength: 0 },
    you: { photo: "", position: "center", photoStrength: 0 },
  },

  h: {
    home: {
      photo: atmosphereUrl("photo-1504674900247-0877df9cc836"),
      position: "center 40%",
      photoStrength: 0.4,
    },
    grocery: {
      photo: atmosphereUrl("photo-1488459716541-3fb7787b5d73"),
      position: "center 30%",
      photoStrength: 0.35,
    },
    saved: {
      photo: atmosphereUrl("photo-1466693908972-6ef022106cc0"),
      position: "center 35%",
      photoStrength: 0.35,
    },
    meals: {
      photo: atmosphereUrl("photo-1546069901-ba9599a7e63c"),
      position: "center 25%",
      photoStrength: 0.45,
    },
    you: {
      photo: atmosphereUrl("photo-1499002238840-d26325114870"),
      position: "center 20%",
      photoStrength: 0.3,
    },
  },
};

export function getThemeAtmosphere(
  themeId: FridgeThemeId,
  tab: TabId,
): ThemeAtmosphereLayer {
  return THEME_ATMOSPHERE[themeId][tab];
}
