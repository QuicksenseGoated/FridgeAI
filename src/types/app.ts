import type { MealSuggestion, ScanResult } from "./scan";

export type TabId = "home" | "grocery" | "saved" | "meals" | "you";

export type PersonaId =
  | "balanced"
  | "weight-loss"
  | "high-protein"
  | "quick-easy"
  | "vegetarian"
  | "kid-friendly";

export type AllergyId =
  | "gluten"
  | "dairy"
  | "nuts"
  | "shellfish"
  | "eggs"
  | "soy";

export interface Persona {
  id: PersonaId;
  label: string;
  emoji: string;
  description: string;
}

export interface UserProfile {
  name: string;
  joinedAt: string;
  onboardingComplete: boolean;
  scanStreak: number;
  lastScanDate: string | null;
  avoidAllergies: AllergyId[];
}

export interface AppSettings {
  mealReminders: boolean;
  saveHistory: boolean;
  bookMode: boolean;
}

export interface ScanHistoryEntry {
  id: string;
  scannedAt: string;
  persona: PersonaId;
  ingredientCount: number;
  mealCount: number;
  ingredients: string[];
  mealNames: string[];
  shoppingList: string[];
  snapshot: ScanResult;
}

export interface SavedMeal {
  id: string;
  savedAt: string;
  meal: MealSuggestion;
}

export interface GroceryItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface PantryItem {
  name: string;
  lastSeen: string;
  count: number;
}

export const PERSONAS: Persona[] = [
  {
    id: "balanced",
    label: "Balanced",
    emoji: "🥗",
    description: "Everyday meals with a good mix of nutrients.",
  },
  {
    id: "weight-loss",
    label: "Weight loss",
    emoji: "🥒",
    description: "Lighter meals that keep you full without extra calories.",
  },
  {
    id: "high-protein",
    label: "High protein",
    emoji: "💪",
    description: "Protein-packed meals for energy and muscle support.",
  },
  {
    id: "quick-easy",
    label: "Quick & easy",
    emoji: "⚡",
    description: "Fast recipes when you want dinner on the table ASAP.",
  },
  {
    id: "vegetarian",
    label: "Vegetarian",
    emoji: "🌱",
    description: "Meat-free ideas using veggies, grains, and dairy.",
  },
  {
    id: "kid-friendly",
    label: "Kid-friendly",
    emoji: "🧒",
    description: "Fun, simple meals picky eaters might actually try.",
  },
];

export const ALLERGY_OPTIONS: { id: AllergyId; label: string; emoji: string }[] = [
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "dairy", label: "Dairy", emoji: "🥛" },
  { id: "nuts", label: "Nuts", emoji: "🥜" },
  { id: "shellfish", label: "Shellfish", emoji: "🦐" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "soy", label: "Soy", emoji: "🫘" },
];

export const DEFAULT_PROFILE: UserProfile = {
  name: "Chef",
  joinedAt: new Date().toISOString(),
  onboardingComplete: false,
  scanStreak: 0,
  lastScanDate: null,
  avoidAllergies: [],
};

export const DEFAULT_SETTINGS: AppSettings = {
  mealReminders: false,
  saveHistory: true,
  bookMode: true,
};
