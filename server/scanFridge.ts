import type { Request, Response } from "express";

export interface ScanRequestBody {
  imageBase64: string;
  mimeType?: string;
}

export interface MealSuggestion {
  name: string;
  why: string;
  uses: string[];
  youtubeQuery: string;
  prepTime?: string;
}

export interface ScanResult {
  ingredients: string[];
  meals: MealSuggestion[];
  notes: string;
}

const GEMINI_MODELS = (
  process.env.GEMINI_MODEL?.trim()
    ? [process.env.GEMINI_MODEL.trim()]
    : ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-3-flash-preview"]
).filter(Boolean);

const SYSTEM_PROMPT = `You are a fridge/pantry vision assistant for a cooking app.

Given a photo, list visible food ingredients you can reasonably identify.
Then suggest 3-5 meals the user can cook using mostly those ingredients.

Rules:
- Only list food items you can see or reasonably infer from packaging
- If the photo is unclear, return fewer ingredients and explain in notes
- Suggest balanced, practical, reasonably healthy home-cooked meals
- Prefer simple recipes that use what's visible; pantry staples (salt, oil) are OK
- Each meal needs a short YouTube-friendly search query for a recipe video
- Do not give medical or weight-loss advice; keep "why" practical and food-focused

Respond ONLY with valid JSON:
{
  "ingredients": ["item1", "item2"],
  "meals": [
    {
      "name": "Meal name",
      "why": "One sentence on why this works with what they have",
      "uses": ["ingredient1", "ingredient2"],
      "prepTime": "20 min",
      "youtubeQuery": "easy meal name recipe"
    }
  ],
  "notes": "Optional tips or caveats"
}`;

function getGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

function parseScanResponse(content: string): ScanResult {
  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
  const parsed = JSON.parse(cleaned) as ScanResult;

  if (!Array.isArray(parsed.ingredients) || !Array.isArray(parsed.meals)) {
    throw new Error("Invalid AI response format");
  }

  return {
    ingredients: parsed.ingredients.filter(Boolean),
    meals: parsed.meals.filter((m) => m?.name),
    notes: parsed.notes?.trim() ?? "",
  };
}

async function callGeminiVision(
  apiKey: string,
  imageBase64: string,
  mimeType: string
): Promise<ScanResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  const userPrompt =
    "Analyze this fridge/pantry photo. Suggest practical, balanced meals using what's visible. Return JSON.";

  try {
    let lastError: Error | null = null;

    for (const model of GEMINI_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }],
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
          throw new Error(`Gemini ${response.status}: ${err}`);
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
        return parseScanResponse(text);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const retryable =
          lastError.message.includes("429") ||
          lastError.message.includes("404") ||
          lastError.message.includes("403");
        if (!retryable || model === GEMINI_MODELS[GEMINI_MODELS.length - 1]) {
          throw lastError;
        }
        console.warn(`Gemini model ${model} failed, trying next…`);
      }
    }

    throw lastError ?? new Error("Gemini request failed");
  } finally {
    clearTimeout(timeout);
  }
}

export async function scanFridgeHandler(req: Request, res: Response) {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body as ScanRequestBody;

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
    const result = await callGeminiVision(apiKey, cleanBase64, mimeType);

    res.json({
      ...result,
      usedAI: true,
    });
  } catch (err) {
    console.error("scan-fridge failed:", err);
    const message =
      err instanceof Error ? err.message : "Failed to scan fridge photo";
    res.status(500).json({ error: message });
  }
}
