import type { Request, Response } from "express";

interface TranscribeBody {
  audioBase64?: string;
  mimeType?: string;
}

const GEMINI_MODELS = (
  process.env.GEMINI_MODEL?.trim()
    ? [process.env.GEMINI_MODEL.trim()]
    : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
).filter(Boolean);

const MIME_ALIASES: Record<string, string> = {
  "audio/mp4": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/aac": "audio/aac",
  "audio/webm": "audio/webm",
  "audio/ogg": "audio/ogg",
  "audio/wav": "audio/wav",
  "audio/mpeg": "audio/mpeg",
  "audio/mp3": "audio/mpeg",
};

function getGeminiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
}

function normalizeMimeType(mimeType: string): string {
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "audio/webm";
  return MIME_ALIASES[base] ?? base;
}

function cleanTranscript(text: string): string {
  return text
    .replace(/^```[\w]*\n?/g, "")
    .replace(/```$/g, "")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

export async function transcribeGroceryHandler(req: Request, res: Response) {
  const body = req.body as TranscribeBody;
  const audioBase64 = body.audioBase64?.trim();
  const mimeType = normalizeMimeType(body.mimeType?.trim() || "audio/webm");

  if (!audioBase64) {
    res.status(400).json({ error: "Missing audio recording." });
    return;
  }

  if (audioBase64.length > 8_000_000) {
    res.status(413).json({ error: "Recording too long. Try a shorter phrase." });
    return;
  }

  const apiKey = getGeminiKey();
  if (!apiKey) {
    res.status(503).json({
      error: "Voice transcription unavailable. Add GEMINI_API_KEY to .env and restart the server.",
    });
    return;
  }

  const prompt =
    "Listen to this short grocery shopping voice memo. Transcribe exactly what the person said, as plain text only. Keep item separators like commas or the word and. Do not add commentary.";

  let lastError = "Transcription failed.";

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: audioBase64,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        lastError = `Gemini ${response.status}`;
        console.warn(`Grocery transcribe ${model} failed (${response.status}):`, errText.slice(0, 300));
        if (response.status === 400 || response.status === 404 || response.status === 415) {
          continue;
        }
        break;
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
        error?: { message?: string };
      };

      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const text = raw ? cleanTranscript(raw) : "";

      if (!text) {
        res.status(422).json({ error: "Could not understand that. Try again." });
        return;
      }

      console.log(`Grocery voice transcribed with ${model}`);
      res.json({ text });
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Transcription failed.";
      console.warn(`Grocery transcribe ${model} error:`, err);
    }
  }

  res.status(502).json({ error: lastError });
}
