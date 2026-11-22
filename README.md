<div align="center">

# ⭐ HireMate

### Your AI-powered interview preparation partner

Paste a job description, upload your resume, and get a **personalised interview plan** in about 30 seconds: tailored questions, skill-gap analysis, a day-wise roadmap, **mock interviews with AI feedback**, an ATS keyword check, a cover letter and a tailored resume PDF.

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

## ✨ Features

### 🎯 AI Interview Plan
- **Match score (0–100%)** showing how well your profile fits the job
- **Technical & behavioral questions** written from *your* resume and the job description, each with the interviewer's intention and a model answer
- **Skill-gap analysis** with high / medium / low priority, plus video, docs and practice links for each gap
- **Day-wise preparation roadmap** with checkboxes and saved progress
- **Company-specific prep:** add a company name (e.g. Amazon, Google) and questions follow that company's interview style

### 🎙️ Mock Interview Mode
- Answer any question by **typing or speaking** (speech-to-text in Chrome/Edge)
- **Read-aloud** questions and an answer timer for a real interview feel
- AI scores each answer **out of 10** with feedback, strengths, improvements and a **stronger version of your answer**
- Behavioral answers are checked against the **STAR method**
- All attempts are saved; your best score shows on every question

### 📄 Resume & Application Tools
- **ATS keyword check:** matched vs missing keywords, an ATS score and suggestions
- **Tailored resume PDF:** an ATS-friendly one-page resume generated for the job
- **Cover letter generator:** copy, download or regenerate
- **Print / save the full report as PDF**

### 📊 Dashboard
- Average & best match score, answers practiced, roadmap completion
- **Match score over time** chart
- **Most common skill gaps** across all your plans
- Search, sort, rename and delete your plans

### 🔗 Sharing & Account
- **Public read-only share link** for mentors or friends (your resume and answers are never shared)
- Profile settings: change username, email or password, or delete your account

### 🔒 Security & Reliability
- JWT auth in **httpOnly cookies** with logout token blacklisting (auto-expires via MongoDB TTL index)
- Passwords hashed with **bcrypt**
- Users can only access their own reports
- **Rate limiting** on login and AI routes, **Helmet** security headers
- PDF-only uploads (max 5 MB) and input validation
- **Automatic Gemini model fallback** if a model is retired, with friendly error messages

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router, Axios, Sass, Context API, Web Speech API |
| **Backend** | Node.js, Express 5, Mongoose, JWT, bcrypt, Multer, pdf-parse, Puppeteer, Zod |
| **AI** | Google Gemini (`@google/genai`) with structured JSON output |
| **Database** | MongoDB Atlas |
| **Security** | Helmet, express-rate-limit, httpOnly cookies, CORS |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or newer (LTS recommended)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- A free [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone the repository
```bash
git clone https://github.com/Saiprathiksha-20/HireMate.git
cd HireMate
```

### 2. Set up the backend
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` folder (see `.env.example`):
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=any_long_random_string
GOOGLE_GENAI_API_KEY=your_gemini_api_key
```
Check that everything is connected:
```bash
npm run check-env
```
Start the server:
```bash
npm run dev        # runs on http://localhost:3000
```

### 3. Set up the frontend
In a new terminal:
```bash
cd Frontend
npm install
npm run dev        # runs on http://localhost:5173
```

Open **http://localhost:5173**, register, and create your first interview plan.

---

## 📡 API Overview

A ready-made Postman collection is included: `Backend/HireMate.postman_collection.json`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register |
| `POST` | `/api/auth/login` | Log in (sets cookie) |
| `GET` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/get-me` | Current user |
| `PATCH` | `/api/auth/profile` | Update username / email |
| `PATCH` | `/api/auth/change-password` | Change password |
| `DELETE` | `/api/auth/account` | Delete account |
| `POST` | `/api/interview/` | Generate interview plan (form-data: `jobDescription`, `resume`, `selfDescription`, `companyName`) |
| `GET` | `/api/interview/` | All my plans |
| `GET` | `/api/interview/stats` | Dashboard statistics |
| `GET` | `/api/interview/report/:id` | One plan |
| `PATCH` | `/api/interview/report/:id` | Rename plan |
| `DELETE` | `/api/interview/report/:id` | Delete plan |
| `PATCH` | `/api/interview/report/:id/progress` | Tick a roadmap task |
| `POST` | `/api/interview/report/:id/evaluate` | Mock interview: AI scores an answer |
| `POST` | `/api/interview/report/:id/ats` | ATS keyword check |
| `POST` | `/api/interview/report/:id/cover-letter` | Generate cover letter |
| `POST` | `/api/interview/report/:id/share` | Turn the share link on/off |
| `GET` | `/api/interview/shared/:shareId` | Public shared plan (no login) |
| `POST` | `/api/interview/resume/pdf/:id` | Download tailored resume PDF |
| `GET` | `/api/health` | Server & database status |

---

## 📁 Project Structure

```
HireMate/
├── Backend/
│   ├── scripts/check-env.js        # checks MongoDB, JWT & Gemini setup
│   ├── server.js
│   └── src/
│       ├── app.js                  # express app, security, error handling
│       ├── config/                 # database connection
│       ├── controllers/            # auth & interview logic
│       ├── middlewares/            # auth, file upload, rate limits
│       ├── models/                 # user, interview report, token blacklist
│       ├── routes/
│       └── services/ai.services.js # all Gemini prompts
└── Frontend/
    └── src/
        ├── components/             # navbar, layout, toasts, modal
        ├── features/
        │   ├── auth/               # login, register, profile
        │   └── interview/          # home, report, dashboard, mock interview, ATS, cover letter
        ├── lib/api.js              # shared axios instance
        └── style/_theme.scss       # colour theme
```

---

## 🔮 Future Improvements
- Google sign-in and password reset by email
- Deployment (Render + Vercel)
- Video mock interviews with confidence and filler-word analysis
- Resume version history and side-by-side comparison

---

<div align="center">

Made with ❤️ by **[Saiprathiksha](https://github.com/Saiprathiksha-20)**

If you found this useful, consider giving it a ⭐

</div>
