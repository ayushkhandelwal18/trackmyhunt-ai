# TrackMyHunt Browser Extension

The TrackMyHunt Browser Extension is an open-source companion built on Chrome Manifest V3. It enables candidates to capture job postings directly from online job boards, applicant tracking systems (ATS), and company career portals into their TrackMyHunt dashboard with a single click, eliminating manual data entry and preventing duplicate applications.

---

## 1. Overview

### What It Does
When browsing job postings across web portals, the extension side panel automatically inspects the active browser tab, parses structured metadata, extracts key job attributes, and normalizes the information into a unified application schema. Users can review, adjust, and immediately save the opportunity to their TrackMyHunt workspace without navigating away from the job posting.

### Key Capabilities
- **Side Panel Interface**: Utilizes Chrome's native Side Panel API (`chrome.sidePanel`) to dock alongside active job listings without obscuring page content or requiring popup re-opens.
- **Layered Multi-Tier Scraping**: Cascades through JSON-LD structured schemas, tailored platform extractors, OpenGraph/Twitter meta tags, and DOM heuristics.
- **Listing Page Guard**: Intelligently identifies search result pages, career index directories, and non-job pages to prevent accidental saves of non-job content.
- **Seamless Session Sync**: Detects authenticated TrackMyHunt web dashboard tabs and synchronizes JWT session tokens securely into extension local storage without manual extension logins or stored passwords.
- **Duplicate Detection Alerts**: Directly communicates with the TrackMyHunt backend to notify users if a job with the same URL or company/role combination has already been saved.
- **Real-Time SPA Navigation Tracking**: Listens for dynamic Single Page Application (SPA) DOM shifts and URL mutations (such as switching job cards on LinkedIn or Indeed) to re-extract without full page reloads.

---

## 2. Local Development & Installation

Follow these steps to build and run the TrackMyHunt extension locally on your machine.

### Prerequisites
- **Node.js**: `18.x` or higher
- **npm**: `9.x` or higher
- **Google Chrome**: Version `116` or higher (supports the Chrome Side Panel API)

---

### Step 1: Install Dependencies
Navigate to the `extension` directory and install all required packages:
```bash
cd extension
npm install
```

---

