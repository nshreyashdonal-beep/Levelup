# LevelUp — Project Progress Tracker

> **How to use this file:** At the start of every new Claude session, give Claude your repo/zip
> plus this file and use the prompt in **Section 5**. Claude will read the checklist below, build
> ONLY the next unchecked piece in the simplest beginner-friendly way, and tell you exactly what
> to update in this file — **you paste that back in** before your next session, since this file is
> Claude's only memory across sessions.

---

## 0. Project Snapshot

**Project:** LevelUp — a course marketplace connecting students with instructors, with hybrid
(online + offline) learning support. Started as a college capstone (originally pitched as MERN),
now being rebuilt solo, one small piece at a time.

**Stack:** Node.js + Express · **PostgreSQL** (raw SQL via the `pg` library — no ORM) ·
JWT + bcrypt auth · React (Vite) + React Router + plain CSS (no Tailwind — chose plain CSS
for simplicity).

**Working style:**
- Solo build, beginner-level, going **one table / one file / one feature at a time**.
- Database structure is managed **entirely via pgAdmin's Query Tool** — no migration script.
- **Geolocation / "nearby instructors"** is intentionally saved for **last**, after the core
  LMS (auth, courses, enrollment, dashboards, reviews) works.
- **Simplest possible code.** No design patterns, abstractions, or "best practice" folder
  conventions beyond what's needed right now. Plain functions over classes, plain SQL over
  query builders, short files with comments explaining *why*, not just *what*.
- **Grow the directory as you go — never scaffold ahead.** Only files needed for the piece
  being built right now get created. The repo layout below only ever shows what actually
  exists today.

**Repo layout (current — grows one piece at a time, never scaffolded ahead):**
```
LevelUp/
├── PROGRESS.md
└── server/
    ├── package.json
    ├── .gitignore
    ├── .env.example
    ├── server.js
    ├── config/
    │   └── db.js
    ├── db/
    │   └── schema.sql
    ├── routes/
    │   ├── auth.js
    │   ├── courses.js
    │   ├── enrollments.js
    │   └── reviews.js
    └── middleware/
        └── auth.js
└── client/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        ├── styles/
        │   └── forms.css
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            └── Signup.jsx
```

**Notes chapter tracking:** two separate numbering tracks — backend and frontend each
increment independently, based on which one a session actually works on.
- Backend notes: `LevelUp-chapterN-notes.md` — currently at **Chapter 8**
- Frontend notes: `LevelUp-ChapterN-Frontend.md` — currently at **Chapter 2**

---

## 1. Piece-by-Piece Checklist

Mark `[x]` when a piece is done **and** verified (server runs, or table shows up in pgAdmin).

### Backend foundation
- [x] Minimal project skeleton: `package.json`, `.gitignore`, `server.js` with a basic
      `/api/health` route (no database yet)
- [x] Add PostgreSQL connection (`config/db.js`, `.env.example`, `.env`, `dotenv`, `pg`, `cors`)
- [x] `levelup` database created in pgAdmin, `pgcrypto` extension enabled
- [x] `users` table (created via pgAdmin Query Tool)
- [x] `courses` table
- [x] `enrollments` table
- [x] `reviews` table
- [ ] `sessions` table (doubt sessions / offline meets / mock tests)

### Backend logic
- [x] Auth: register/login routes (bcrypt password hashing, JWT)
- [x] Auth middleware (protect routes, role-based access)
- [x] Course routes (create/update/publish, browse/search)
- [x] Enrollment routes
- [x] Review routes

### Frontend (later)
- [x] Frontend skeleton (Vite + Tailwind + Router)
- [x] Auth pages (Login/Signup)
- [ ] Navbar + Home page
- [ ] Course browse + detail pages
- [ ] Create/manage course page (instructor)
- [ ] Student dashboard
- [ ] Instructor dashboard
- [ ] Reviews UI

### Late-stage differentiator
- [ ] Geolocation / "nearby instructors" — backend query + frontend UI

### Testing & polish
- [ ] Basic backend tests
- [ ] Manual QA pass, loading/error states

---

## 2. Files Created So Far

