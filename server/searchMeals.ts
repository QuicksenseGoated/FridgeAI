import type { Request, Response } from "express";

interface MealNutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  servings: string;
  note?: string;
}

interface MealSuggestion {
  name: string;
  why: string;
  uses: string[];
  youtubeQuery: string;
  prepTime?: string;
  cookTime?: string;
  steps: string[];
  nutrition: MealNutrition;
}

interface SearchMealsBody {
  query: string;
  persona?: string;
  avoidAllergies?: string[];
}

const GEMINI_MODELS = (
  process.env.GEMINI_MODEL?.trim()
    ? [process.env.GEMINI_MODEL.trim()]
    : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
).filter(Boolean);

const DEFAULT_NUTRITION: MealNutrition = {
  calories: "—",
  protein: "—",
  carbs: "—",
  fat: "—",
  servings: "2",
  note: "Approximate per serving.",
};

const PERSONA_GUIDANCE: Record<string, string> = {
  balanced: "Suggest balanced everyday meals.",
  "weight-loss": "Prefer lighter, satisfying meals.",
  "high-protein": "Prioritize protein-rich recipes.",
  "quick-easy": "Favor fast recipes with minimal steps.",
  vegetarian: "Suggest meat-free meals only.",
  "kid-friendly": "Suggest simple, approachable meals.",
};

function getGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
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

const SYSTEM_PROMPT = `You are a home cooking assistant for a family-friendly app.

Given a meal search query, suggest 1-2 practical recipes the user can cook at home.

Rules:
- Return realistic ingredients and 6-8 clear step-by-step cooking instructions per meal
- Include approximate nutrition per serving (not medical advice)
- Keep recipes achievable with a normal grocery shop — avoid exotic hard-to-find items
- Respect user allergens when provided
- Tailor to persona/goal when provided
- Do not mention scanning a fridge or meal prep planning in the response

Respond ONLY with valid JSON:
{
  "meals": [
    {
      "name": "Meal name",
      "why": "One sentence on why someone would cook this",
      "uses": ["ingredient1", "ingredient2"],
      "prepTime": "10 min",
      "cookTime": "20 min",
      "youtubeQuery": "easy meal name recipe",
      "steps": ["Step 1", "Step 2"],
      "nutrition": {
        "calories": "~420 kcal",
        "protein": "~28g",
        "carbs": "~35g",
        "fat": "~14g",
        "servings": "2",
        "note": "Approximate per serving"
      }
    }
  ]
}`;

export async function searchMealsHandler(req: Request, res: Response) {
  try {
    const { query, persona, avoidAllergies } = req.body as SearchMealsBody;
    const trimmed = query?.trim();

    if (!trimmed || trimmed.length < 2) {
      res.status(400).json({ error: "Enter at least 2 characters to search." });
      return;
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
      res.status(503).json({ error: "Gemini API key missing. Add GEMINI_API_KEY to .env" });
      return;
    }

    const personaHint =
      persona && PERSONA_GUIDANCE[persona] ? ` Goal: ${PERSONA_GUIDANCE[persona]}` : "";
    const allergyHint =
      avoidAllergies && avoidAllergies.length > 0
        ? ` Avoid allergens: ${avoidAllergies.join(", ")}.`
        : "";

    const userPrompt = `User wants to cook: "${trimmed}".${personaHint}${allergyHint} Return JSON with 1-2 matching recipes.`;

    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.5,
              responseMimeType: "application/json",
            },
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          lastError = new Error(`Gemini ${response.status}: ${err}`);
          if (response.status === 404 || response.status === 403) continue;
          throw lastError;
        }

        const data = (await response.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Gemini returned an empty response");

        const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(cleaned) as { meals?: Partial<MealSuggestion>[] };

        const meals = (parsed.meals ?? [])
          .map((meal) => normalizeMeal(meal))
          .filter((meal): meal is MealSuggestion => meal !== null);

        res.json({ meals, usedAI: true });
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError ?? new Error("Meal search failed");
  } catch (err) {
    console.error("search-meals failed:", err);
    res.status(500).json({
      error: "Could not find that meal right now. Try another search or pick from the list.",
    });
  }
}
