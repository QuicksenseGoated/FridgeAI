import type { Request, Response } from "express";
import { filterMealsByAllergies } from "./allergyFilter.js";

export interface ScanRequestBody {
  imageBase64: string;
  mimeType?: string;
  persona?: string;
  avoidAllergies?: string[];
}

export interface MealNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  servings: string;
  note?: string;
}

export interface MealSuggestion {
  name: string;
  why: string;
  uses: string[];
  youtubeQuery: string;
  prepTime?: string;
  cookTime?: string;
  steps: string[];
  nutrition: MealNutrition;
}

export interface ScanResult {
  ingredients: string[];
  meals: MealSuggestion[];
  notes: string;
  shoppingList?: string[];
  noFoodDetected?: boolean;
  funnyMessage?: string;
  detectedObject?: string;
}

const GEMINI_MODELS = (
  process.env.GEMINI_MODEL?.trim()
    ? [process.env.GEMINI_MODEL.trim()]
    : [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-3-flash-preview",
      ]
).filter(Boolean);

const MAX_ATTEMPTS_PER_MODEL = 3;
const RETRY_DELAYS_MS = [1500, 3000, 5000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503;
}

function isModelFallbackStatus(status: number) {
  return status === 404 || status === 403;
}

function friendlyScanError(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes("503") ||
    lower.includes("unavailable") ||
    lower.includes("high demand") ||
    lower.includes("overloaded")
  ) {
    return "Google's AI is busy right now — we tried a few times. Wait a minute and tap Get my meal ideas again.";
  }

  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
    return "Too many requests to the AI right now. Please wait a minute and try again.";
  }

  if (lower.includes("abort") || lower.includes("timeout")) {
    return "The scan took too long. Try again with a smaller photo or better connection.";
  }

  if (lower.includes("api key") || lower.includes("403") || lower.includes("permission")) {
    return "Gemini API key issue. Check GEMINI_API_KEY in .env and restart the server.";
  }

  return "Could not scan your photo right now. Please try again in a moment.";
}

const DEFAULT_NUTRITION: MealNutrition = {
  calories: "—",
  protein: "—",
  carbs: "—",
  fat: "—",
  servings: "1",
  note: "Approximate estimate per serving.",
};

const SYSTEM_PROMPT = `You are a fridge/pantry vision assistant for a cooking app.

Given a photo, list visible food ingredients you can reasonably identify.
Then suggest 3-5 meals the user can cook using mostly those ingredients.

Rules:
- Only list food items you can see or reasonably infer from packaging
- If the photo is unclear, return fewer ingredients and explain in notes
- Suggest balanced, practical, reasonably healthy home-cooked meals
- Prefer simple recipes that use what's visible; pantry staples (salt, oil) are OK
- Each meal needs a short YouTube-friendly search query for a recipe video
- Include 5-8 clear numbered cooking steps per meal (prep through serve)
- Include approximate nutrition per serving (not medical advice)
- Do not give medical or weight-loss advice; keep "why" practical and food-focused
- Tailor meal suggestions to the user's selected goal/persona when provided
- Never suggest meals containing user-listed allergens; note safe substitutions in meal "why" when relevant
- Include a shoppingList of common extras the user may need to buy (not visible in photo) to complete suggested meals
- NO-FOOD DETECTION: If the photo clearly shows zero edible food — e.g. a fan, lamp, pet, car, selfie, shoes, electronics, furniture, landscape — and you are virtually 100% certain it is NOT a fridge, pantry, or food in any form, set "noFoodDetected" to true, return empty ingredients and meals arrays, and write a short funnyMessage (1-3 sentences). Tone: warm, playful teasing — never insulting or mean. Gently nudge them to scan their real fridge. Light jokes are OK (e.g. a fan is not dinner, and your dentist would prefer you stick to actual food), but keep it friendly like a buddy ribbing them. Name what you see in detectedObject. ONLY use noFoodDetected when extremely confident. If the photo is blurry, an empty fridge, or you might be wrong, keep noFoodDetected false and use notes instead.`;

const PERSONA_GUIDANCE: Record<string, string> = {
  balanced: "Suggest balanced everyday meals with a good mix of nutrients.",
  "weight-loss": "Prefer lighter, lower-calorie meals that are still filling and satisfying.",
  "high-protein": "Prioritize protein-rich meals using eggs, dairy, legumes, meat, or fish when visible.",
  "quick-easy": "Favor fast, simple recipes with minimal steps and common pantry staples.",
  vegetarian: "Suggest meat-free meals using vegetables, grains, dairy, and legumes.",
  "kid-friendly": "Suggest fun, approachable meals that are simple and appealing for children.",
};

