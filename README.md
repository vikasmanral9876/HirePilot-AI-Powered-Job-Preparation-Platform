# HirePilot 🚀

**HirePilot** is an AI-powered job preparation platform designed to help candidates prepare for interviews, identify skill gaps, generate personalized interview strategies, track preparation progress, and create ATS-friendly tailored resumes.

🔗 **Live Demo:** https://hirepilot-frontend-7a9v.onrender.com  
🔗 **Backend API:** https://hirepilot-backend-mq91.onrender.com  
🔗 **GitHub:** https://github.com/vikasmanral9876/gen-ai-job-preparation

---

## ✨ Features

### 🔐 Authentication
- Email/password registration and login
- JWT-based authentication
- Google OAuth login
- Protected routes and authenticated API requests
- Logout functionality
- User-specific data isolation

### 📄 Resume & Job Description Analysis
- Upload resumes in PDF format
- Upload/provide job descriptions
- Extract relevant information for interview preparation
- Identify skills and requirements relevant to the target role

### 🤖 AI-Powered Interview Preparation
- Generate personalized interview preparation plans
- AI-generated interview questions and preparation guidance
- Role-specific preparation based on resume and job requirements
- Structured interview reports
- Graceful handling of AI service failures and temporary quota/rate-limit issues

### 📊 Preparation Dashboard
- Track interview preparation progress
- Roadmap/task completion tracking
- User-specific activity and progress data
- Dashboard-based preparation workflow

### 📑 ATS-Tailored Resume
- Generate an ATS-friendly resume based on the target job description
- Background PDF generation
- Resume stored securely for later download
- Download generated ATS-tailored resume without regenerating it every time
- Production-safe PDF generation using Puppeteer

### 🎨 Modern UI
- Responsive React interface
- Dark, professional dashboard experience
- Toast notifications and user-friendly error states
- Loading and retry states for long-running operations
- Responsive authentication and dashboard pages

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS
- Google Identity Services

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Multer
- Zod
- Puppeteer

### AI & Integrations

- Google Gemini API
- Google OAuth
- AI-generated interview preparation
- AI-assisted ATS resume generation

### Deployment

- Render
- MongoDB Atlas

---

## 🏗️ Architecture

```text
                    ┌─────────────────────────┐
                    │       HirePilot         │
                    │       React + Vite      │
                    └────────────┬────────────┘
                                 │
                           Axios / HTTP
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     Express Backend     │
                    │        Node.js           │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌───────────┐      ┌───────────┐     ┌─────────────┐
        │ MongoDB   │      │ Gemini AI  │     │  Puppeteer  │
        │  Atlas    │      │    API     │     │ PDF Engine  │
        └───────────┘      └───────────┘     └─────────────┘
```

---

## 🔄 How HirePilot Works

```text
User
 │
 ▼
Register / Login
 │
 ▼
Upload Resume + Provide Job Details
 │
 ▼
HirePilot Backend
 │
 ├── Resume Processing
 ├── Job Requirement Analysis
 └── Gemini AI
       │
       ▼
Interview Preparation Plan
       │
       ├── Interview Questions
       ├── Preparation Roadmap
       └── Progress Tracking

       └──────────────────────────────┐
                                      ▼
                              ATS Resume Generation
                                      │
                                      ▼
                                PDF stored in DB
                                      │
                                      ▼
                                  Download
```

---

## 🔒 Security & Reliability

HirePilot includes several production-oriented safeguards:

- JWT authentication for protected API endpoints
- User-scoped database queries
- Protected frontend routes
- Google OAuth authentication
- CORS configuration for the deployed frontend
- PDF upload validation
- 10 MB upload size limit
- Sanitized AI error responses
- Server-side technical error logging
- No API keys exposed to the frontend
- No JWTs, cookies, passwords, or raw resume contents logged
- MongoDB indexes for frequently queried data
- TTL-based cleanup for blacklisted authentication tokens
- Production-safe Puppeteer configuration
- Graceful AI failure handling

When Gemini is temporarily unavailable, users receive a simple message instead of raw provider errors:

> We're temporarily unable to generate your interview plan. Please try again later.

---

## 📁 Project Structure

```text
gen-ai-job-preparation/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── auth/
│   │   ├── ...
│   │   └── main.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account or MongoDB instance
- Google Cloud project for Google OAuth
- Gemini API key

---

### 1. Clone the Repository

```bash
git clone https://github.com/vikasmanral9876/gen-ai-job-preparation.git

