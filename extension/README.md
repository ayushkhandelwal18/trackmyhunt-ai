# TrackMyHunt Browser Extension

Companion Chrome extension (Manifest V3) for TrackMyHunt. It detects the job on the active browser tab and saves it to the TrackMyHunt dashboard in one click, from a side panel that matches the web app's design system.

## How It Works

```
Job page open
 ↓
Side panel scrapes the live DOM (content script)
 ↓
Layered extraction → normalized JobData
 ↓
Review / edit in the panel form
 ↓
POST /api/applications (JWT Bearer auth)
 ↓
Saved — appears on the dashboard (duplicates rejected by the backend)
```

## Extraction Engine

`src/content/extract/pipeline.js` orchestrates the layers; first non-empty value wins per field:

1. Platform detector + platform extractor (`src/content/scrapers/`)
2. Generic extractor fallback
3. Structured data (JSON-LD `JobPosting`: title, organization, location, salary, dates)
4. Meta/OpenGraph (company corroboration, canonical URL)
5. DOM heuristics (labeled fields, headings, article text)
6. Normalization (backend-enum types, work mode, canonical URL, listing guard)
7. Confidence scoring (`structured` 0.95 → `platform` 0.85 → `meta` 0.6 → `heuristic` 0.5)

Supported platforms: LinkedIn, Indeed, Naukri, Internshala, Greenhouse, Lever, Workday, Ashby, Wellfound, Google Forms (limited — company and role stay blank for review), company career pages, and generic job pages. A conservative listing-page guard refuses to save career indexes as jobs.

Reliability details:

- The side panel carries a self-contained injection fallback (`src/shared/extractFallback.js`) for tabs opened before the extension was loaded.
- The background worker keeps a short-lived per-tab+URL cache for instant paint; the content script observes SPA navigation (debounced `MutationObserver` + history patching) and notifies the panel to rescan.
- JWT sync reads the dashboard tab's `localStorage` (content script on TrackMyHunt origins) into `chrome.storage.local`, sends it as `Authorization: Bearer`, and clears it on dashboard logout or backend 401. Logging out in the panel clears only the extension copy.

## Auth & Security

- No login of its own; no secrets in the extension (no API keys, no credentials).
- All saves go to the configured TrackMyHunt backend with the user's JWT.
- Never sends resume content, tokens, or page credentials anywhere except the backend API.

## Configuration

Build-time `.env` (public URLs only — no secrets):

| Variable | Purpose | Default |
|---|---|---|
| `VITE_BASE_BACKEND_URL` | Backend API base URL | `http://localhost:3000` (+ port 5000 fallback) |
| `VITE_BASE_FRONTEND_URL` | Dashboard origin for token sync | `http://localhost:5173` |

## Manifest (MV3)

Side-panel entry (`index.html`), background service worker, and content scripts for dashboard auth plus job pages (LinkedIn, Indeed, Wellfound, Lever, Greenhouse, Ashby, Naukri, Internshala, Workday, Google Forms, all URLs as generic fallback). Permissions: `activeTab`, `storage`, `scripting`, `tabs`, `sidePanel`. Minimum Chrome 116.

## Develop

```sh
npm install
npm run build   # → extension/dist/
npm run lint    # oxlint
npm test        # offline extractor tests (synthetic DOM, no network)
```

Load unpacked in Chrome: Extensions → Developer mode → Load unpacked → `extension/dist/`.

## Tech Stack

React 19 + Vite + Tailwind CSS 3 + lucide-react, built with `@crxjs/vite-plugin`. Editor/lint type declarations via `@types/chrome`, `@types/react`, `@types/node` (dev only).