const SYSTEM_PROMPT_JSON = `
Respond ONLY with valid JSON:
{
  "noFoodDetected": false,
  "detectedObject": "optional — what you see if not food, e.g. electric fan",
  "funnyMessage": "only when noFoodDetected is true — short friendly tease nudging them to scan their real fridge",
  "ingredients": ["item1", "item2"],
  "meals": [
    {
      "name": "Meal name",
      "why": "One sentence on why this works with what they have",
      "uses": ["ingredient1", "ingredient2"],
      "prepTime": "10 min",
      "cookTime": "15 min",
      "youtubeQuery": "easy meal name recipe",
      "steps": [
        "Step 1 instruction",
        "Step 2 instruction"
      ],
      "nutrition": {
        "calories": "~420 kcal",
        "protein": "~28g",
        "carbs": "~35g",
        "fat": "~14g",
        "fiber": "~6g",
        "servings": "2",
        "note": "Approximate per serving"
      }
    }
  ],
  "notes": "Optional tips or caveats",
  "shoppingList": ["optional item to buy", "another item"]
}`;

function getGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

function normalizeNutrition(raw: Partial<MealNutrition> | undefined): MealNutrition {
  if (!raw) return { ...DEFAULT_NUTRITION };

  return {
    calories: raw.calories?.trim() || DEFAULT_NUTRITION.calories,
    protein: raw.protein?.trim() || DEFAULT_NUTRITION.protein,
    carbs: raw.carbs?.trim() || DEFAULT_NUTRITION.carbs,
    fat: raw.fat?.trim() || DEFAULT_NUTRITION.fat,
    fiber: raw.fiber?.trim(),
    servings: raw.servings?.trim() || DEFAULT_NUTRITION.servings,
    note: raw.note?.trim() || DEFAULT_NUTRITION.note,
  };
}

function normalizeMeal(meal: Partial<MealSuggestion>): MealSuggestion | null {
  if (!meal?.name?.trim()) return null;

  const steps = Array.isArray(meal.steps)
    ? meal.steps.map((step) => String(step).trim()).filter(Boolean)
    : [];

  return {
    name: meal.name.trim(),
    why: meal.why?.trim() ?? "",
    uses: Array.isArray(meal.uses)
      ? meal.uses.map((item) => String(item).trim()).filter(Boolean)
      : [],
    youtubeQuery: meal.youtubeQuery?.trim() || `${meal.name.trim()} recipe`,
    prepTime: meal.prepTime?.trim(),
    cookTime: meal.cookTime?.trim(),
    steps,
    nutrition: normalizeNutrition(meal.nutrition),
  };
}

function defaultRoast(detectedObject?: string): string {
  const thing = detectedObject?.trim() || "that";
  const label = thing.charAt(0).toUpperCase() + thing.slice(1);
  const roasts = [
    `Okay ${label} looks great — but your fridge is the one with the meal ideas! Snap what's inside and we'll find you something tasty.`,
    `We'd love to help, but ${thing} isn't quite a pantry staple. Point the camera at your fridge and let's get you real dinner options.`,
    `${label}? Cool photo. Not super cookable though — and your dentist would probably vote for actual food. Try a fridge pic!`,
    `Almost fooled us! ${label} isn't on the menu today, but whatever's chilling in your fridge definitely could be.`,
  ];
  return roasts[Math.floor(Math.random() * roasts.length)]!;
}

function parseScanResponse(content: string): ScanResult {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ScanResult & {
    noFoodDetected?: boolean;
    funnyMessage?: string;
    detectedObject?: string;
  };

  if (parsed.noFoodDetected === true) {
    const detectedObject = parsed.detectedObject?.trim() || undefined;
    return {
      ingredients: [],
      meals: [],
      notes: "",
      shoppingList: [],
      noFoodDetected: true,
      detectedObject,
      funnyMessage:
        parsed.funnyMessage?.trim() || defaultRoast(detectedObject),
    };
  }

  if (!Array.isArray(parsed.ingredients) || !Array.isArray(parsed.meals)) {
    throw new Error("Invalid AI response format");
  }

  return {
    ingredients: parsed.ingredients.filter(Boolean),
    meals: parsed.meals
      .map((meal) => normalizeMeal(meal))
      .filter((meal): meal is MealSuggestion => meal !== null),
    notes: parsed.notes?.trim() ?? "",
    shoppingList: Array.isArray(parsed.shoppingList)
      ? parsed.shoppingList.map((item) => String(item).trim()).filter(Boolean)
      : [],
  };
}

