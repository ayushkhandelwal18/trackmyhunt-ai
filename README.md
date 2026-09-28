# TrackMyHunt

TrackMyHunt is an  job hunt management and application tracking platform designed for students, and active job seekers. It centralizes fragmented job-hunting activities into a unified workspace, providing full-lifecycle application management, interview timeline tracking, future opportunity planning, skill gap organization, interview notes, link-based resume cataloging, and an explainable AI Resume and Job Description Analyzer. 💼

The platform is paired with a companion Chrome extension that extracts structured job postings directly from portal tabs and saves them to the central dashboard with duplicate detection.

---

## 1. Product Overview

### The Problem It Solves
Job hunting across multiple job boards, portals, and applicant tracking systems often leads to:
- Disorganized spreadsheets with missing links, outdated statuses, and forgotten follow-ups.
- Submitting generic resumes that fail to address explicit job description requirements.
- Redundant manual data entry whenever a new job posting is discovered.

### Who It Is For
- **Students & Fresh Graduates**: Preparing for campus drives, internships, and entry-level positions.
- **Software Engineers & Tech Professionals**: Managing multi-stage interview loops across multiple companies.
- **Active Job Seekers**: Requiring structured tracking for high-volume outreach and timely follow-ups.

### System Solution
- **TrackMyHunt Web Application**: A full-featured workspace offering CRUD tracking for job applications, Kanban board organization, interview timeline snapshots, future opportunity scheduling, self-assessed skill boards, interview notes, link-based resume cataloging, and an in-memory AI Resume & JD Analyzer.
- **TrackMyHunt Browser Extension**: A Chrome Manifest V3 companion side panel that parses job postings on active browser tabs (LinkedIn, Indeed, Naukri, Internshala, ATS boards, etc.), checks for duplicates, and saves them directly into your dashboard.

---

## 2. Local Development & Installation

Follow these steps to set up and run the entire TrackMyHunt platform locally on your machine.

### Prerequisites
- **Node.js**: `18.x` or higher
- **npm**: `9.x` or higher
- **MongoDB**: A running local instance (`mongodb://localhost:27017/trackmyhunt`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) connection string
- **Google Chrome**: For loading and running the unpacked browser extension

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/ayushkhandelwal18/TrackMyHunt2.git
cd TrackMyHunt2
```

---

### Step 2: Backend Setup & Execution
The backend API server runs on Node.js, Express, and MongoDB.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` configuration file:
   ```bash
   cp .env.example .env
   ```
