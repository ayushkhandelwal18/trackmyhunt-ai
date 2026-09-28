# 🚀 TrackMyHunt

> **Your Job Hunt, Organized.**

TrackMyHunt is a full-stack **job-hunt management platform** that helps students and job seekers organize applications, plan opportunities, track skills, manage resumes, analyze job descriptions, and stay on top of their job search from one workspace.

It also includes a companion **Chrome Extension** that captures job postings directly from supported job portals and saves them to TrackMyHunt.

🌐 **[Live Demo](https://trackmyhunt.vercel.app)**  
🧩 **[Chrome Extension](https://github.com/ayushkhandelwal18/trackmyhunt-chrome-extension)**

---

## ✨ What Problem Does It Solve?

Job hunting often means switching between job boards, spreadsheets, resumes, notes, calendars, and different application trackers.

TrackMyHunt brings these workflows together in one place:

- 📋 Track job applications and their progress
- 🖱️ Drag and drop applications across different stages
- 🗓️ Plan future job opportunities
- 📊 Track skills and skill gaps
- 📄 Store and manage multiple resume versions
- 🔗 Map a resume to an application and quickly copy its link while filling forms
- 🤖 Analyze resumes against job descriptions
- 📝 Store interview notes and useful resources
- 🔔 Enable or disable email reminders for follow-ups and interviews
- 🧩 Capture jobs directly from the browser using the Chrome Extension

---

# 🌟 Core Features

## 📋 Application Tracking

Manage your complete application pipeline from one place.

- Track company, role, application date, skills, links, and notes
- Multiple application statuses
- **Drag-and-drop Kanban board**
- Application details and status history
- Duplicate application detection
- Interview and assessment details
- Track the complete application journey from applying to final outcome

### 🖱️ Drag & Drop Workflow

Move applications between stages using the Kanban board:

```text
Applied
   ↓
Resume Shortlisted
   ↓
OA Done
   ↓
Interview Scheduled
   ↓
Interview Done
   ↓
Offer / Rejected
```

---

## 🗓️ Opportunity Planner

Keep track of future opportunities before you apply.

- Upcoming job opportunities
- Opening month and year
- Role and employment type
- Required skills
- Application links
- Personal notes

This helps you maintain a pipeline of opportunities instead of only tracking jobs after applying.

---

## 📊 Skillboard

Keep your skills organized and track your current proficiency.

- Beginner
- Intermediate
- Advanced
- Expert
- Target skills for specific roles

Use the Skillboard to identify which skills you want to improve for your target roles.

---

## 📄 Resume Manager

Keep all your resume versions organized in one place.

- Store multiple resume links
- Give each resume a meaningful title
- Add descriptions
- Map a specific resume to an application
- Quickly copy the mapped resume link when filling out application forms

Instead of searching through Drive or other storage every time you apply, your resume links stay organized inside TrackMyHunt.

---

## 🤖 AI Resume & JD Analyzer

Compare a resume against a target Job Description.

The analyzer helps identify:

- 🎯 Overall match score
- ✅ Matching skills
- ❌ Missing important skills
- 📌 Areas for improvement
- 💡 Actionable recommendations

Resume PDFs are processed temporarily for analysis rather than being stored as permanent resume files.

The AI analysis uses **Groq** for fast LLM inference, while the application handles the final scoring and structured result processing.

---

## 🔔 Email Reminders

Stay on top of applications and interviews with configurable email reminders.

You can choose whether you want reminders enabled or disabled.

### Follow-up Reminders

Receive follow-up reminders for applications that have been pending for a configured period.

### Interview Reminders

Receive reminders before scheduled interviews.

### Reminder Features

- Enable / disable email reminders
- Follow-up reminders
- Upcoming interview reminders
- Configurable reminder settings
- Consolidated follow-up emails
- Automated background reminder worker

Powered by **Resend**.

---

## 🧩 Chrome Extension

TrackMyHunt also has a companion Chrome Extension that lets you capture job postings while browsing.

The extension can extract job information from supported job portals, let you review the details, detect duplicates, and save the job directly to TrackMyHunt.

Supported platforms include:

**LinkedIn · Indeed · Naukri · Internshala · Greenhouse · Lever · Workday · Ashby · Wellfound · Google Forms · Company Career Pages**

👉 **[View the TrackMyHunt Chrome Extension](https://github.com/ayushkhandelwal18/trackmyhunt-chrome-extension)**

---

# 🧠 How It Works

```text
                  ┌──────────────────────┐
                  │    Job Discovery     │
                  │ Job Boards / ATS /   │
                  │ Company Careers      │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Chrome Extension     │
                  │ Extract & Review Job │
                  └──────────┬───────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────┐
│                  TrackMyHunt                     │
│                                                  │
│  Applications  │  Opportunities  │  Skills      │
│  Resumes       │  AI Analyzer     │  Resources   │
│  Notes         │  Reminders       │  Dashboard   │
└────────────────────────┬─────────────────────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ MongoDB Database │
                └──────────────────┘
```

---

# 🛠️ Tech Stack

### Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Google OAuth

### AI & Services

- **Groq**
- **Resend**

### Browser Extension

- React
- Vite
- Tailwind CSS
- Chrome Manifest V3
- Chrome Side Panel API

---

# 🏗️ Project Structure

```text
TrackMyHunt/
│
├── backend/              # Node.js + Express API
│
├── frontend/             # React web application
│
├── extension/            # Chrome extension
│
└── README.md
```

---

# ⚙️ Local Development

## Prerequisites

Make sure you have:

- **Node.js 18+**
- **npm 9+**
- **MongoDB** or **MongoDB Atlas**
- **Google Chrome** if you want to use the browser extension

---

## 🔑 Required API Services

Before running the complete application, you may need accounts/API credentials for:

### Groq

The AI Resume & JD Analyzer uses the **Groq API**.

Create a Groq API key and add it to your backend `.env` file.

### Resend

TrackMyHunt uses **Resend** for OTP, transactional emails, and reminder emails.

Before using Resend for production email delivery:

1. Create a Resend account.
2. Add and verify a sending domain.
3. Configure the required DNS records.
4. Add your Resend API key and sender information to `.env`.

If you have access to the **GitHub Student Developer Pack**, you can check the available domain offers, including domain providers such as **Namecheap**, and use a domain you own for email sending.

---

# 1. Clone the Repository

```bash
git clone https://github.com/ayushkhandelwal18/trackmyhunt-ai.git
cd trackmyhunt-ai
```

---

# 2. Backend Setup

Open a terminal and run:

```bash
cd backend
npm install
```

Create a file:

```text
backend/.env
```

Add your environment variables:

```env
CLIENT_URL=http://localhost:5173

DATABASE_URL=your_mongodb_connection_string

EMAIL_FROM=your_email
EMAIL_PASS=your_email_password
EMAIL_USER=your_email

GOOGLE_CLIENT_ID=your_google_client_id

JWT_SECRET=your_secure_jwt_secret

PORT=3000

EMAIL_PROVIDER=resend

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
RESEND_FROM_NAME=TrackMyHunt

groq_api_key=your_groq_api_key
```

> **Important:** Never commit your real `.env` file, API keys, database credentials, JWT secrets, or email credentials to GitHub.

Start the backend:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:3000
```

---

# 3. Frontend Setup

Open another terminal from the project root:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Add:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_BASE_BACKEND_URL=http://localhost:3000
```

Start the frontend:

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

---

# 4. Start the Application

You should have the frontend and backend running separately:

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 🔔 Reminder System

TrackMyHunt includes a background reminder worker for application follow-ups and scheduled interviews.

To manually run one reminder cycle:

```bash
cd backend
npm run reminders
```

The reminder worker can be executed periodically using an external scheduler in production, such as **GitHub Actions**.

It can send:

- 📩 Follow-up digest emails
- 🗓️ Upcoming interview reminders

Users can enable or disable email reminders from their reminder settings.

---

### Chrome Extension

For extension , see the:

👉 **[TrackMyHunt Chrome Extension Repository](https://github.com/ayushkhandelwal18/trackmyhunt-chrome-extension)**

---

# 🔐 Security & Privacy

> 🔒 **Your data stays yours.** TrackMyHunt is designed to protect your information through secure authentication, hashed passwords, environment-protected credentials, and temporary processing of uploaded resume files.

TrackMyHunt follows several security and privacy practices:

- Passwords are hashed before storage.
- Authentication uses JWT-based sessions.
- Google OAuth is supported.
- Resume PDFs uploaded to the AI Analyzer are processed temporarily rather than stored as permanent resume files.
- API keys and database credentials are stored in environment variables.
- The Chrome Extension does not require users to enter their password separately.
- Resume Manager stores resume links instead of storing resume files directly.

# 🚀 Deployment

A typical production setup can use:

```text
Frontend   → Vercel
Backend    → Render / Node.js hosting
Database   → MongoDB Atlas
Emails     → Resend
AI         → Groq
Reminders  → GitHub Actions
```

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Getting Started

1. Fork the repository.
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/trackmyhunt-ai.git
cd trackmyhunt-ai
```

3. Create a feature branch:

```bash
git checkout -b feature/your-feature-name
```

4. Make your changes.
5. Run the relevant tests.
6. Commit your changes:

```bash
git add .
git commit -m "feat: add your feature"
```

7. Push your branch:

```bash
git push origin feature/your-feature-name
```

8. Open a Pull Request.

For larger changes, feel free to open an issue first to discuss the proposed change.

---

# 💡 The Idea Behind TrackMyHunt

> **Your job search should be a workflow, not a collection of spreadsheets, bookmarks, and scattered notes.**

### Discover → Capture → Organize → Analyze → Apply → Track → Follow Up

TrackMyHunt brings these steps together into one workspace.

---

## ⭐ Support the Project

If you find TrackMyHunt useful or interesting, consider giving the repository a **star** on GitHub.

Contributions, feedback, and ideas are welcome.

---

<p align="center">

### 🚀 TrackMyHunt

**Your Job Hunt, Organized.**

Built with ❤️ for a better job-search workflow.

</p>
