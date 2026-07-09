import type { MealSuggestion, ScanResult } from "../types/scan";
import type {
  AppSettings,
  GroceryItem,
  PantryItem,
  PersonaId,
  SavedMeal,
  ScanHistoryEntry,
  UserProfile,
} from "../types/app";
import {
  DEFAULT_PROFILE,
  DEFAULT_SETTINGS,
} from "../types/app";

const KEYS = {
  profile: "fridgeai:profile",
  persona: "fridgeai:persona",
  settings: "fridgeai:settings",
  history: "fridgeai:history",
  savedMeals: "fridgeai:saved-meals",
  groceryItems: "fridgeai:grocery-items",
  pantry: "fridgeai:pantry",
} as const;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

export function loadProfile(): UserProfile {
  const stored = readJson<Partial<UserProfile>>(KEYS.profile, {});
  return { ...DEFAULT_PROFILE, ...stored, avoidAllergies: stored.avoidAllergies ?? [] };
}

export function saveProfile(profile: UserProfile) {
  writeJson(KEYS.profile, profile);
}

export function loadPersona(): PersonaId {
  return readJson<PersonaId>(KEYS.persona, "balanced");
}

export function savePersona(persona: PersonaId) {
  writeJson(KEYS.persona, persona);
}

export function loadSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: AppSettings) {
  writeJson(KEYS.settings, settings);
}

export function loadHistory(): ScanHistoryEntry[] {
  return readJson<ScanHistoryEntry[]>(KEYS.history, []);
}

export function addHistoryEntry(entry: ScanHistoryEntry) {
  const history = loadHistory();
  writeJson(KEYS.history, [entry, ...history].slice(0, 20));
}

export function clearHistory() {
  localStorage.removeItem(KEYS.history);
}

export function loadSavedMeals(): SavedMeal[] {
  return readJson<SavedMeal[]>(KEYS.savedMeals, []);
}

export function saveSavedMeals(meals: SavedMeal[]) {
  writeJson(KEYS.savedMeals, meals);
}

export function toggleSavedMeal(meal: MealSuggestion): { saved: boolean; meals: SavedMeal[] } {
  const meals = loadSavedMeals();
  const existing = meals.find((item) => item.meal.name === meal.name);

  if (existing) {
    const next = meals.filter((item) => item.id !== existing.id);
    saveSavedMeals(next);
    return { saved: false, meals: next };
  }

  const next: SavedMeal[] = [
    {
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
      meal,
    },
    ...meals,
  ].slice(0, 50);

  saveSavedMeals(next);
  return { saved: true, meals: next };
}

export function isMealSaved(mealName: string, meals: SavedMeal[]) {
  return meals.some((item) => item.meal.name === mealName);
}

export function loadGroceryItems(): GroceryItem[] {
  return readJson<GroceryItem[]>(KEYS.groceryItems, []);
}

export function saveGroceryItems(items: GroceryItem[]) {
  writeJson(KEYS.groceryItems, items);
}

export function toggleGroceryItem(id: string): GroceryItem[] {
  const items = loadGroceryItems().map((item) =>
    item.id === id ? { ...item, checked: !item.checked } : item
  );
  saveGroceryItems(items);
  return items;
}

export function clearCheckedGrocery(): GroceryItem[] {
  const items = loadGroceryItems().filter((item) => !item.checked);
  saveGroceryItems(items);
  return items;
}

export function removeGroceryItem(id: string): GroceryItem[] {
  const items = loadGroceryItems().filter((item) => item.id !== id);
  saveGroceryItems(items);
  return items;
}

export function renameGroceryItem(
  id: string,
  name: string,
): { items: GroceryItem[]; renamed: boolean } {
  const trimmed = name.trim();
  const existing = loadGroceryItems();
  const current = existing.find((item) => item.id === id);

  if (!current || !trimmed || trimmed.length >= 80) {
    return { items: existing, renamed: false };
  }

  const normalized = normalizeName(trimmed);
  const duplicate = existing.some(
    (item) => item.id !== id && normalizeName(item.name) === normalized,
  );

  if (duplicate || normalizeName(current.name) === normalized) {
    return { items: existing, renamed: false };
  }

  const items = existing.map((item) =>
    item.id === id ? { ...item, name: trimmed } : item,
  );
  saveGroceryItems(items);
  return { items, renamed: true };
}

export function addGroceryItems(names: string[]): { items: GroceryItem[]; added: number } {
  const existing = loadGroceryItems();
  const existingNames = new Set(existing.map((item) => normalizeName(item.name)));

  const additions: GroceryItem[] = names
    .map((name) => name.trim())
    .filter((name) => name && !existingNames.has(normalizeName(name)))
    .map((name) => {
      existingNames.add(normalizeName(name));
      return {
        id: crypto.randomUUID(),
        name,
        checked: false,
      };
    });

  if (additions.length === 0) return { items: existing, added: 0 };

  const next = [...additions, ...existing].slice(0, 80);
  saveGroceryItems(next);
  return { items: next, added: additions.length };
}

export function mergeGroceryFromScan(scan: ScanResult) {
  const existing = loadGroceryItems();
  const existingNames = new Set(existing.map((item) => normalizeName(item.name)));
  const incoming = scan.shoppingList ?? [];

  const additions: GroceryItem[] = incoming
    .filter((name) => name.trim() && !existingNames.has(normalizeName(name)))
    .map((name) => ({
      id: crypto.randomUUID(),
      name: name.trim(),
      checked: false,
    }));

  const next = [...additions, ...existing].slice(0, 80);
  saveGroceryItems(next);
  return next;
}

export function loadPantry(): PantryItem[] {
  return readJson<PantryItem[]>(KEYS.pantry, []);
}

export function mergePantryFromScan(ingredients: string[]) {
  const pantry = loadPantry();
  const map = new Map(pantry.map((item) => [normalizeName(item.name), item]));
  const now = new Date().toISOString();

  for (const ingredient of ingredients) {
    const key = normalizeName(ingredient);
    const current = map.get(key);
    map.set(key, {
      name: ingredient.trim(),
      lastSeen: now,
      count: (current?.count ?? 0) + 1,
    });
  }

  const next = [...map.values()]
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 60);

  writeJson(KEYS.pantry, next);
  return next;
}

export function recordScanActivity(profile: UserProfile): UserProfile {
  const today = todayKey();
  const last = profile.lastScanDate?.slice(0, 10) ?? null;

  let scanStreak = profile.scanStreak;
  if (last === today) {
    scanStreak = Math.max(scanStreak, 1);
  } else if (last === yesterdayKey()) {
    scanStreak += 1;
  } else {
    scanStreak = 1;
  }

  return {
    ...profile,
    scanStreak,
    lastScanDate: new Date().toISOString(),
  };
}

// Legacy helper — migrate old string-only grocery list if present
export function migrateLegacyGrocery() {
  const legacy = localStorage.getItem("fridgeai:grocery-list");
  if (!legacy || loadGroceryItems().length > 0) return;

  try {
    const names = JSON.parse(legacy) as string[];
    saveGroceryItems(
      names.map((name) => ({
        id: crypto.randomUUID(),
        name,
        checked: false,
      }))
    );
    localStorage.removeItem("fridgeai:grocery-list");
  } catch {
    /* ignore */
  }
}