```
server/package.json   (express, dotenv, pg, cors, bcryptjs, jsonwebtoken)
server/.gitignore
server/.env.example
server/server.js       (Express app, /api/health, JSON body parsing, mounts /api/auth)
server/config/db.js    (shared Postgres connection pool)
server/db/schema.sql   (pgcrypto + users table)
server/routes/auth.js  (register + login, verified working via Hoppscotch)
server/middleware/auth.js (requireAuth + requireRole; tested via temporary /api/me route)
server/db/schema.sql   (now also includes courses table)
server/routes/courses.js (POST create course [instructor-only], GET browse all courses; verified via Hoppscotch)
server/db/schema.sql   (now also includes reviews table)
server/routes/enrollments.js (POST enroll [student-only, blocks duplicates], GET /me [own enrollments joined with course]; verified via Hoppscotch)
server/routes/reviews.js (POST review [student-only, blocks duplicates, enforces 1-5 rating], GET ?course_id=<id> [public, joined with student name]; verified via Hoppscotch)
client/  (Vite + React + react-router-dom, scaffolded via `npm create vite@latest client -- --template react`)
client/src/main.jsx  (wraps App in BrowserRouter)
client/src/App.jsx   (Routes/Route setup: "/", "/login", "/signup")
client/src/index.css (global reset + shared .page layout class)
client/src/api.js    (shared API_BASE constant)
client/src/styles/forms.css (shared styling for Login/Signup forms)
client/src/pages/Home.jsx  (placeholder homepage, proves routing works)
client/src/pages/Login.jsx  (calls POST /api/auth/login, saves token+user to localStorage)
client/src/pages/Signup.jsx (calls POST /api/auth/register, redirects to /login on success)
```

---

## 3. Decisions Log

- Stack: MERN (from original PPT) → switched to **PostgreSQL, raw SQL via `pg`, no ORM** (not Mongoose, not Prisma).
- Database structure applied via **pgAdmin Query Tool** only, not a migration script.
- Geolocation/instructor-discovery feature **de-prioritized to the very end**, after core LMS features.
- **Restarted the backend from scratch** under a stricter "simplest code, no scaffolding ahead"
  rule — earlier version had `config/db.js` and `.env.example` created before the DB piece was
  actually needed; those now get added exactly when that checklist item comes up, not before.
- Building **one table / one piece at a time**, verifying each before moving to the next.
- `/api/health` now actually pings Postgres (`SELECT 1`) and reports `db: connected` or
  `db: error`, instead of just confirming the server process is alive.
- `users` table holds both students and instructors, told apart by a `role` column (not
  two separate tables).
- Auth routes (register/login) done as two plain functions in one `routes/auth.js` file —
  no separate controller/service layers, kept as simple as possible.
- Testing endpoints with **Hoppscotch** (browser-based, free) instead of Postman.
- Project is now version-controlled on GitHub: github.com/nshreyashdonal-beep/Levelup.
- `courses` table: `price` uses `NUMERIC(10,2)` (never floating-point, to avoid rounding
  errors with money). `instructor_id` is a foreign key to `users(id)` — Postgres enforces
  it must be a real user, but doesn't enforce that user is actually an instructor (that's
  checked in application code via `requireRole('instructor')`).
- `POST /api/courses` uses `requireAuth` + `requireRole('instructor')` together; `GET /api/courses`
  has no middleware at all (public browse), and joins `users` to include `instructor_name`.
- Fixed a real bug: `COALESCE($3, 0)` in the course-creation SQL caused a 500 error because
  Postgres guessed `$3`'s type as integer (matching the plain `0`), then failed on a decimal
  price like `29.99`. Fixed with an explicit cast: `COALESCE($3::numeric, 0)`.
- Added `console.error(err)` inside every route's `catch` block — errors were previously
  swallowed silently, showing nothing in the terminal even when something broke.
- `enrollments` table: `UNIQUE (student_id, course_id)` blocks a student enrolling in the
  same course twice, without limiting how many different courses/students they can have
  overall. Both `student_id` and `course_id` are foreign keys (to `users` and `courses`).
- `POST /api/enrollments` catches specific Postgres error codes: `23505` (duplicate, from
  the UNIQUE constraint) → 409, `23503` (foreign key violation, fake course_id) → 400 —
  rather than showing a generic 500 for either.
- `reviews` table: `rating SMALLINT CHECK (rating BETWEEN 1 AND 5)` enforces valid ratings
  at the database level. `UNIQUE (student_id, course_id)` limits each student to one review
  per course (same pattern as enrollments). No foreign key to `enrollments` — a student
  isn't required to be enrolled to leave a review, kept simple for now.
