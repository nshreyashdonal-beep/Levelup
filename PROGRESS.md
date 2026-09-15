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
JWT + bcrypt auth · React (Vite) + Tailwind, later.

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
    │   └── auth.js
    └── middleware/
        └── auth.js
```

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
- [ ] `enrollments` table
- [ ] `reviews` table
- [ ] `sessions` table (doubt sessions / offline meets / mock tests)

### Backend logic
- [x] Auth: register/login routes (bcrypt password hashing, JWT)
- [x] Auth middleware (protect routes, role-based access)
- [ ] Course routes (create/update/publish, browse/search)
- [ ] Enrollment routes
- [ ] Review routes

### Frontend (later)
- [ ] Frontend skeleton (Vite + Tailwind + Router)
- [ ] Auth pages (Login/Signup)
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

---

## 4. Known Issues / TODO Carried Between Sessions

```
- courses table created and verified in pgAdmin (needed a sidebar refresh to appear).
- Next piece: course routes (create/update/publish, browse/search) — will need
  requireAuth + requireRole('instructor') on the create route.
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
```
