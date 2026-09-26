# TrackMyHunt Browser Extension (MV3)

Side-panel extension that detects the job on the active tab and saves it to
your TrackMyHunt dashboard via `POST /api/applications`.

## Extraction engine (layered)

`src/content/extract/pipeline.js` orchestrates, first non-empty value wins:

1. Platform detector + platform extractor (`src/content/scrapers/`)
2. Generic extractor fallback
3. Structured data (JSON-LD `JobPosting`: title, org, location, salary, dates)
4. Meta/OpenGraph (company corroboration, canonical URL)
5. DOM heuristics (labeled fields, headings, article text)
6. Normalization (backend-enum types, work mode, canonical URL)
7. Confidence scoring (structured 0.95 → platform 0.85 → meta 0.6 → heuristic 0.5)

Supported: LinkedIn, Indeed, Naukri, Internshala, Greenhouse, Lever,
Workday, Ashby, Google Forms (limited — form title/description only, company
and role stay blank for review), company career pages, and generic job pages.
A conservative listing-page guard refuses to save career indexes as jobs.

The side panel also carries a self-contained injection fallback
(`src/shared/extractFallback.js`) for tabs opened before the extension was
loaded. The background keeps a short-lived per-tab+URL cache for instant
paint; the content script observes SPA navigation (MutationObserver +
history patching, debounced) and notifies the panel to rescan.

## Supported platforms

- LinkedIn (`linkedin.com/jobs`)
- Indeed (`indeed.com`)
- Wellfound (`wellfound.com`)
- Greenhouse (`greenhouse.io` boards)
- Any other job page (generic title-based fallback; company/role may need a manual edit)

## Auth

The extension has no login of its own. It reads the website JWT from the
dashboard tab's `localStorage` (via a content script on TrackMyHunt origins,
with a one-shot `chrome.scripting` injection fallback for tabs that were
already open before the extension was loaded) into `chrome.storage.local`,
sends it as `Authorization: Bearer`, and clears it when the dashboard logs
out or the backend returns 401. Logging out in the popup clears only the
extension copy.

## Backend URLs

Build-time configuration in `.env` (public URLs only, no secrets):

- `VITE_BASE_BACKEND_URL` — API base (default fallbacks: localhost:5000/3000)
- `VITE_BASE_FRONTEND_URL` — dashboard origin for token sync (default `http://localhost:5173`)

Production defaults point at the deployed Render backend and Vercel frontend.

## Develop / load unpacked

```sh
npm install
npm run build
```

Then in Chrome: Extensions → Developer mode → Load unpacked → `dist/`.

`npm run lint` runs oxlint.
