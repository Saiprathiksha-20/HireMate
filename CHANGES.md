# HireMate – Changelog (Nov 2026)

> **Nothing was pushed to GitHub.** All old routes, request bodies, responses, the `token` cookie and your MongoDB collections still work exactly as before. New fields in MongoDB are optional, so old reports open normally.

## How to run (same as before)
```
cd Backend  && npm install && npm run dev        # http://localhost:3000
cd Frontend && npm install && npm run dev        # http://localhost:5173
```
`npm install` is needed once in Backend because two packages were added (`express-rate-limit`, `helmet`).

**New:** `cd Backend && npm run check-env` tests your MongoDB, JWT secret and Gemini key and tells you exactly what's wrong.

**Postman:** import `Backend/HireMate.postman_collection.json` (24 requests, old + new). Log in first; Postman keeps the cookie. Put a report id in the `reportId` collection variable.

---

# Round 2 – New features

## 1. Mock Interview mode (biggest feature)
Report page → **Mock Interview** tab (or "🎙 Practice this question" on any question card).
- Answer by **typing or speaking** (microphone works in Chrome/Edge), with **🔊 Read aloud** for the question and an answer timer.
- Gemini scores the answer **0–10** and gives feedback, *what went well*, *how to improve* and *a stronger version of your answer*. Behavioral answers are checked against the STAR method.
- Every attempt is saved; question cards show your best score; previous attempts are listed.
- API: `POST /api/interview/report/:id/evaluate`  body `{ questionType, questionIndex, answer }`

## 2. ATS Keyword Check
Report page → **ATS Check** tab. Shows an ATS score, **missing keywords** (red), **matched keywords** (green) and suggestions to fix the resume. The result is saved; use "Re-run" to refresh.
- API: `POST /api/interview/report/:id/ats` (`?refresh=true` to regenerate)

## 3. Cover Letter generator
Report page → **Cover Letter** tab. Tailored to the job/company, with Copy, Download .txt and Regenerate.
- API: `POST /api/interview/report/:id/cover-letter` (`?refresh=true`)

## 4. Roadmap progress tracking
Roadmap tasks are now **checkboxes**; progress is saved to MongoDB and shown as progress bars (roadmap, sidebar, dashboard). The `timeframe` per day is shown.
- API: `PATCH /api/interview/report/:id/progress` body `{ day, taskIndex, done }`

## 5. Dashboard page (`/dashboard`)
Stats cards (plans, average & best match, answers practiced, tasks done), a **match-score-over-time chart**, **most common skill gaps** across all plans, and a list of all plans with search, sort, progress, **rename** and **delete** (with confirmation dialog).
- API: `GET /api/interview/stats`, `PATCH /api/interview/report/:id`, `DELETE /api/interview/report/:id`

## 6. Share report link
Sidebar → **Create share link**. Anyone with the link sees a read-only page (`/shared/...`) – no login needed. Resume, self-description, practice answers and cover letter are **never** shared. Can be turned off anytime.
- API: `POST /api/interview/report/:id/share` body `{ enabled }`, public `GET /api/interview/shared/:shareId`

## 7. Company-specific preparation
Optional **Company name** field on the Home page → questions are tailored to that company. Company is shown on cards, report page and dashboard.

## 8. Profile & Settings page (`/profile`)
Change username/email, change password, delete account (password confirmation; deletes all reports).
- API: `PATCH /api/auth/profile`, `PATCH /api/auth/change-password`, `DELETE /api/auth/account`

## 9. Learning resources for skill gaps
Sidebar → "Learn the gaps": Video / Docs / Practice links for every skill gap.

## 10. Print / Save report as PDF
"🖨 Print / Save report" prints a clean, white, all-sections version of the report (choose "Save as PDF" in the print dialog).

