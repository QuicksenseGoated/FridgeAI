# FridgeAI

Snap your fridge → AI detects ingredients → meal ideas with YouTube recipe links.

## Stack

- **Frontend:** React + Vite
- **Backend:** Express (scan + YouTube search)
- **AI:** Google Gemini (vision)
- **Videos:** YouTube Data API v3

## Brand assets

Your **final PFP** goes in `public/brand/icon-source.png`, then run:

```powershell
npm run brand
```

This generates `icon.png`, all PWA sizes, and `favicon.png`. The wordmark is still cropped from `public/logo-brand.png` if that sheet exists.

| File | Used for |
|------|----------|
| `public/brand/icon-source.png` | **Your master PFP** (replace this file) |
| `public/brand/icon.png` | Header + in-app icon |
| `public/brand/wordmark.png` | “fridge ai” + tagline |
| `public/brand/icon-scan.png` | Photo upload area |
| `public/brand/icon-*.png` | PWA / home screen |
| `public/favicon.png` | Browser tab |

## Local setup

```powershell
cd FridgeAI
npm install
```

Copy `.env.example` to `.env` and fill in:

| Variable | Source |
|----------|--------|
| `GEMINI_API_KEY` | [AI Studio](https://aistudio.google.com/apikey) (`AQ...`) |
| `YOUTUBE_API_KEY` | [Cloud Console](https://console.cloud.google.com) → YouTube Data API v3 → Credentials (`AIza...`) |

```powershell
npm run dev
```

- UI: http://localhost:5173
- API: http://localhost:3002

## Deploy (Render)

1. Push to GitHub
2. New **Web Service** → connect repo
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Env vars: `NODE_ENV=production`, `APP_URL`, `GEMINI_API_KEY`, `YOUTUBE_API_KEY`

Or use `render.yaml` blueprint.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + API with hot reload |
| `npm run build` | Production client + server |
| `npm start` | Serve `dist/` + API |

## Disclaimer

AI meal suggestions are not medical or dietary advice. Always verify allergens and ingredients before cooking.
