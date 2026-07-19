import type { TabId } from "./app";

export type FridgeThemeId = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";

/** All preview phones share the normal FridgeAI layout — skins change surfaces only. */
export type LayoutVariant = "classic";

export interface FridgeThemeMeta {
  id: FridgeThemeId;
  letter: string;
  name: string;
  subtitle: string;
  pickNotes: string;
}

export const FRIDGE_THEMES: FridgeThemeMeta[] = [
  {
    id: "a",
    letter: "1",
    name: "Warm Kitchen",
    subtitle: "Photo atmospheres · cream glass cards · soft asymmetric corners.",
    pickNotes: "Backgrounds · 92% cream panels · yellow-blue tab washes",
  },
  {
    id: "b",
    letter: "2",
    name: "Frost Glass",
    subtitle: "Cool blur · 70% transparent white cards · icy blue highlights.",
    pickNotes: "Transparency · blur · cool accent bars · medium radius",
  },
  {
    id: "c",
    letter: "3",
    name: "Bold Contrast",
    subtitle: "Nearly solid cards · crisp edges · strong tab color pops.",
    pickNotes: "Opaque surfaces · tighter 12px radius · vivid accent bars",
  },
  {
    id: "d",
    letter: "4",
    name: "Dark Glow",
    subtitle: "Dark tinted glass · glowing tab colors · muted photo wash.",
    pickNotes: "Dark card fill · colored glow · soft white text on panels",
  },
  {
    id: "e",
    letter: "5",
    name: "Sage Market",
    subtitle: "Green atmosphere tint · sage borders · fresh shop highlights.",
    pickNotes: "Green backgrounds · sage card borders · market accent bar",
  },
  {
    id: "f",
    letter: "6",
    name: "Blush Mist",
    subtitle: "Rose photo wash · pink-tinted glass · extra-round corners.",
    pickNotes: "Blush transparency · 24px radius · rose accent highlights",
  },
  {
    id: "g",
    letter: "7",
    name: "Honey Parchment",
    subtitle: "Warm amber wash · parchment card tint · terracotta accents.",
    pickNotes: "Amber backgrounds · parchment 88% cards · warm outline color",
  },
  {
    id: "h",
    letter: "8",
    name: "Lilac Dream",
    subtitle: "Purple atmosphere · lilac glass panels · soft lavender accents.",
    pickNotes: "Lilac wash · high transparency · purple tab accent bars",
  },
];

export function layoutVariantForTheme(_id: FridgeThemeId): LayoutVariant {
  return "classic";
}

export function initialPhoneTabs(tab: TabId = "home"): Record<FridgeThemeId, TabId> {
  return Object.fromEntries(FRIDGE_THEMES.map((t) => [t.id, tab])) as Record<
    FridgeThemeId,
    TabId
  >;
}
