# TrackMyHunt Browser Extension

The **TrackMyHunt Browser Extension** is a Chrome extension that helps you capture job postings directly from supported job portals and save them to your TrackMyHunt dashboard.

Instead of manually entering job details, the extension extracts information such as the **job title, company, location, job type, salary, and job URL**, lets you review the details, and saves the application to TrackMyHunt.

Built with **Chrome Manifest V3**, React, Vite, and Chrome's **Side Panel API**.

---

## What It Does

- Extracts job details automatically from supported job portals.
- Lets you review and edit the extracted information before saving.
- Saves jobs directly to your TrackMyHunt dashboard.
- Detects duplicate applications to avoid saving the same job multiple times.
- Works with dynamically changing job pages and SPA-based job portals.
- Uses the logged-in TrackMyHunt session, so you don't need to enter your password separately in the extension.

---

## Installation & Setup

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher
- **Google Chrome** 116 or higher

### 1. Download the Extension

Download the extension ZIP from this repository and extract it anywhere on your computer.

Open the extracted **`extension`** folder in **VS Code** or any other code editor.

### 2. Configure Environment Variables

Create a `.env` file inside the `extension` folder.

#### Local Development

```env
VITE_BASE_BACKEND_URL=http://localhost:3000
VITE_BASE_FRONTEND_URL=http://localhost:5173
```

#### Deployed Application

```env
VITE_BASE_BACKEND_URL=https://your-backend-url
VITE_BASE_FRONTEND_URL=https://your-frontend-url
```

> **Note:** Do not add API keys, database credentials, or other private secrets to the extension `.env` file.

### 3. Install Dependencies

```bash
npm install
```

### 4. Build the Extension

```bash
npm run build
```

The production-ready extension is generated inside:

```text
extension/dist/
```

---

## Load the Extension in Chrome

1. Open Google Chrome.
2. Go to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the generated `extension/dist/` folder.
6. The **TrackMyHunt** extension will now appear in Chrome.

---

## How to Use

1. Open the **TrackMyHunt web application**.
2. Log in to your TrackMyHunt account.
3. Open a supported job posting.
4. Open the **TrackMyHunt** extension from the Chrome toolbar.
5. The extension scans the current job page and extracts available job details.
6. Review or edit the extracted information.
7. Click **Save to TrackMyHunt**.
8. The job is added to your TrackMyHunt dashboard.

The extension synchronizes the active TrackMyHunt session, so you do not need to log in separately or enter your password into the extension.

---

## Supported Platforms

The extension currently supports job extraction from:

- **LinkedIn**
- **Indeed**
- **Naukri**
- **Internshala**
- **Greenhouse**
- **Lever**
- **Workday**
- **Ashby**
- **Wellfound**
- **Google Forms**
- **Company career pages**
- **Generic job pages**

Extraction may vary depending on the structure and content of an individual job page.

---

## How It Works

The extension follows a layered extraction process to find the most reliable job information available on a page.

```text
Job Posting
     │
     ▼
TrackMyHunt Extension
     │
     ▼
Extract Job Details
     │
     ├── Structured Job Data
     ├── Platform-Specific Extraction
     ├── Page Metadata
     └── DOM-Based Fallback
     │
     ▼
Review / Edit Details
     │
     ▼
Save to TrackMyHunt
     │
     ▼
TrackMyHunt Dashboard
```

### Extraction Flow

The extension checks multiple sources for job information:

1. **Structured Data** — available `JobPosting` JSON-LD data.
2. **Platform-Specific Extraction** — extraction logic for supported job portals.
3. **Page Metadata** — OpenGraph and other available metadata.
4. **DOM-Based Extraction** — page headings, containers, and other relevant elements as a fallback.

The extracted information is then normalized into a format that can be used by TrackMyHunt.

---

## Duplicate Detection

Before saving a job, the extension communicates with the TrackMyHunt backend.

If the job has already been saved, the extension can notify you that a duplicate application already exists instead of creating another application.

---

## Development

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Run linting

```bash
npm run lint
```

After making changes, run `npm run build` and reload the `dist` folder from `chrome://extensions/`.

---

## Tech Stack

- **React**
- **Vite**
- **Tailwind CSS**
- **JavaScript**
- **Chrome Manifest V3**
- **Chrome Side Panel API**

---

## Project Structure

```text
extension/
├── src/
│   ├── background/
│   ├── content/
│   └── ...
│
├── public/
├── test/
├── .env
├── manifest.json
├── package.json
└── vite.config.js
```

The production build is generated in:

```text
extension/dist/
```

---

## Important Notes

- The extension requires a running or deployed **TrackMyHunt backend** to save applications.
- The frontend and backend URLs must be correctly configured in `.env`.
- After changing `.env` values, rebuild the extension using `npm run build`.
- If you change the extension code, rebuild it and reload the extension from `chrome://extensions/`.

---

## TrackMyHunt

TrackMyHunt is a job-hunt management platform designed to organize applications, opportunities, skills, resumes, resources, notes, and job-search workflows in one place.

The browser extension extends TrackMyHunt by making it easier to capture job opportunities while browsing.

**Track your opportunities. Organize your job hunt.**