## 11. UI / UX polish
- **Navbar** on every logged-in page (logo, New Plan, Dashboard, user menu with Profile & Logout).
- Redesigned Login/Register (dark card, logo, tagline) – same fields and behaviour.
- Home: real **drag & drop** for the resume, shows file name/size with Remove, greeting, and a **step-by-step loading screen** with progress bar while the AI works.
- Toast notifications, confirmation dialogs, spinners on every AI button.
- **Mobile responsive** report page, home and dashboard.
- 404 page. Footer dead links (#) replaced with real links.

## 12. Backend reliability & security
- **Gemini model fallback**: if `gemini-3-flash-preview` gets retired by Google (preview models do), it automatically tries `gemini-2.5-flash`, then `gemini-2.0-flash`. Override with `GEMINI_MODEL` in `.env`.
- Friendly AI errors (quota reached, bad API key) instead of a generic 500.
- **Rate limiting**: login/register 50 per 15 min per IP; AI routes 60 per hour per user (change with `AUTH_RATE_LIMIT`, `AI_RATE_LIMIT`).
- **helmet** security headers; JSON body size limit.
- `GET /api/health` shows server, database status and whether the AI key is set.
- Clear console tips when MongoDB can't connect (IP access list / paused cluster / wrong password).
- `Backend/.env.example` documents every variable.

## 13. Bug found while testing
- **Log out then log back in within the same second → "token is invalid".** Both logins produced the identical JWT, which was already blacklisted. Every token now gets a unique id (`jwtid`). Old tokens still work.
- Login page styles applied to **every** `<main>` element in the app (including the report page). Now scoped to the login/register pages only.

## 14. Colours matched to the theme
All red / yellow / green status colours were replaced with the HireMate pink–purple palette (defined once in `Frontend/src/style/_theme.scss`):
| Meaning | Before | Now |
|---|---|---|
| Strong score, done task, matched keyword, low-severity gap | green | **violet** `#c084fc` |
| Average score, medium-severity gap | yellow | **soft pink** `#ff8fb8` |
| Low score, missing keyword, high-severity gap | red | **hot pink** `#ff2d78` (accent) |
| Delete buttons | red | dark pink `#e1034d` |
"Model Answer" tags are pink instead of green. Progress bars are a pink → violet gradient.

## Testing done
- 38 automated API checks (old + new routes, validation, other users can't read/delete/share your reports) – all pass.
- Every page clicked through in a real browser (desktop + mobile size), including mock interview, ATS, cover letter, sharing, print, profile.
- Not tested against your real MongoDB/Gemini (they're blocked from my workspace) – run `npm run check-env` first.

---

# Round 1 – Bug fixes

All API routes, request bodies, response shapes, cookie name (`token`) and MongoDB collections are **unchanged**, so existing Postman requests and data in MongoDB Compass keep working.

### Backend

| # | File | Problem | Fix |
|---|------|---------|-----|
| 1 | `controllers/interview.controller.js` | Server crashed (`req.file` undefined) when no resume was uploaded, even though the UI says "Resume **or** Self Description". | Resume is now optional. Returns 400 if job description is missing, or if both resume and self description are missing. |
| 2 | `controllers/interview.controller.js` | **Security:** `POST /resume/pdf/:id` used `findById`, so any logged-in user could generate a resume from someone else's report. | Now uses `findOne({ _id, user: req.user.id })`. |
| 3 | `controllers/interview.controller.js` | An invalid id (e.g. `/report/abc`) caused a 500 CastError. | Returns 400 "Invalid interview report id." |
| 4 | `models/interviewReport.model.js` | AI returns `timeframe` for each plan day but the schema had no such field, so Mongoose silently dropped it. | Added `timeframe` to the schema. |
| 5 | `services/ai.services.js` | Puppeteer option was `margins` (wrong) → margins ignored. Browser was not closed if PDF generation failed → Chrome processes pile up. | Changed to `margin`, added `printBackground`, close browser in `finally`. |
| 6 | `services/ai.services.js` | Prompt didn't ask for `title` (which is **required** in the schema) → save could fail. Logged the full schema + full AI response on every request. | Prompt now asks for `title`; empty resume/self description sent as "Not provided"; noisy logs removed. |
| 7 | `controllers/auth.controller.js` | Login with missing email/password crashed bcrypt. Register error message was cut off ("please provide username,"). `/get-me` crashed if the user was deleted. | Added validation and a 404 for missing user. |
| 8 | `controllers/auth.controller.js` | Cookie had no options – readable by JavaScript (XSS risk) and became a session cookie. | Cookie is now `httpOnly`, `sameSite: "lax"`, `maxAge` 1 day, `secure` only when `NODE_ENV=production`. Postman and localhost work the same. |
| 9 | `models/balcklist.model.js` | Blacklisted tokens were stored forever. | TTL index – MongoDB auto-deletes entries after 1 day (the JWT lifetime). |
| 10 | `middlewares/file.middleware.js` | Any file type was accepted as a resume. | Only PDFs accepted (400 otherwise). |
| 11 | `app.js` | Errors returned as Express HTML pages; unknown routes too. | JSON 404 handler + central JSON error handler (file too large → 400, etc.). |
| 12 | `server.js`, `app.js`, `package.json` | Hard-coded port and CORS origin; no `start` script. | `PORT` and `CLIENT_URL` env vars (defaults 3000 / http://localhost:5173), added `npm start`. |

### Frontend

| # | File | Problem | Fix |
|---|------|---------|-----|
| 1 | `app.routes.jsx` | Imports used wrong case (`pages/login`, `pages/home`, `pages/interview`) while files are `Login.jsx`, `Home.jsx`, `Interview.jsx`. Works on Windows, **breaks on Linux / Vercel / Netlify builds**. | Fixed casing; route is now `/login` everywhere. |
| 2 | `useAuth.js`, `auth.context.jsx` | Wrong password still redirected to `/` (errors were swallowed). `/get-me` was called by every component using `useAuth`. | Login/Register show the backend error message. `/get-me` runs once in `AuthProvider`. Logged-in users visiting /login are redirected home. |
| 3 | `Home.jsx` | No validation; char counter always "0 / 5000"; no way to log out; no indication which file was picked; "drag & drop" text but drag & drop didn't work. | Validation with error banner, live counter, selected file name, Logout button + username. |
| 4 | `interview.api.js` | Sent the string `"undefined"` as resume when no file chosen; manual multipart header without boundary. | Only appends resume if present; axios sets the header itself. |
| 5 | `Interview.jsx`, `useInterview.js` | Report was fetched twice; whole page turned into a loading screen while the PDF was generated; "Strong match" shown even for 30%; failed loads stuck on "Loading..." forever. | Single fetch, button shows "Generating Resume...", score text depends on score, error screen with "Back to home". Blob URL cleaned up after download. |
| 6 | `lib/api.js` (new) | Base URL duplicated and hard-coded in two files. | One shared axios instance; uses `VITE_API_URL` if set, else `http://localhost:3000`. |

### Notes
- Old reports saved with the misspelled field `intension` (see `Backend/untitled.js`) will show an empty "Intention" – generate a new report for those.
- `Backend/untitled.js` is not valid JavaScript and `Backend/src/services/temp.js` is sample data; neither is used by the app. Safe to delete or move to a `samples/` folder.
- Never commit `.env` (it's already in `.gitignore`). Required keys: `MONGO_URI`, `JWT_SECRET`, `GOOGLE_GENAI_API_KEY`.