### Step 2: Configure Environment Variables
Create an `.env` file in the `extension/` directory (see [Environment Variables](#3-environment-variables--configuration) for exact details):
```env
VITE_BASE_BACKEND_URL=http://localhost:3000
VITE_BASE_FRONTEND_URL=http://localhost:5173
```

---

### Step 3: Build the Extension Bundle
Compile the React 19 application and Manifest V3 assets using Vite and `@crxjs/vite-plugin`:
```bash
npm run build
```
This generates the ready-to-load extension distribution bundle inside `extension/dist/`.

---

### Step 4: Load Unpacked in Google Chrome
1. Open Google Chrome and enter `chrome://extensions/` in the address bar.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select the `extension/dist` folder from your local project directory.
5. Click the puzzle icon (Extensions) in your Chrome toolbar and pin **TrackMyHunt**.
6. Open your local TrackMyHunt web app at `http://localhost:5173` and log in.
7. Open any supported job posting (e.g., on LinkedIn, Indeed, or Greenhouse) and click the extension icon to launch the side panel.

---

### Step 5: Run Offline Tests & Code Linter
Verify extraction accuracy and code quality without running a browser:
```bash
# Run offline extractor test suite against synthetic DOM fixtures
npm test

# Run static analysis and linting
npm run lint
```

---

## 3. Environment Variables & Configuration

The extension requires only public URLs at build time. It contains **no API keys, database secrets, or private credentials**.

| Variable Name | Status | Purpose | Local Example | Production Example |
|---|---|---|---|---|
| `VITE_BASE_BACKEND_URL` | Required | TrackMyHunt backend API base URL where saved jobs are submitted | `http://localhost:3000` | `https://api.trackmyhunt.com` |
| `VITE_BASE_FRONTEND_URL` | Required | Web dashboard origin used to synchronize the user's JWT session | `http://localhost:5173` | `https://trackmyhunt.vercel.app` |

### Concrete `extension/.env` Example File:
```env
# Local Development Defaults
VITE_BASE_BACKEND_URL=http://localhost:3000
VITE_BASE_FRONTEND_URL=http://localhost:5173

# Production Deployment (Reference)
# VITE_BASE_BACKEND_URL=https://trackmyhunt-backend.onrender.com
# VITE_BASE_FRONTEND_URL=https://trackmyhunt.vercel.app
```

---

## 4. Architecture & Component Notes

The extension strictly adheres to Chrome's Manifest V3 standard, dividing responsibilities cleanly across specialized components:

### Architectural Components
1. **Side Panel User Interface (`index.html` / `src/App.jsx`)**:
   - Built with React 19 and Tailwind CSS 3.
   - Manages the UI state machine across 5 phases: `scanning`, `ready`, `empty`, `unsupported`, and `conn-error`.
   - Exposes an editable form for the candidate to review and refine job details before saving.
   - Embeds a self-contained fallback extractor (`extractFallback.js`) for tabs opened before the extension was installed.
2. **Background Service Worker (`src/background/background.js`)**:
   - Acts as an event-driven hub routing tab lifecycle events.
   - Automatically registers side panel behavior (`openPanelOnActionClick: true`).
   - Maintains an in-memory 5-minute cache (`jobCache`) to paint previously parsed tabs instantly upon re-opening.
   - Feature-detects `chrome.sidePanel.close` (Chrome 141+) to contextually close the side panel when the user switches to non-job tabs.
3. **Job Content Script (`src/content/content.js`)**:
   - Injected into all URLs (`<all_urls>`).
   - Listens for extraction requests from the side panel and executes the multi-tier scraping pipeline against live DOM elements.
   - Monitors dynamic SPA page changes using a debounced `MutationObserver` and History API wrappers, notifying the side panel when new jobs are selected.
4. **Dashboard Auth Content Script (`src/content/dashboardAuth.js`)**:
   - Strictly restricted to TrackMyHunt web app origins (`localhost:5173`, `localhost`, `127.0.0.1`, and production Vercel domains).
   - Polls the web app's `localStorage` every 3 seconds to keep `chrome.storage.local` synchronized with the active user session.
   - Dispatches a custom DOM event (`trackmyhunt_job_saved`) to refresh open dashboard tabs when a job is saved.

---

### Step-by-Step Operating Procedures

#### Procedure A: Multi-Tier Job Extraction
1. When the side panel opens or the tab navigates, `content.js` runs `extractJob()` from `pipeline.js`.
2. **Platform Detection**: Evaluates URL patterns and DOM signatures against known portals (e.g., `linkedin.com/jobs`, `indeed.com`, `greenhouse.io`, or Google Forms).
3. **Cascading Extraction Tiers** (First non-empty value wins per field):
   - **Tier 1 (Structured Data)**: Extracts Schema.org `JobPosting` JSON-LD blocks (title, organization, location, salary, date). Confidence: `0.95`.
   - **Tier 2 (Platform Scrapers)**: Uses tailored DOM selectors specific to the identified platform. Confidence: `0.85`.
   - **Tier 3 (Meta Tags)**: Parses OpenGraph (`og:title`, `og:description`) and Twitter tags. Evaluates delimiters (`Role at Company` / `Role | Company`) and strips site names like "LinkedIn" or "Indeed" from company fields. Confidence: `0.60`.
   - **Tier 4 (DOM Heuristics)**: Inspects primary `<h1>` headings, semantic containers, and labeled fields. Confidence: `0.50`.
4. **Normalization**:
   - Normalizes employment type to standard TrackMyHunt enums (`Intern`, `Full-Time`, `Remote`, `Freelance`, `Intern + Offer`, `Other`).
   - Normalizes work mode (`Remote`, `Hybrid`, `On-site`).
   - Strips tracking query parameters to establish a clean canonical URL.
5. **Listing Page Guard (`looksLikeListingPage`)**: Checks for multi-card directories or search result grids. If detected, flags `isListingPage: true` and alerts the user to select an individual job posting.
6. The resulting `JobData` object is sent to the side panel and displayed in the review form.

#### Procedure B: Silent Authentication & Token Sync
1. The user logs into the TrackMyHunt web app in any browser tab.
2. The web app stores the JWT session token in `localStorage.setItem('token', jwt)`.
3. `dashboardAuth.js` polls `localStorage` every 3 seconds:
   - **Token Present**: Saves the token to `chrome.storage.local.set({ token })`.
   - **Token Absent**: Increments a miss counter. If absent for 2 consecutive cycles (6 seconds), removes the token from `chrome.storage.local` to handle user logout or session expiration.
4. When the side panel opens, it reads the JWT directly from `chrome.storage.local`.
5. If no token exists, the panel displays a prompt inviting the user to open and sign into the TrackMyHunt dashboard.

#### Procedure C: Saving Applications & Duplicate Detection
1. The candidate reviews the extracted details in the side panel form and clicks **Save to TrackMyHunt**.
2. The side panel makes an HTTPS `POST` request directly to `/api/applications` on the configured backend API, attaching `Authorization: Bearer <JWT>`.
3. **If Unique**: The backend creates the application, returns `201 Created`, the side panel shows a green confirmation, and dispatches a notification event to any open dashboard tabs.
4. **If Duplicate**: The backend identifies an existing record matching the normalized URL or company/role combination and returns `409 Conflict` with the duplicate payload. The side panel displays an alert linking directly to the existing application.

---

## 5. Platform Coverage & Support

| Platform / Portal | Identifier | Detection Mechanism | Specific Elements Handled |
|---|---|---|---|
| **LinkedIn** | `linkedin` | `linkedin.com/jobs` | Job search results list with active selection, unified top card, company title stripping, `currentJobId` tracking |
| **Indeed** | `indeed` | `indeed.com` | Job view headers, company overview links, salary snippets, job search detail panes |
| **Naukri** | `naukri` | `naukri.com` | Primary role headings, company link tags, experience badges, salary indicators |
| **Internshala** | `internshala` | `internshala.com` | Internship and job detail cards, stipend containers, duration badges |
| **Greenhouse** | `greenhouse` | `greenhouse.io` | Embedded application boards, `#header .company-name`, `.app-title` |
| **Lever** | `lever` | `lever.co` | Posting headers, `.posting-headline`, `.posting-categories` (location, team, commitment) |
| **Workday** | `workday` | `myworkdayjobs.com`, `workdayjobs.com` | Dynamic client-rendered job titles, hiring organization badges, location pins |
| **Ashby** | `ashby` | `ashbyhq.com` | Dynamic SPA job overview headers, URL organization slug humanization fallback |
| **Wellfound** | `wellfound` | `wellfound.com` | Startup overview cards, compensation ranges, remote work tags |
| **Google Forms** | `google_forms` | `docs.google.com/forms`, `forms.gle` | Form title extraction (leaves company/role editable for manual input on open recruitment forms) |
| **Company Careers** | `company_careers` | Path containing `/careers`, `/jobs`, `/openings` | Fallback heuristic engine + JSON-LD evaluation |
| **Generic Web Page** | `generic` | `<all_urls>` fallback | Generic heading, article body, meta tags, and structured data parsing |

---

## 6. Permissions & Security Model

The extension requests only the minimum necessary permissions required for side-panel operation and in-tab DOM extraction:

| Permission | Justification |
|---|---|
| `sidePanel` | Provides the side-panel user interface alongside active web pages. |
| `activeTab` | Grants temporary read access to the currently focused tab when the user opens the side panel. |
| `storage` | Stores the user's session token (`chrome.storage.local`) and user preferences. |
| `scripting` | Executes fallback in-memory extraction on tabs opened prior to extension installation. |
| `tabs` | Detects tab activation and URL changes to trigger debounced re-scans. |
| `host_permissions` | Allows content scripts to run across recruitment sites (`https://*.linkedin.com/*`, `https://*.indeed.com/*`, etc.) and permits network calls to the configured backend API. |

### Security Guarantees
- **Zero Third-Party Tracking**: The extension communicates exclusively with the configured TrackMyHunt backend API and the active browser tab.
- **No Stored Credentials**: No passwords, API keys, or private signing keys are embedded in or handled by the extension.
- **Scoped Injection**: Authentication token reading is restricted exclusively to TrackMyHunt web app origins.

---

## 7. Testing & Quality Assurance

### Offline Extractor Testing
The extension includes offline unit tests verifying extraction integrity against synthetic DOM trees without requiring live browser instances or external network connections:
```bash
npm test
```
- Tests are executed with the native Node.js test runner: `node --test ./test/linkedin.test.mjs`.
- The test harness leverages `test/fakeDom.mjs` to construct synthetic LinkedIn search results lists, detail cards, and missing-attribute scenarios.

### Code Linting
Run static analysis with oxlint:
```bash
npm run lint
```