4. Open `backend/.env` and fill in your variables (see [Environment Variables](#3-environment-variables--configuration) for examples):
   - Set `DATABASE_URL` to your MongoDB connection string.
   - Set `JWT_SECRET` to any strong random string.
   - Set `CLIENT_URL` to `http://localhost:5173`.
   - Set `PORT` to `3000` (or `5000`).
   - (Optional) Set `groq_api_key` for the AI Resume Analyzer.
   - (Optional) Set `RESEND_API_KEY` for email notifications and OTP verification.
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start and listen at `http://localhost:3000` (or your configured `PORT`).

---

### Step 3: Frontend Setup & Execution
The web application is built with React 19, Vite, and Tailwind CSS.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file:
   ```bash
   # On Windows PowerShell:
   New-Item -Path .env -ItemType File
   # On macOS/Linux:
   touch .env
   ```
4. Open `frontend/.env` and specify:
   ```env
   VITE_BASE_BACKEND_URL=http://localhost:3000
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The web dashboard will open at `http://localhost:5173`.

---

### Step 4: Extension Setup & Installation in Chrome
The extension is built with React 19, Vite, Tailwind CSS, and `@crxjs/vite-plugin`.

1. Open a new terminal and navigate to the extension directory:
   ```bash
   cd extension
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the extension `.env` file:
   ```env
   VITE_BASE_BACKEND_URL=http://localhost:3000
   VITE_BASE_FRONTEND_URL=http://localhost:5173
   ```
4. Build the extension bundle:
   ```bash
   npm run build
   ```
   This generates the compiled extension in `extension/dist/`.
5. Load the unpacked extension into Chrome:
   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** using the toggle switch in the top-right corner.
   - Click the **Load unpacked** button in the top-left toolbar.
   - Browse to your local project folder and select the `TrackMyHunt/extension/dist` directory.
   - Pin the TrackMyHunt extension to your Chrome toolbar.
   - Log into your local web dashboard at `http://localhost:5173`, then open any job posting (e.g., on LinkedIn) and click the extension icon to open the side panel.

---

### Step 5: (Optional) Run the Reminder Engine
To manually execute one cycle of the background email reminder worker (for stale application follow-ups and interview alerts):
```bash
cd backend
npm run reminders
```

---

## 3. Environment Variables & Configuration

Below is the complete list of environment variables used across the project with their exact variable names, required/optional status, descriptions, and concrete examples.

### 1. Backend Environment Variables (`backend/.env`)

| Variable Name | Status | Purpose | Example Value |
|---|---|---|---|
| `PORT` | Optional | Port on which the Express API server listens (default: `5000`) | `3000` |
| `CLIENT_URL` | Required | Allowed frontend origin for CORS and email redirect links | `http://localhost:5173` |
| `DATABASE_URL` | Required | MongoDB database connection URI (Atlas or local) | `mongodb+srv://user:pass@cluster.mongodb.net/trackmyhunt` |
| `JWT_SECRET` | Required | Secret key used to sign and verify JSON Web Tokens | `super_secret_jwt_key_987654321` |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth 2.0 Client ID for server-side ID token verification | `691415752334-xxxxxx.apps.googleusercontent.com` |
| `RESEND_API_KEY` | Optional | API key from Resend used to deliver transactional emails | `re_cANvWsFz_xxxxxxxxxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Optional | Verified sender email domain configured in Resend | `noreply@yourdomain.com` |
| `RESEND_FROM_NAME` | Optional | Display name attached to outgoing emails | `TrackMyHunt` |
| `groq_api_key` | Optional | Groq Cloud API key for the AI Resume & JD Analyzer (`openai/gpt-oss-120b`) | `gsk_yREpkXcQKxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_PROVIDER` | Optional | Email transport provider flag (legacy/fallback) | `resend` |
| `EMAIL_USER` | Optional | SMTP username (legacy fallback) | `user@gmail.com` |
| `EMAIL_PASS` | Optional | SMTP password or app-specific password (legacy fallback) | `app_password_here` |
| `EMAIL_FROM` | Optional | Outgoing address for legacy SMTP delivery | `noreply@yourdomain.com` |

#### Concrete `backend/.env` Example File:
```env
# Server & CORS
PORT=3000
CLIENT_URL=http://localhost:5173

# Database & Authentication
DATABASE_URL=mongodb+srv://admin:securepassword@cluster0.mongodb.net/trackmyhunt?retryWrites=true&w=majority
JWT_SECRET=c2e8a1f4b9d0e7a3f5c6b8d1a4e7f0b3c5e8a1f4b9d0e7a3f5c6b8d1a4e7f0b3
GOOGLE_CLIENT_ID=691415752334-1hhuta1mea909scm9vtg9nrqckqsdm09.apps.googleusercontent.com

# Resend Email Configuration
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz
RESEND_FROM_EMAIL=noreply@trackmyhunt.com
RESEND_FROM_NAME=TrackMyHunt

# Groq Cloud AI Configuration (Note exact lowercase naming)
groq_api_key=gsk_1234567890abcdefghijklmnopqrstuvwxyz
```

---

### 2. Frontend Environment Variables (`frontend/.env`)

| Variable Name | Status | Purpose | Example Value |
|---|---|---|---|
| `VITE_BASE_BACKEND_URL` | Required | Base URL where the backend Express API is running | `http://localhost:3000` |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Public Google OAuth Client ID for the Google Sign-In button | `691415752334-xxxxxx.apps.googleusercontent.com` |

#### Concrete `frontend/.env` Example File:
```env
VITE_BASE_BACKEND_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=691415752334-1hhuta1mea909scm9vtg9nrqckqsdm09.apps.googleusercontent.com
```

---

### 3. Extension Environment Variables (`extension/.env`)

| Variable Name | Status | Purpose | Example Value |
|---|---|---|---|
| `VITE_BASE_BACKEND_URL` | Required | Backend API base URL where the extension submits saved jobs | `http://localhost:3000` |
| `VITE_BASE_FRONTEND_URL` | Required | Web dashboard origin used to synchronize the user's JWT token | `http://localhost:5173` |

#### Concrete `extension/.env` Example File:
```env
# Local Development
VITE_BASE_BACKEND_URL=http://localhost:3000
VITE_BASE_FRONTEND_URL=http://localhost:5173

# Production Deployment (Reference)
# VITE_BASE_BACKEND_URL=https://api.trackmyhunt.com
# VITE_BASE_FRONTEND_URL=https://trackmyhunt.vercel.app
```

---

## 4. System Architecture & Component Notes

Rather than maintaining a rigid monolithic diagram, TrackMyHunt is architected as clean, decoupled tiers with explicit interaction procedures:

### Architectural Layers
1. **Client Tier**:
   - **Web Application**: React 19 single-page app built with Vite, Tailwind CSS 4, and React Router 7. Communicates with the backend using a centralized API client (`frontend/src/services/api.js`) that attaches JWT tokens automatically.
   - **Browser Extension**: Manifest V3 side panel application built with React 19 and Tailwind CSS 3. Features an isolated multi-tier scraping engine and syncs authentication silently from active dashboard tabs.
2. **Security & Ingress Layer**:
   - **CORS Whitelist**: Whitelists the web application origin, Vercel preview URLs, `localhost`, and any installed Chrome extension origin (`chrome-extension://`).
   - **Authentication Middleware (`auth.middleware.js`)**: Validates `Authorization: Bearer <JWT>` tokens and injects the authenticated `req.user` payload into downstream route handlers.
3. **API & Business Services Layer**:
   - **Controllers**: Handle HTTP input validation and pass business logic to dedicated services (`application.service.js`, `ai.service.js`, `reminder.service.js`, `auth.service.js`).
   - **Duplicate Protection**: Automatically normalizes job URLs and company/role pairs, rejecting duplicates with HTTP 409 and returning existing records.
   - **Timeline Scribe**: Automatically records an immutable snapshot in `ApplicationEvent` whenever an application is created or changes status.
4. **Data Persistence Tier**:
   - MongoDB database managed via Mongoose 9 schemas. Stores structured data for users, applications, timeline events, reminder markers, opportunities, skills, resources, notes, and resume links.
5. **External Cloud Integrations**:
   - **Groq Cloud API**: High-speed LLM inference running `openai/gpt-oss-120b` at `temperature: 0` for structured requirement and evidence extraction.
   - **Resend API**: Transactional email delivery service for verification OTPs, welcome emails, follow-up digests, and interview alerts.
   - **Google Identity Services**: OAuth 2.0 token verification for frictionless one-click user sign-in.

---

### Component Interaction Procedures

#### Procedure A: Browser Extension Job Capture & Dashboard Sync
1. The user navigates to an online job listing (e.g., on LinkedIn, Indeed, or an ATS page).
2. The user opens the TrackMyHunt extension side panel.
3. The content script inspects the page using a 4-tier cascade:
   - **Tier 1**: JSON-LD `JobPosting` schema (highest confidence: 0.95).
   - **Tier 2**: Platform-specific DOM scraper (confidence: 0.85).
   - **Tier 3**: OpenGraph & Twitter meta tags (confidence: 0.60).
   - **Tier 4**: DOM heuristic headings and text blocks (confidence: 0.50).
4. The side panel displays the extracted data in an editable form.
5. When the user clicks **Save to TrackMyHunt**, the extension sends a `POST /api/applications` request carrying the user's synced JWT token.
6. The backend verifies that the job does not already exist for that user. If unique, it saves the application and records an event snapshot; if duplicate, it returns HTTP 409 with the existing record details.
7. Upon a successful save, the extension emits a `trackmyhunt_job_saved` event to any open dashboard tabs, refreshing their display.

#### Procedure B: AI Resume & Job Description Analysis
1. The user visits `/ai-analyzer`, uploads their resume PDF, and pastes a target job description.
2. The browser submits a `multipart/form-data` request to `POST /api/ai/analyze`.
3. Multer buffers the PDF directly in server RAM (enforcing a strict 5 MB limit). The file is **never** written to disk.
4. The server validates the magic bytes (`%PDF-`), extracts plain text using `pdf-parse`, and normalizes the text (NFKC Unicode normalization, stripping zero-width artifacts).
5. A deterministic SHA-256 cache key is computed from `provider + model + prompt_version + userId + resumeHash + jdHash`.
6. If cached, the report is returned immediately.
7. If not cached, the backend invokes Groq (`openai/gpt-oss-120b`, temperature 0) with a strict evidence-mapping prompt. The model classifies candidate evidence without computing scores.
8. The backend computes category breakdown scores and the overall score (0–100) deterministically using mathematical formulas, applies an ordinary-activity guard, and caches the result for 7 days.
9. The user receives a comprehensive match report showing the fit level, score, matched skills, must-have gaps, good-to-have suggestions, and actionable recommendations.

#### Procedure C: Scheduled Email Reminders
1. An external scheduler (cron job or manual script execution) triggers `node scripts/send-reminders.js`.
2. The script establishes a MongoDB connection and calls `runReminderCycle()`.
3. **Follow-Up Digest Flow**:
   - Queries users with `followupReminders: true`.
   - Locates applications lingering in `Applied` status beyond the user's day threshold (default: 7 days).
   - If the count meets the minimum pending threshold (default: 3), it atomically claims the markers using a unique `batchId`.
   - Compiles a digest table and sends `followup-email.html` via Resend.
   - Marks the claimed markers as `sent`.
4. **Interview Alert Flow**:
   - Queries users with `interviewReminders: true`.
   - Checks applications in `Interview Scheduled` status due within the next 24 hours.
   - Computes a unique slot fingerprint (`date|time|type|link`).
   - Atomically claims the interview reminder marker with `batchId`.
   - Renders `interview-email.html` and delivers the alert via Resend.
   - Marks the marker as `sent`.

---

## 5. Core Features

- **Authentication & Security**: Email & password signup with 6-digit OTP verification, Resend OTP support, password reset via OTP, Google OAuth 2.0 integration, and 30-day JWT sessions.
- **Centralized Dashboard**: Real-time summary counts (Total, Active/Pending, Interviews, Rejections, Resumes), the 5 most recently updated applications, 5 upcoming opportunities, and skill proficiency breakdowns.
- **Application Tracking**: Complete lifecycle management tracking company, role, employment type (`Intern`, `Full-Time`, `Remote`, `Freelance`, `Intern + Offer`, `Other`), skills, application link, notes, and application date.
- **Seven Workflow Statuses**: `Applied`, `Resume Shortlisted`, `OA Done`, `Interview Scheduled`, `Interview Done`, `Rejected`, and `Other`.
- **Status Details Capture**: Context-sensitive metadata for interviews (date, time, type: Technical/HR/Behavioral/Managerial/Other, meeting link, notes), online assessments (date, link, notes), and rejections (date, reason).
- **Kanban Board**: Drag-and-drop board for visual stage management with automatic modal prompts to record status details during transitions.
- **Application Detail & Immutable Timeline**: Dedicated page (`/applications/:id`) with an immutable chronological log (`ApplicationEvent`) recording state snapshots for every status change.
- **Duplicate Application Prevention**: Backend checks compare incoming submissions against existing applications using normalized job URLs or normalized company and role combinations.
- **Opportunity Planner**: Forward-looking pipeline for tracking prospective job openings and campus hiring cycles filtered by month, year, role, and type.
- **Skillboard**: Self-assessed skills inventory categorized across `Beginner`, `Intermediate`, `Advanced`, and `Expert` levels with target role mappings.
- **Resources Hub**: Curated reference library categorized by 12 resource types (`GitHub`, `YouTube`, `Blog`, `Article`, `Course`, `Website`, `Documentation`, `LinkedIn`, `Google Drive`, `Google Sheets`, `PDF`, `Other`).
- **Notes & Brain Dump**: Timestamped markdown scratchpad for interview retrospectives, question breakdowns, and prep notes with multi-tag filtering.
- **Resume Manager**: Link-based resume version catalog (Google Drive, Dropbox, portfolio links) mapped to individual applications without binary file bloat.
- **AI Resume & JD Analyzer**: In-memory PDF upload and parsing, Groq LLM requirement mapping, deterministic backend scoring (0–100), fit level determination, and actionable improvement tips.
- **Automated Email Reminders**: Idempotent background reminder worker sending stale application follow-up digests and 24-hour interview alerts via Resend.
- **Chrome Companion Extension**: Manifest V3 side panel for instant job parsing, duplicate detection, and direct saving from supported job portals.

---

## 6. End-to-End Product Workflow

The typical TrackMyHunt journey follows a streamlined, repeatable workflow:

1. **Job Discovery**: The candidate finds a job opening on a job board (LinkedIn, Indeed, Naukri, Internshala) or an ATS portal (Greenhouse, Lever, Workday, Ashby).
2. **Instant Capture**: Opening the TrackMyHunt extension side panel automatically extracts the role title, company name, location, employment type, and posting link.
3. **Ingestion & Duplicate Guard**: The candidate reviews details in the side panel and clicks Save. The backend validates that the job is not already in the user's tracker before creating the record.
4. **Tailoring & Analysis**: The candidate navigates to `/ai-analyzer`, uploads their resume PDF, and pastes the job description. The analyzer pinpoints missing technical requirements and recommends targeted improvements.
5. **Application Submission**: The candidate submits their customized application on the employer's portal.
6. **Pipeline Management**: As responses arrive, the candidate moves the job card across the Kanban board or updates it via the table view. When marking an interview or assessment, the candidate records dates, interviewers, and meeting links.
7. **Timeline Tracking**: Each status shift logs an immutable historical event snapshot, visible on the application detail page.
8. **Automated Follow-ups**: If an application sits idle in `Applied` status beyond the user's configured threshold (e.g., 7 days), or when an interview is 24 hours away, TrackMyHunt sends an email reminder via Resend.

---

## 7. Database Models & Schema Design

All application data is modeled using Mongoose schemas on MongoDB:

### 1. User (`User`)
- `name` (String, required): User's full name.
- `email` (String, required, unique): Account email address.
- `password` (String): Hashed password (bcrypt).
- `googleId` (String, sparse, unique): Google OAuth subject identifier.
- `avatar` (String): Profile avatar image URL.
- `isVerified` (Boolean, default: `false`): Verification status.
- `otp` / `otpExpires`: Time-limited 6-digit OTP code and expiration timestamp.
- `reminderSettings` (Object): Configuration for automated emails:
  - `emailReminders` (Boolean, default: `false`): Master opt-in toggle.
  - `followupReminders` (Boolean, default: `true`): Follow-up digest toggle.
  - `followupAfterDays` (Number, default: `7`): Inactivity day threshold.
  - `minPendingApplications` (Number, default: `3`): Minimum batch size for digest.
  - `interviewReminders` (Boolean, default: `true`): Interview reminder toggle.
  - `interviewReminderHours` (Number, default: `24`): Advance reminder window in hours.

### 2. Application (`Application`)
- `user` (ObjectId -> User, required): Reference to the owning user.
- `company` (String, required): Hiring organization name.
- `role` (String, required): Job title.
- `type` (String, required, enum: `Intern`, `Full-Time`, `Remote`, `Freelance`, `Intern + Offer`, `Other`).
- `skills` (String): Required or associated skills.
- `status` (String, required, enum: `Applied`, `Resume Shortlisted`, `OA Done`, `Interview Scheduled`, `Interview Done`, `Rejected`, `Other`).
- `applicationLink` (String): URL of the job posting or application portal.
- `notes` (String): Personal notes.
- `appliedDate` (Date, required): Date when applied.
- `resumeId` (ObjectId -> Resume, optional): Mapped resume catalog item.
- `statusDetails` (Object):
  - `interview`: `date`, `time`, `type` (`Technical`, `HR`, `Behavioral`, `Managerial`, `Other`), `link`, `notes`.
  - `oa`: `date`, `link`, `notes`.
  - `rejection`: `date`, `reason`.

### 3. Application Event (`ApplicationEvent`)
- `user` (ObjectId -> User, required): Owning user.
- `application` (ObjectId -> Application, required): Target application.
- `type` (String, enum: `created`, `status_changed`): Event type.
- `fromStatus` / `toStatus` (String): Prior and updated status states.
- `snapshot` (Object): Preserves status, mapped resume title, and status details as they existed at event time.

### 4. Reminder Marker (`Reminder`)
- `user` (ObjectId -> User, required): Target user.
- `application` (ObjectId -> Application, required): Associated application.
- `type` (String, enum: `followup`, `interview`): Reminder classification.
- `fingerprint` (String): Unique hash for interview slots (`date|time|type|link`).
- `remindAt` (Date): Due timestamp in UTC.
- `status` (String, enum: `pending`, `claimed`, `sent`, `cancelled`): State machine.
- `batchId` (ObjectId): Claim token for the active scheduler run.
- `sentAt` (Date): Delivery timestamp.

### 5. Other Entities
- **Opportunity (`Opportunity`)**: `user`, `company`, `role`, `type`, `openingMonth`, `openingYear`, `skills`, `link`, `notes`.
- **Skill (`Skill`)**: `user`, `name`, `category`, `proficiency` (`Beginner`, `Intermediate`, `Advanced`, `Expert`), `target`.
- **Resource (`Resource`)**: `user`, `title`, `type` (12 categories: `GitHub`, `YouTube`, `Blog`, `Article`, etc.), `link`, `description`.
- **Note (`Note`)**: `user`, `title`, `content`, `tags`, `date`.
- **Resume (`Resume`)**: `user`, `title`, `link`, `description`, `createdAt`.

---

## 8. AI Resume & JD Analyzer Pipeline

The AI Resume & JD Analyzer is engineered around privacy, consistency, and explainability:

### Step-by-Step Execution
1. **Memory-Only File Ingestion**: The candidate uploads a resume PDF alongside a job description. Multer stores the file in memory buffer only (max 5 MB). The file is rejected if magic bytes do not match `%PDF-`.
2. **Text Normalization**: `pdf-parse` extracts raw text, which is normalized using Unicode NFKC normalization, removing zero-width characters and excessive whitespace.
3. **SHA-256 Fingerprinting**: A deterministic cache key is generated combining `provider + model + prompt_version + userId + resumeHash + jdHash`. If identical content was analyzed previously, the result is served from cache instantly.
4. **LLM Evidence Extraction**: Groq runs `openai/gpt-oss-120b` with `temperature: 0` and `response_format: { type: "json_object" }`. The model acts strictly as an evidence extractor:
   - Identifies explicit requirements from the JD.
   - Classifies resume evidence as `direct`, `partial`, or `none`.
   - Categorizes requirements (Skills, Role Relevance, Experience, Education, Domain Alignment).
5. **Deterministic Backend Math**: The backend validates all extracted items, applies an ordinary-activity guard to prevent penalizing candidates for generic workplace tasks, and calculates category breakdown scores and the overall score (0–100) mathematically.
6. **Result Presentation**: Returns a structured report containing:
   - `overallScore`: Computed integer (0–100).
   - `fitLevel`: `Strong Fit` (>=80), `Moderate Fit` (65-79), `Low Fit` (45-64), or `Not a Fit` (<45).
   - `summary`: High-level evaluation summary.
   - `matchedSkills`: Up to 10 verified candidate capabilities.
   - `missingSkills`: Up to 5 must-have gaps.
   - `goodToHaveImprovements`: Up to 8 optional suggestions.
   - `recommendation`: Concrete next steps for the candidate.

---

## 9. Email Reminders & Background Subsystem

The email reminder system operates through external scheduler execution:

### Trigger Command
```bash
node scripts/send-reminders.js
```
*Note: In production, execute this command on a recurring schedule (e.g., hourly or daily via Render Cron, GitHub Actions, or Linux cron).*

### Idempotency & Batch Claim Protocol
1. **Zero Double-Sends**: Reminders use a two-phase commit protocol. Records are upserted as `pending` with a unique compound index (`user + application + type + fingerprint`).
2. **Batch Ownership**: A scheduler run generates an atomic `batchId` and claims all eligible `pending` records. Only records stamped with that run's `batchId` are processed and emailed.
3. **Slot Fingerprinting**: Interview reminders are fingerprinted against `date|time|type|link`. If an interview is rescheduled, the old fingerprint no longer matches, preventing stale or duplicate emails.
4. **Resend HTML Delivery**: Renders responsive HTML templates (`followup-email.html` and `interview-email.html`) and delivers them through the Resend API.

---

## 10. REST API Specification

All protected endpoints require an `Authorization: Bearer <JWT>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Public | Register new user and send verification OTP |
| `POST` | `/api/auth/verify-otp` | Public | Verify registration OTP and issue JWT |
| `POST` | `/api/auth/resend-otp` | Public | Resend 6-digit verification code |
| `POST` | `/api/auth/login` | Public | Authenticate with email & password |
| `POST` | `/api/auth/google` | Public | Authenticate with Google OAuth ID token |
| `POST` | `/api/auth/forgot-password` | Public | Request password reset OTP email |
| `POST` | `/api/auth/reset-password` | Public | Verify reset OTP and set new password |

### User Management (`/api/user`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `PUT` | `/api/user/profile` | Protected | Update user profile details |
| `PUT` | `/api/user/password` | Protected | Change password (requires old password) |
| `DELETE` | `/api/user/account` | Protected | Permanently delete account and all data |
| `GET` | `/api/user/reminders` | Protected | Retrieve email reminder preferences |
| `PUT` | `/api/user/reminders` | Protected | Update reminder toggles and thresholds |

### Applications (`/api/applications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/applications` | Protected | Fetch all applications for the user |
| `POST` | `/api/applications` | Protected | Create application (with duplicate protection) |
| `PUT` | `/api/applications/:id` | Protected | Update application fields or status details |
| `DELETE` | `/api/applications/:id` | Protected | Delete application and clean up events |
| `GET` | `/api/applications/:id/events` | Protected | Get immutable status history timeline |

### Opportunity Planner (`/api/opportunities`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/opportunities` | Protected | Fetch upcoming prospective opportunities |
| `POST` | `/api/opportunities` | Protected | Create planned opportunity record |
| `PUT` | `/api/opportunities/:id` | Protected | Update planned opening details |
| `DELETE` | `/api/opportunities/:id` | Protected | Remove planned opportunity |

### Skills, Resources, Notes, Resumes & Dashboard
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` / `POST` | `/api/skills` | Protected | List or create self-assessed skills |
| `PUT` / `DELETE` | `/api/skills/:id` | Protected | Update or delete skill entry |
| `GET` / `POST` | `/api/resources` | Protected | List or create reference links |
| `PUT` / `DELETE` | `/api/resources/:id` | Protected | Update or delete resource entry |
| `GET` / `POST` | `/api/notes` | Protected | List or create preparation notes |
| `PUT` / `DELETE` | `/api/notes/:id` | Protected | Update or delete note |
| `GET` / `POST` | `/api/resumes` | Protected | List or create resume links |
| `PUT` / `DELETE` | `/api/resumes/:id` | Protected | Update or delete resume entry |
| `GET` | `/api/dashboard` | Protected | Retrieve aggregated metrics and recent items |
| `POST` | `/api/ai/analyze` | Protected | Multipart upload (`resumePdf` + `jobDescription`) |

---

## 11. Testing & Verification

TrackMyHunt includes offline test suites using the native Node.js test runner (`node:test`) and synthetic DOM fixtures.

### Running Backend Tests
```bash
cd backend
npm test
```
Executes 96 unit and integration tests across 5 test suites:
- `tests/ai-analyzer.test.js`: Verifies deterministic scoring, activity guarding, and Groq response mapping.
- `tests/ai-upload.test.js`: Asserts 5 MB file limits, magic byte validation, and MIME filtering.
- `tests/resume-extract.test.js`: Tests binary PDF extraction and text normalization.
- `tests/reminder.test.js`: Tests reminder eligibility windows, slot fingerprinting, and atomic batch claiming.
- `tests/email-templates.test.js`: Asserts HTML escaping and template variable substitution.

### Running Extension Tests & Linter
```bash
cd extension
npm test
npm run lint
```
- Executes offline scraper tests (`test/linkedin.test.mjs`) against synthetic search and detail DOM fixtures (`test/fakeDom.mjs`) without requiring a live browser.
- Runs `oxlint` for high-speed static code analysis.