cd gen-ai-job-preparation
```

---

### 2. Setup Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:5173

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=your_gemini_model

GOOGLE_CLIENT_ID=your_google_client_id
```

Start the backend:

```bash
node server.js
```

The backend runs on:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

---

### 3. Setup Frontend

Open another terminal:

```bash
cd Frontend
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## 🔑 Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `NODE_ENV` | Application environment |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `FRONTEND_URL` | Allowed frontend origin(s) |
| `GEMINI_API_KEY` | Gemini API key |
| `GEMINI_MODEL` | Gemini model used by the application |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

> Never commit `.env` files or API keys to GitHub.

---

## 🔌 API Overview

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/google
GET  /api/auth/get-me
POST /api/auth/logout
```

### Interview

The interview API handles:

- Resume upload
- Interview plan generation
- Interview report creation
- AI-powered preparation
- ATS resume generation
- ATS resume download

### Health

```text
GET /api/health
```

Example response:

```json
{
  "status": "ok",
  "service": "HirePilot API",
  "database": "connected"
}
```

---

## 🤖 AI Error Handling

AI services can occasionally experience rate limits, temporary outages, unavailable models, network failures, or malformed responses.

HirePilot handles these failures without exposing internal provider information to users.

### Backend

Technical details remain on the server for debugging.

### Frontend

Users receive a clear message:

```text
We're temporarily unable to generate your interview plan.
Please try again later.
```

The application also resets its loading state and allows the user to retry.

---

## 📄 ATS Resume Generation

HirePilot generates an ATS-tailored resume as part of the interview preparation workflow.

The process is designed to avoid making the user wait unnecessarily:

```text
Create Interview Plan
        │
        ▼
Start ATS Resume Generation
        │
        ▼
Background PDF Generation
        │
        ▼
Store PDF in MongoDB
        │
        ▼
User clicks Download
        │
        ▼
Download generated PDF
```

Puppeteer is configured for production environments using appropriate Chromium sandbox flags.

---

## 🚀 Deployment

HirePilot is deployed using Render.

### Frontend

```text
Platform: Render Static Site
Build Command: npm install && npm run build
Publish Directory: dist
```

### Backend

```text
Platform: Render Web Service
Build Command: npm install
Start Command: node server.js
```

### Database

```text
MongoDB Atlas
```

The production application is available at:

**https://hirepilot-frontend-7a9v.onrender.com**

---

## 🧪 Testing Checklist

Before production deployment, verify:

- [x] Email registration
- [x] Email login
- [x] Google OAuth login
- [x] Logout
- [x] Protected routes
- [x] Resume PDF upload
- [x] Interview plan generation
- [x] AI-generated preparation
- [x] Preparation roadmap
- [x] Progress tracking
- [x] ATS resume generation
- [x] ATS resume download
- [x] MongoDB persistence
- [x] Production frontend deployment
- [x] Production backend deployment
- [x] AI failure handling
- [x] User-specific data isolation
- [x] Production error handling

---

## 📸 Screenshots

Add screenshots of the following sections here to showcase the application:

### Login

```text
[ Add login screenshot ]
```

### Dashboard

```text
[ Add dashboard screenshot ]
```

### Interview Preparation

```text
[ Add interview setup screenshot ]
```

### Preparation Roadmap

```text
[ Add roadmap screenshot ]
```

### ATS Resume

```text
[ Add ATS resume screenshot ]
```

---

## 🎯 Project Goals

HirePilot was built to solve a practical problem: job preparation often requires candidates to use multiple disconnected tools for resumes, interview questions, skill-gap analysis, and preparation tracking.

The goal of HirePilot is to bring these workflows together into a single application.

---

## 🔮 Future Improvements

Potential future improvements include:

- More AI providers and model fallback strategies
- Advanced job-description analysis
- More detailed skill-gap visualizations
- Interview performance analytics
- Mock interview sessions
- Voice-based interview practice
- More ATS resume templates
- Job application tracking
- Additional OAuth providers
- Enhanced dashboard analytics

---

## 👨‍💻 Author

### Vikas Manral

Electronics & Communication Engineering graduate focused on software development, full-stack web development, and AI-powered applications.

**GitHub:** https://github.com/vikasmanral9876

---

## 📜 License

This project is currently intended as a personal portfolio and learning project.

---

⭐ If you found HirePilot interesting, consider starring the repository.