async function callGeminiVision(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
  persona?: string,
  avoidAllergies?: string[]
): Promise<ScanResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  const personaHint = persona && PERSONA_GUIDANCE[persona]
    ? ` User goal: ${persona}. ${PERSONA_GUIDANCE[persona]}`
    : "";

  const allergyHint =
    avoidAllergies && avoidAllergies.length > 0
      ? ` Avoid these allergens completely: ${avoidAllergies.join(", ")}.`
      : "";

  const userPrompt =
    `Analyze this fridge/pantry photo. Suggest practical meals using what's visible.${personaHint}${allergyHint} For each meal include step-by-step cooking instructions and approximate per-serving nutrition. Include shoppingList items the user may still need to buy. Return JSON.`;

  try {
    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

          const response = await fetch(url, {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT + SYSTEM_PROMPT_JSON }],
              },
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: imageBase64,
                      },
                    },
                    { text: userPrompt },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                responseMimeType: "application/json",
              },
            }),
          });

          if (!response.ok) {
            const err = await response.text();
            const error = new Error(`Gemini ${response.status}: ${err}`);

            if (isModelFallbackStatus(response.status)) {
              lastError = error;
              console.warn(`Gemini model ${model} unavailable (${response.status}), trying next…`);
              break;
            }

            if (isRetryableStatus(response.status) && attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
              const delay = RETRY_DELAYS_MS[attempt] ?? 5000;
              console.warn(
                `Gemini ${model} returned ${response.status}, retry ${attempt + 2}/${MAX_ATTEMPTS_PER_MODEL} in ${delay}ms…`
              );
              lastError = error;
              await sleep(delay);
              continue;
            }

            throw error;
          }

          const data = (await response.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
            error?: { message?: string };
          };

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            throw new Error(
              data.error?.message ?? "Gemini returned an empty response"
            );
          }

          console.log(`Fridge scan completed with model: ${model}`);
          const parsed = parseScanResponse(text);
          return {
            ...parsed,
            meals: filterMealsByAllergies(parsed.meals, avoidAllergies),
          };
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));

          if (lastError.name === "AbortError") {
            throw new Error("Scan timed out after 60 seconds");
          }

          const statusMatch = lastError.message.match(/Gemini (\d{3}):/);
          const status = statusMatch ? Number(statusMatch[1]) : 0;

          if (isModelFallbackStatus(status)) {
            console.warn(`Gemini model ${model} failed, trying next…`);
            break;
          }

          if (isRetryableStatus(status) && attempt < MAX_ATTEMPTS_PER_MODEL - 1) {
            const delay = RETRY_DELAYS_MS[attempt] ?? 5000;
            console.warn(
              `Gemini ${model} error, retry ${attempt + 2}/${MAX_ATTEMPTS_PER_MODEL} in ${delay}ms…`
            );
            await sleep(delay);
            continue;
          }

          if (model !== GEMINI_MODELS[GEMINI_MODELS.length - 1] && isRetryableStatus(status)) {
            console.warn(`Gemini model ${model} still busy, trying next model…`);
            break;
          }

          throw lastError;
        }
      }
    }

    throw lastError ?? new Error("Gemini request failed");
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanFridgeHandler(req: Request, res: Response) {
  try {
    const { imageBase64, mimeType = "image/jpeg", persona, avoidAllergies } =
      req.body as ScanRequestBody;

    if (!imageBase64?.trim()) {
      res.status(400).json({ error: "Photo is required" });
      return;
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
      res.status(503).json({
        error: "Gemini API key missing. Add GEMINI_API_KEY to .env",
      });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const result = await callGeminiVision(
      apiKey,
      cleanBase64,
      mimeType,
      persona,
      avoidAllergies
    );

    res.json({
      ...result,
      usedAI: true,
    });
  } catch (err) {
    console.error("scan-fridge failed:", err);
    const raw = err instanceof Error ? err.message : "Failed to scan fridge photo";
    const message = friendlyScanError(raw);
    const status = raw.includes("503") || raw.toLowerCase().includes("unavailable") ? 503 : 500;
    res.status(status).json({ error: message, retryable: status === 503 });
  }
}