- `POST /api/reviews` catches `23505` (duplicate review) → 409, `23503` (fake course_id) →
  400, and `23514` (CHECK constraint violated, bad rating) → 400.
- `GET /api/reviews` uses a query parameter (`?course_id=...`) instead of a body — standard
  practice for GET requests, which conventionally don't carry a request body.
- **Backend logic section of the checklist is now fully complete** — all core routes
  (auth, courses, enrollments, reviews) built and verified via Hoppscotch.
- Frontend: chose **plain CSS instead of Tailwind** for simplicity — no utility-class syntax
  to learn, just regular CSS files with normal class names.
- Frontend scaffolded with Vite's own official tool (`npm create vite@latest`) rather than
  hand-writing boilerplate — this is the standard, correct way to start a Vite project.
- React Router set up via `BrowserRouter` (in `main.jsx`, wraps the whole app) and
  `Routes`/`Route` (in `App.jsx`, maps URL paths to page components) — currently just one
  route (`/` → `Home`), more get added as each page becomes its own checklist piece.
- Removed Vite's default boilerplate (spinning logo, counter button) in favor of a minimal
  placeholder `Home` page, matching the project's "simplest possible, grow as you go" rule.
- CSS organized per standard React convention: colocated with components rather than one
  big shared file. `.page` (used by every page) lives in the global `index.css`; form
  styling shared by `Login`/`Signup` lives in `styles/forms.css`; `App.css` was removed
  since `App.jsx` itself renders no markup, only routes.
- Auth pages save the JWT to `localStorage` on login (`token` and `user` keys) so the
  browser remembers the session across refreshes. `/register` doesn't return a token, so
  Signup redirects to `/login` afterward rather than logging in automatically.

---

## 4. Known Issues / TODO Carried Between Sessions

```
- Enrollment routes verified: POST /api/enrollments (student-only, 201, blocks duplicates
  with 409), GET /api/enrollments/me (returns joined course title/price) both tested via
  Hoppscotch.
- Reminder for future Hoppscotch testing: Headers (including Authorization) are per-tab,
  not shared across tabs — a fresh GET/POST tab needs its own Authorization header set.
- reviews table created and verified in pgAdmin.
- Review routes verified: POST /api/reviews (student-only, 201, blocks duplicates with 409,
  enforces 1-5 rating with 400), GET /api/reviews?course_id=<id> (public, joined with
  student name) both tested via Hoppscotch.
- Backend is now feature-complete for the checklist's "Backend logic" section.
- Frontend skeleton confirmed working: npm run dev in client/ shows a plain "LevelUp" page
  at http://localhost:5173, replacing the default Vite starter content.
- Auth pages verified end-to-end: signup creates an account and redirects to /login; login
  saves token+user to localStorage and redirects to /. Confirmed via browser dev tools.
- Reminder: both npm run dev processes (server/ on :3000 and client/ on :5173) must be
  running simultaneously in separate terminals for the frontend to reach the backend.
- Next piece: Navbar + Home page.
- When pushing to GitHub, double check server/.env.example keeps its leading dot and
  that no stray duplicate copy gets committed (this happened once already).
- Watch out for accidentally nested folders (e.g. server/server) if re-extracting zip files —
  always confirm with "dir" that package.json is in your current folder before running npm commands.
```

---

## 5. Next Session Prompt (copy-paste this each time)

```
Continue the LevelUp project from where PROGRESS.md leaves off.

Attached/linked: my repo (clone or unzip it) and PROGRESS.md.

Rules for this session:
1. Read PROGRESS.md first — the checklist, decisions log, and current repo layout are your
   only memory of this project. Don't assume anything not written there.
2. Build ONLY the next unchecked checklist item. Don't jump ahead, don't build multiple
   pieces at once.
3. Write the simplest, most beginner-friendly code possible — plain functions, plain SQL,
   short files, comments that explain *why* a line exists. No frameworks, patterns, or
   abstractions beyond what this one piece needs.
4. Don't scaffold the full future directory structure. Only create the files/folders this
   piece actually needs. The repo only ever reflects what exists right now.
5. When done, give me:
   - the new/changed files (as a diff or full files, whichever is clearer for a beginner to apply)
   - the exact text to paste into PROGRESS.md's "Files Created So Far", "Decisions Log",
     "Repo layout", and checklist (with the box ticked) before my next session.
   - if notes were generated this session, update the "Notes chapter tracking" line for
     whichever track (backend/frontend) was used.
```
