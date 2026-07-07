import dotenv from "dotenv";
import path from "node:path";
import express from "express";
import cors from "cors";
import { scanFridgeHandler } from "./scanFridge.js";
import { youtubeSearchHandler } from "./youtubeSearch.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function refreshEnv() {
  dotenv.config({
    path: path.resolve(process.cwd(), ".env"),
    override: true,
  });
}

function getKeyStatus() {
  refreshEnv();
  const youtubeKey = process.env.YOUTUBE_API_KEY?.trim() ?? "";
  let youtube: "ready" | "invalid" | "none" = "none";

  if (youtubeKey.startsWith("AIza")) {
    youtube = "ready";
  } else if (youtubeKey.startsWith("AQ.")) {
    youtube = "invalid";
  } else if (youtubeKey) {
    youtube = "invalid";
  }

  return {
    hasGemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
    youtube,
  };
}

const app = express();
const PORT = Number(process.env.PORT) || 3002;
const distDir = path.resolve(process.cwd(), "dist");
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: isProduction
      ? process.env.APP_URL ?? "http://localhost:5173"
      : [
          process.env.APP_URL ?? "http://localhost:5173",
          "http://localhost:5173",
          "http://localhost:5174",
          "http://localhost:5175",
        ],
  })
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  const { hasGemini, youtube } = getKeyStatus();

  res.json({
    ok: true,
    ai: hasGemini ? "ready" : "none",
    youtube,
  });
});

app.post("/api/scan-fridge", scanFridgeHandler);
app.get("/api/youtube-search", youtubeSearchHandler);

if (isProduction) {
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Service-Worker-Allowed", "/");
    res.sendFile(path.join(distDir, "sw.js"));
  });

  app.get("/manifest.webmanifest", (_req, res) => {
    res.type("application/manifest+json");
    res.sendFile(path.join(distDir, "manifest.webmanifest"));
  });

  app.use(express.static(distDir, { index: false }));

  app.get("/{*path}", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

app.listen(PORT, () => {
  const { hasGemini } = getKeyStatus();
  console.log(`FridgeAI API http://localhost:${PORT}`);

  if (isProduction) {
    console.log(`Serving app from ${distDir}`);
  }

  if (hasGemini) {
    console.log("Gemini: configured");
  } else {
    console.log("Gemini: add GEMINI_API_KEY to .env");
  }
});
