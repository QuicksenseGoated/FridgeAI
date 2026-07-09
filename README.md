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

## Deploy on Render

FridgeAI ships as one **Web Service**: Express serves the API and the built React app from `dist/`.

### 1. Push to GitHub

```powershell
git add .
git commit -m "Prepare for Render deploy"
git push origin main
```

### 2. Create the service

**Option A — Blueprint (easiest)**  
1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**  
2. Connect your `FridgeAI` GitHub repo  
3. Render reads `render.yaml` and creates the service  

**Option B — Manual**  
1. **New** → **Web Service** → connect repo  
2. Settings:

| Setting | Value |
|---------|--------|
| **Build Command** | `npm install --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Health Check Path** | `/api/health` |

### 3. Environment variables

Set these in Render → your service → **Environment**:

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `NODE_ENV` | Yes | `production` (already in `render.yaml`) |
| `GEMINI_API_KEY` | Yes | [Google AI Studio](https://aistudio.google.com/apikey) |
| `YOUTUBE_API_KEY` | Yes | [Google Cloud Console](https://console.cloud.google.com) → YouTube Data API v3 → API key (`AIza...`) |
| `APP_URL` | No | Your live URL, e.g. `https://fridgeai.onrender.com` — optional; Render sets `RENDER_EXTERNAL_URL` automatically |

Do **not** commit `.env` to GitHub.

### 4. Deploy

Click **Deploy** (or push to `main` if auto-deploy is on). First build takes a few minutes.

When it’s live, open your Render URL. Check:

- App loads  
- **Home** → scan works (needs `GEMINI_API_KEY`)  
- Meal **Videos** tab works (needs `YOUTUBE_API_KEY`)  
- **Groceries** → voice works (needs `GEMINI_API_KEY` + mic permission)

### 5. Free tier notes

- Service **spins down** after ~15 min idle — first visit after that may take 30–60s to wake up  
- Upgrade to a paid plan for always-on hosting  

### Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Check Render build logs; run `npm run build` locally |
| Scan fails | Add `GEMINI_API_KEY` in Environment, then **Manual Deploy** |
| No videos | Add `YOUTUBE_API_KEY` (`AIza...`, not AI Studio `AQ...` key) |
| 404 on refresh | Ensure `NODE_ENV=production` so Express serves `dist/index.html` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + API with hot reload |
| `npm run build` | Production client + server |
| `npm start` | Serve `dist/` + API |

## Disclaimer

AI meal suggestions are not medical or dietary advice. Always verify allergens and ingredients before cooking.
