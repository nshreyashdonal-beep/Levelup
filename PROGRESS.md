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

**Reference mockups (not part of the live app — design/structure reference only, same
role Becomeinstructor.jsx played before it got wired up and moved into `client/src/pages/`):**
```
src.rar (uploaded, extracted to inspect)
├── components/Navbar.jsx, Footer.jsx        (already implemented for real, ignore now)
├── pages/Becomeinstructor.jsx, Home.jsx,     (already implemented for real, ignore now)
│         Login.jsx, Signup.jsx
└── pages/Instructordashboard.jsx,           ← next 3 pieces to build, see checklist
          Mycourses.jsx,
          Studentdashboard.jsx
```

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
        ├── components/
        │   ├── Navbar.jsx / Navbar.css
        │   ├── Footer.jsx / Footer.css
        │   ├── StudentNav.jsx / StudentNav.css
        │   └── InstructorNav.jsx / InstructorNav.css
        └── pages/
            ├── Home.jsx / Home.css
            ├── Login.jsx / Login.css
            ├── Signup.jsx / Signup.css
            ├── BecomeInstructor.jsx / BecomeInstructor.css
            ├── StudentDashboard.jsx / StudentDashboard.css
            ├── InstructorWelcome.jsx / InstructorWelcome.css
            ├── InstructorDashboard.jsx / InstructorDashboard.css
            └── MyCourses.jsx / MyCourses.css
```

**Notes chapter tracking:** two separate numbering tracks — backend and frontend each
increment independently, based on which one a session actually works on.
- Backend notes: `LevelUp-chapterN-notes.md` — currently at **Chapter 8**
- Frontend notes: `LevelUp-ChapterN-Frontend.md` — currently at **Chapter 2**

---

## 1. Piece-by-Piece Checklist

Mark `[x]` when a piece is done **and** verified (server runs, or table shows up in pgAdmin).

Two branches from here:
- **Branch 0** — the main line below (everything already in this checklist: remaining
  backend tables, course browse/create/review UI, geolocation, testing).
- **Branch 1** — a side quest that jumped the queue (see its own section after Branch 0
  below). Once Branch 1 is finished, come back here and resume Branch 0 at the next
  unchecked item.

### Branch 0 — Main line

### Backend foundation
- [x] Minimal project skeleton: `package.json`, `.gitignore`, `server.js` with a basic
      `/api/health` route (no database yet)
- [x] Add PostgreSQL connection (`config/db.js`, `.env.example`, `.env`, `dotenv`, `pg`, `cors`)
- [x] `levelup` database created in pgAdmin, `pgcrypto` extension enabled
- [x] `users` table (created via pgAdmin Query Tool)
- [x] `courses` table
- [x] `enrollments` table
- [x] `reviews` table
- [x] `instructor_profiles` table (created + verified in pgAdmin)
- [x] `sessions` table (doubt sessions / offline meets / mock tests)

### Backend logic
- [x] Auth: register/login routes (bcrypt password hashing, JWT)
- [x] Auth middleware (protect routes, role-based access)
- [x] Course routes (create/update/publish, browse/search)
- [x] Enrollment routes
- [x] Review routes
- [x] `POST /api/auth/register` writes `bio`/`phone`/`location` into `instructor_profiles`
      when `role === 'instructor'` — confirmed working via the live Become Instructor form.

### Frontend — Auth & entry pages (done)
- [x] Frontend skeleton (Vite + Tailwind + Router)
- [x] Login page
- [x] Signup page (student-only, no role toggle)
- [x] Become Instructor page (instructor-only, own emerald theme, bio/phone/location,
      writes to `instructor_profiles`)
- [x] Navbar component
- [x] Footer component
- [x] Home page (hero, student/teacher journey tabs, how-it-works, reviews)

### Frontend — Branch: Dashboards & course pages (next up)
Mockups for all three arrived this session in `src.rar` (`pages/Studentdashboard.jsx`,
`pages/Instructordashboard.jsx`, `pages/Mycourses.jsx`) — these are the **visual/structure
reference only**, same as Becomeinstructor.jsx was. Each still needs the same treatment
that page got: swap any fields/endpoints the mockup imagines for what the real backend
actually has, before wiring it up. Build **one at a time, in this order**, ticking each
box only once it's wired to real data (not just static/placeholder content) and manually
verified in the browser:

- [x] **Student Dashboard** (`/student-dashboard` — mockup: `Studentdashboard.jsx`)
      - Reuses the student/teacher "journey" section styling from Home.
      - Reads `user` from `localStorage` (same pattern as Login/Signup already use) and
        redirects to `/login` if missing or `role !== 'student'`.
      - Needs real data wired in: enrolled courses + progress should come from
        `GET /api/enrollments/me` (already built and verified) instead of any placeholder
        array — there is currently no `progress` column anywhere, so decide then whether
        to add one or drop that part of the mockup for now.
- [x] **Instructor Dashboard** (`/instructor-dashboard` — mockup:
      `Instructordashboard.jsx`)
      - Same localStorage guard pattern, but `role !== 'instructor'`.
      - Stat cards (Total Students / Active Courses / Total Earnings / Avg. Rating) are
        static "0"/"—" placeholders in the mockup. Active Courses can be wired for real
        immediately via `GET /api/courses` filtered to this instructor. The other three
        need backend work that doesn't exist yet (earnings, ratings aggregation, student
        counts) — flag those as follow-up pieces rather than faking numbers.
      - "Quick Actions" (Create Course / Go Live / Schedule Offline) are just cards in the
        mockup with no click behavior — Create Course can eventually link to the
        create/manage course page below; the other two depend on features not built yet.
- [x] **Instructor Welcome** (`/instructor-welcome` — no separate mockup; journey
      steps/markup lifted as-is from Home.jsx's "Teacher's Path" tab)
      - New page added after Instructor Dashboard was already built: instructors now land
        here right after login (welcome message + the same 6-step teacher journey shown on
        Home), with a link through to the real `/instructor-dashboard` stats page, instead
        of dropping straight into the dashboard. Mirrors the welcome+journey feel Student
        Dashboard already has for students.
      - Same localStorage guard pattern, `role !== 'instructor'`.
- [x] **My Courses** (`/mycourse` — mockup: `Mycourses.jsx`, path already referenced by
      Navbar links in other mockups)
      - Same localStorage guard pattern, `role !== 'student'`.
      - Mockup's hardcoded `courses` array replaced with real data from
        `GET /api/enrollments/me` (extended this session to also join+return
        `instructor_name`).
      - Dropped: course type (Hybrid/Online), skill level, per-course progress %, and the
        per-course tech logo image — none of these have a column anywhere in the schema.
        Card image band replaced with a plain colored circle showing the title's first
        letter instead. Flagged as follow-up, not built now (see "Late-stage" / open
        questions below for progress %).
- [x] **Student Landing Page** (`/student-landing` — new page, no mockup; this is the
      **Explore Courses** page students reach via a button, not the post-login landing)
      - StudentNav + hero (image + text only — journey tabs, how-it-works, and reviews
        sections from Home.jsx dropped) + a course grid below the hero showing all
        available courses.
      - Course grid data comes from the existing public `GET /api/courses` (no new
        backend work) — each card shows title, instructor name, price, and rating (⭐).
        Cards are clickable but don't navigate yet (course detail page doesn't exist).
      - `StudentNav.jsx`: "Explore" link changed from a dead `<a href="#">` to a real
        `Link` to `/student-landing`, with the same active-state highlighting pattern
        already used for "My Courses" on `/mycourse`.
      - Reached two ways: StudentNav's "Explore" link (present on every student page,
        including the Dashboard), and the "Explore Courses" action card on Student
        Dashboard (fixed to point here instead of its old broken link to `/`).
- [x] Course browse + detail pages (basic course grid lives on Student Landing via
      `GET /api/courses`; individual course detail view now built —
      `CourseDetail.jsx` at `/courses/:id`, showing full description, sessions,
      reviews, and an enroll button; grid cards already navigated there, they
      just had nowhere to land until now)
- [x] Create/manage course page (instructor) — no mockup existed; built as
      `ManageCourses.jsx` at `/manage-courses` — a create-course form (uses existing
      `POST /api/courses`) plus a list of the instructor's own courses (existing
      `GET /api/courses?instructor_id=`). "Manage" only goes as far as create + view —
      no edit/delete UI since there's no PUT/DELETE route on courses yet.
- [x] Reviews UI — built into `CourseDetail.jsx` (no separate page/mockup needed) — a
      star-rating + comment form under the existing reviews list, using the existing
      `POST /api/reviews`. New review is inserted straight into the list on success.

**Note for whichever page gets built next:** decide up front whether `progress` (course
completion %) is worth a real schema piece now or a placeholder to skip — it shows up in
both Student Dashboard and My Courses mockups but nothing in the current schema tracks it.

### Late-stage differentiator
- [ ] Geolocation / "nearby instructors" — backend query + frontend UI

### Testing & polish
- [ ] Basic backend tests
- [ ] Manual QA pass, loading/error states

### Branch 1 — Profile menu dropdown

Side quest, not part of the Branch 0 order above: the avatar circle in StudentNav/
InstructorNav did nothing on click. Reference: a screenshot of Udemy's own profile
dropdown (avatar + name/email header, then grouped links, then Log out).

- [x] **ProfileMenu component** (`client/src/components/ProfileMenu.jsx`) — shared
      dropdown used by both StudentNav and InstructorNav
      - Opens/closes on avatar click, closes on outside click
      - Header: avatar initial + real `name`/`email` from the `user` object
      - One real nav link: My Courses (student) or Instructor Dashboard (instructor)
      - Real Log out: clears `token`/`user` from localStorage, navigates to `/`
      - Everything else from the Udemy screenshot (cart, wishlist, notifications,
        messages, account settings, payment methods, subscriptions, Udemy credits,
        purchase history, language, help & support) was left out entirely rather than
        shown as dead links — none of it exists anywhere in this project's schema or
        plans, same reasoning as Instructor Dashboard's honest placeholder stats.

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
client/src/App.jsx   (Routes/Route setup: "/", "/login", "/signup", "/become-instructor")
client/src/index.css (global reset + shared .page layout class)
client/src/api.js    (shared API_BASE constant)
client/src/styles/forms.css (shared styling for Login/Signup forms)
client/src/pages/Home.jsx  (placeholder homepage, proves routing works)
client/src/pages/Login.jsx  (calls POST /api/auth/login, saves token+user to localStorage)
client/src/pages/Signup.jsx (calls POST /api/auth/register, redirects to /login on success)

--- This session ---
server/db/schema.sql   (now also includes instructor_profiles table — NOT YET RUN in pgAdmin, see checklist)
server/routes/auth.js  (register route now also inserts into instructor_profiles when role is 'instructor')
client/src/pages/Signup.jsx        (removed Student/Instructor role toggle — this page is student-only now, always sends role: "student"; added a link to /become-instructor for anyone who lands here by mistake)
client/src/pages/BecomeInstructor.jsx (NEW — instructor-only signup page. No role toggle, always sends role: "instructor". Fields: name, email, password, bio, phone, location. Posts to the real /api/auth/register, not the old imagined /api/instructors/signup.)
client/src/pages/BecomeInstructor.css (NEW — reuses Signup.css's layout/classes, overrides the indigo accent to the emerald "#10b981" already used for the teacher variant in Home.css, via a `.instructor-theme` wrapper class)
client/src/App.jsx     (added the /become-instructor route, which previously had a dead link pointing to it from Navbar/Home)

--- Synced this session (built previously, PROGRESS.md wasn't updated at the time) ---
client/src/components/StudentNav.jsx (NEW — dashboard-only nav for logged-in students, separate from the public Navbar which is for logged-out visitors)
client/src/components/StudentNav.css
client/src/pages/StudentDashboard.jsx (NEW — converted from Studentdashboard.jsx mockup. localStorage-guarded welcome screen with journey recap + two action cards. Does NOT show enrolled courses/progress here — that's deferred to My Courses instead.)
client/src/pages/StudentDashboard.css
client/src/App.jsx (added the /student-dashboard route)

--- This session ---
server/routes/courses.js (GET /api/courses now accepts an optional ?instructor_id= query param, so it can return just one instructor's own courses instead of always the full public list)
client/src/components/InstructorNav.jsx (NEW — dashboard-only nav for logged-in instructors, pulled out of the mockup's inline TeacherNav function)
client/src/components/InstructorNav.css
client/src/pages/InstructorDashboard.jsx (NEW — converted from the uploaded Instructordashboard.jsx mockup. localStorage-guarded welcome screen with 4 stat cards and 3 quick-action cards. Only "Active Courses" is wired to real data via GET /api/courses?instructor_id=<id>; the other three stats stay honest placeholders since there's no backend for them yet.)
client/src/pages/InstructorDashboard.css
client/src/App.jsx (added the /instructor-dashboard route)

--- Bugfix this session ---
client/src/pages/Login.jsx (was still sending instructors to "/" after login — leftover
  from before Instructor Dashboard existed. Now sends student → /student-dashboard,
  instructor → /instructor-dashboard, anything else → /.)

--- This session ---
client/src/components/InstructorNav.jsx (restyled to match StudentNav.jsx's layout —
  centered search bar, circular initial avatar on the right — instead of the mockup's
  original left-to-right row with a square avatar)
client/src/components/InstructorNav.css (rewritten to match)

--- This session ---
client/src/pages/InstructorWelcome.jsx (NEW — welcome page instructors land on right after
  login, before the real dashboard. Shows the teacher journey lifted as-is from Home.jsx's
  "Teacher's Path" tab, plus a link through to /instructor-dashboard.)
client/src/pages/InstructorWelcome.css (NEW — same layout as StudentDashboard.css's
  welcome+journey section, in the emerald palette Home.css already uses for the teacher
  journey variant)
client/src/App.jsx (added the /instructor-welcome route)
client/src/pages/Login.jsx (instructor login now goes to /instructor-welcome instead of
  straight to /instructor-dashboard)

--- This session ---
server/routes/enrollments.js (GET /api/enrollments/me now also joins users to return
  instructor_name, for My Courses to show a real instructor name)
client/src/pages/MyCourses.jsx (NEW — converted from the uploaded Mycourses.jsx mockup.
  Real enrollment data via GET /api/enrollments/me. Dropped course type/level/progress %/
  logo image — none exist in the schema. Reuses the existing StudentNav component instead
  of redefining it inline.)
client/src/pages/MyCourses.css
client/src/App.jsx (added the /mycourse route)

--- Branch 1: Profile menu dropdown ---
client/src/components/ProfileMenu.jsx (NEW — dropdown for the avatar in StudentNav/
  InstructorNav. Header with name/email, one real nav link by role, real Log out.
  Everything else from the Udemy reference screenshot left out — no backend/plan for it.)
client/src/components/ProfileMenu.css (NEW — matches the existing indigo avatar styling
  that used to live in StudentNav.css/InstructorNav.css directly)
client/src/components/StudentNav.jsx (swapped the plain non-clickable avatar div for
  <ProfileMenu user={user} />)
client/src/components/InstructorNav.jsx (same swap as StudentNav)
client/src/components/StudentNav.css (removed the now-unused .student-nav-avatar rules,
  moved into ProfileMenu.css)
client/src/components/InstructorNav.css (removed the now-unused .instructor-nav-avatar
  rules, same move)

--- This session ---
server/db/schema.sql (now also includes sessions table — doubt sessions / offline meets /
  mock tests, one table with a session_type CHECK column. Paste the SQL into pgAdmin's
  Query Tool and run it before building routes against it.)
server/routes/sessions.js (NEW — POST /api/sessions [instructor-only, must own the course],
  GET /api/sessions?course_id=<id> [public, requires course_id]; verified via Hoppscotch:
  201 on success, 403 when posting to another instructor's course, 400 on invalid
  session_type, 200 with the session listed on GET)
server/server.js (mounted the new session routes under /api/sessions)

--- This session ---
client/src/pages/StudentLanding.jsx (NEW — post-login landing page for students. Hero
  image + text only, no journey tabs/how-it-works/reviews. Course grid below the hero
  using the existing public GET /api/courses; each card shows title, instructor name,
  price, rating. Not yet clickable through to a real detail page.)
client/src/pages/StudentLanding.css (NEW)
client/src/App.jsx (added the /student-landing route)
client/src/pages/Login.jsx (student redirect changed from /student-dashboard to
  /student-landing)
client/src/components/StudentNav.jsx ("Explore" link changed from a dead <a href="#">
  to a real Link to /student-landing, with active-state highlighting)

--- This session ---
client/src/components/ProfileMenu.jsx (added a "Dashboard" link to the student section,
  pointing at /student-dashboard — that page became unreachable through normal navigation
  once Login.jsx started sending students to /student-landing instead)

--- This session ---
client/src/pages/Login.jsx (student redirect changed back from /student-landing to
  /student-dashboard — Dashboard is the post-login landing again, Student Landing is now
  the Explore Courses page instead)
client/src/pages/StudentDashboard.jsx (fixed the "Explore Courses" action card, which
  was linking to "/" — now links to /student-landing)

--- This session ---
server/routes/courses.js (added GET /api/courses/:id — public, returns one course's full
  info joined with instructor name, 404 if not found)
client/src/pages/CourseDetail.jsx (NEW — individual course view at /courses/:id. Fetches
  the course, its sessions [GET /api/sessions?course_id=], and its reviews [GET
  /api/reviews?course_id=] in parallel. Average rating is computed client-side from the
  fetched reviews since there's no avg_rating column anywhere in the schema. Enroll button
  calls POST /api/enrollments; checks GET /api/enrollments/me on load to show "Enrolled ✓"
  instead of re-offering enroll if the student already has. Not logged in → clicking Enroll
  sends to /login instead of failing. Page itself has no login guard, same public-browsing
  rule as Student Landing.)
client/src/pages/CourseDetail.css (NEW)
client/src/App.jsx (added the /courses/:id route)

--- Bugfix this session ---
client/src/index.css (global `body` font-family changed from `system-ui` to `'Source
  Sans 3', sans-serif` — every page's CSS already explicitly sets Montserrat for headings
  and Source Sans 3 for body text, but nothing had ever changed the *global default*, so
  any element left without its own font-family override — card titles, instructor names,
  etc. — was silently falling back to the OS's system font instead of matching everything
  around it. One-line fix, no per-page changes needed.)

--- This session ---
client/src/pages/ManageCourses.jsx (NEW — instructor Create/Manage Course page at
  /manage-courses. Form posts to POST /api/courses; list of the instructor's own courses
  via GET /api/courses?instructor_id=<id> [same route the Dashboard's "Active Courses"
  stat already uses]. New course is added straight into the list on success instead of
  re-fetching. No edit/delete — no backend route for that yet.)
client/src/pages/ManageCourses.css (NEW)
client/src/App.jsx (added the /manage-courses route)
client/src/components/InstructorNav.jsx ("Create Course" link changed from a dead
  <a href="#"> to a real Link to /manage-courses)
client/src/pages/InstructorDashboard.jsx ("Create Course" quick-action card is now
  clickable and navigates to /manage-courses; "Go Live"/"Schedule Offline" stay
  non-clickable, unchanged, since those still don't have any backend behind them)
client/src/pages/InstructorDashboard.css (added .instructor-dash-action-card--clickable
  for the cursor style on the now-clickable card)

--- This session ---
client/src/pages/CourseDetail.jsx (added a "Leave a review" form under the reviews list —
  star rating [1-5, click to select] + optional comment, POST /api/reviews. No
  "already reviewed" pre-check like Enroll has, since there's no matching GET endpoint
  and reviews don't come back with student_id to match against; a 409 from the backend is
  just treated the same as a successful submit — the form disappears either way, since
  there's nothing left for it to do.)
client/src/pages/CourseDetail.css (added styles for the star-rating input, review form,
  and login/role gating messages)
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
- **Split student vs instructor signup into two separate pages instead of one form with a
  role toggle.** `Signup.jsx` = students only (linked from Navbar "Signup" and Home's
  "Start Learning"). `BecomeInstructor.jsx` = instructors only (linked from Navbar "Become
  Instructor" and Home's "For Teachers" card). Reasoning: a single form with a toggle made
  it too easy to end up on the wrong role by accident; two dedicated pages is clearer UX,
  and each page cross-links to the other for anyone who lands on the wrong one.
- Because instructors need extra fields (bio, phone, location) that students don't, and the
  `users` table intentionally doesn't carry those columns for every row, added a separate
  **`instructor_profiles`** table (`user_id` primary key + foreign key to `users`, one row
  per instructor) instead of adding nullable columns to `users`. `POST /api/auth/register`
  now inserts into it when `role === 'instructor'`.
- `BecomeInstructor.jsx` gets its own `BecomeInstructor.css` rather than reusing Signup.css
  as-is — it imports Signup.css for the shared layout/classes, then overrides just the
  accent color to emerald (`#10b981`) via a `.instructor-theme` wrapper class, matching the
  teacher color already established in `Home.css` (`journey-track--teacher`,
  `how-card-btn--teacher`) instead of inventing a new color.
- Confirmed Become Instructor works end-to-end (form → register → instructor_profiles row
  → redirect to login) — closes out that piece of the frontend checklist.
- Frontend checklist restructured into a **named branch** ("Dashboards & course pages")
  once 3 more mockup pages arrived (`Studentdashboard.jsx`, `Instructordashboard.jsx`,
  `Mycourses.jsx`), each with a sub-checklist of what needs to change from mockup-imagined
  data to real backend calls — same pattern already proven with Become Instructor, so
  future sessions don't re-litigate "should this hit the real API" per page.
- Student Dashboard reads role from the existing `user` object in localStorage rather than
  a separate `role` key, since Login.jsx already stores the whole user object and a second
  key risks going out of sync with it.
- Student Dashboard drops the mockup's "location" field — /api/auth/login never returns a
  location, even for instructors, so it would just render "undefined".
- Student Dashboard uses a dedicated StudentNav component instead of the public Navbar —
  Navbar shows Login/Signup buttons meant for logged-out visitors and made this page look
  identical to the homepage in an earlier draft.
- Enrolled courses + progress were NOT put on Student Dashboard despite the checklist
  wording implying they'd live there — deferred entirely to the My Courses page instead,
  keeping Student Dashboard a simple welcome/navigation screen.
- Reminder: PROGRESS.md must be updated at the end of every session that changes the repo —
  this sync happened because a previous session's updates were never pasted back in.
- `GET /api/courses` extended with an optional `?instructor_id=` filter rather than adding
  a brand-new route — same endpoint, same shape of response, just a narrower WHERE clause
  when the param is present. Kept as one query built with a ternary rather than duplicating
  the whole route as `GET /api/courses/mine`.
- Instructor Dashboard reads role from the existing `user` object in localStorage (same fix
  as Student Dashboard) instead of the mockup's separate `role` key.
- Dropped `user.location` and the whole "Your Bio" section from Instructor Dashboard —
  `/api/auth/login` only ever returns `{ id, name, email, role }`, never bio/phone/location
  (those live in `instructor_profiles`, which login doesn't join to), so both would only
  ever show "undefined" or silently never render.
- Of the four stat cards, only Active Courses is wired to a real number (instructor's own
  course count via the new `instructor_id` filter). Total Students, Total Earnings, and
  Avg. Rating stay as honest placeholders ("0"/"0"/"—") rather than faked numbers — none of
  enrollment-counting-per-instructor, earnings, or rating aggregation exist on the backend
  yet. Flagged as follow-up work, not built now.
- Quick Action cards (Create Course / Go Live / Schedule Offline) stay non-clickable, same
  as the mockup — Create Course has no real page to link to yet (that's still an unchecked
  checklist item), and the other two depend on features that don't exist at all.
- Pulled the mockup's inline `TeacherNav()` function out into its own `InstructorNav.jsx`
  component, matching the `StudentNav.jsx` pattern, so any future instructor-only page
  (e.g. Create/Manage Course) can reuse it instead of redefining the same header again.
- Instructor Dashboard's three quick-action cards use one flat indigo background instead of
  the mockup's three different pastel colors — simpler, and moot anyway since none of the
  cards do anything yet.
- InstructorNav restyled to match StudentNav's layout (centered search bar, circular
  initial avatar) instead of keeping the mockup's own left-to-right row with a square
  avatar — one consistent look across both logged-in navs rather than two different ones.
- Added an **Instructor Welcome** page (`/instructor-welcome`) as a new piece not in the
  original mockup set — instructors now land here right after login instead of straight on
  the stats dashboard, matching how Student Dashboard already gives students a
  welcome+journey screen before My Courses. Journey steps/markup copied as-is from Home.jsx's
  "Teacher's Path" tab (same `teacherSteps` data, same track/node/badge structure) rather
  than inventing new copy, styled in the same emerald palette Home.css already uses for
  that tab. `Login.jsx` now sends instructors to `/instructor-welcome`, which links onward
  to `/instructor-dashboard`.
- Instructor Welcome's link through to the dashboard is a proper "Continue to Your
  Dashboard" section (heading + subtitle + a solid emerald pill button labeled "Go to
  Dashboard"), matching the visual weight of Student Dashboard's action-cards section,
  instead of a plain inline text link.
- `GET /api/enrollments/me` extended with one more join (`users`) to return
  `instructor_name` — same kind of small additive backend change as the `instructor_id`
  filter on `GET /api/courses`, not a new endpoint.
- My Courses drops course type (Hybrid/Online), skill level, and per-course progress % —
  none of these exist anywhere in the schema, so showing them would mean making up data.
  The open question about whether `progress` is worth a real schema addition is still
  unresolved, carried forward as follow-up work rather than blocking this piece.
- My Courses' card image band (mockup used a per-course tech logo image) replaced with a
  plain colored circle showing the course title's first letter, since there's no per-course
  icon data to show instead.
- My Courses reuses the existing `StudentNav` component instead of redefining the same
  header inline again like the mockup did — same reasoning as Student Dashboard extracting
  it in the first place.
- Checklist split into **Branch 0** (the existing main-line order) and **Branch 1** (a
  named side quest that jumps the queue) instead of just inserting the new work wherever —
  keeps the original order intact to resume once the side quest is done, same spirit as
  the earlier "Branch: Dashboards & course pages" naming.
- **ProfileMenu is one shared component**, not two separate dropdowns for student/
  instructor — StudentNav and InstructorNav already use the exact same indigo avatar
  styling (`#6366f1`), so a `user.role` check inside one component picks the one different
  link (My Courses vs Instructor Dashboard) instead of duplicating the whole dropdown.
- Profile menu only wires items that go somewhere real: the role-based nav link and Log
  out. Everything else in the Udemy reference screenshot (cart, wishlist, notifications,
  messages, settings, payment methods, subscriptions, credits, purchase history, language,
  help) was dropped rather than shown as non-clickable placeholders, because — unlike the
  Instructor Dashboard stat cards, which are on the actual roadmap — none of these have any
  planned backend or schema support at all.
- Log out is the first place `localStorage`'s `token`/`user` keys get cleared — previous
  sessions only ever wrote them (Login) or read them (dashboard guards), never removed
  them.
- `sessions` table uses one table with a `session_type` CHECK ('doubt'/'offline'/
  'mock_test') instead of three separate tables — all three share the same shape (course +
  scheduled_at + optional location/description), same reasoning as reusing `users.role`
  instead of splitting students/instructors into two tables.
- No separate `instructor_id` column on `sessions` — it's derivable via
  `sessions.course_id` → `courses.instructor_id`, so it isn't duplicated.
- `location` on `sessions` is nullable since only offline-type sessions need it; doubt
  sessions and mock tests leave it blank.
- Table only, no routes yet — same as how `instructor_profiles` was table-only before its
  route logic (in `auth.js`) came in a later session. `server/routes/sessions.js` is
  follow-up work, not built this session.
- `server/routes/sessions.js`: POST checks `session_type` against the same three allowed
  values as the DB's CHECK constraint, BEFORE inserting — so a bad value gets a clear
  400 error instead of a raw Postgres error bubbling up. Same "validate early" pattern as
  reviews.js checking rating 1-5.
- POST /api/sessions looks up the course first and compares `courses.instructor_id` to
  `req.user.id` before inserting — an instructor can only add sessions to courses they
  own, not any course on the platform. `requireRole('instructor')` alone isn't enough
  since it only checks the *role*, not *which* instructor.
- GET /api/sessions requires `?course_id=` (unlike GET /api/courses, which allows browsing
  everything) — there's no "show every session on the platform" use case yet, only
  "show this course's sessions", so the simpler required-param version was built instead.
- No PUT/DELETE (edit/cancel a session) yet — kept to the same two routes (create + list)
  as every other table's first pass (courses, enrollments, reviews all started this way).
- Course Detail: added a real `GET /api/courses/:id` route instead of filtering the list
  already fetched on Student Landing — the detail page needs to work if someone opens the
  URL directly (shared link, refresh) without having visited Explore first, and every other
  resource in this app already gets its own single-item semantics for free via SQL `WHERE`.
- Average rating on Course Detail is computed client-side from the reviews array (`GET
  /api/reviews?course_id=`) instead of a stored `avg_rating` — no such column exists
  anywhere in the schema, and adding one now would mean keeping it in sync on every
  insert/delete for a number that's cheap to compute on the fly from data already being
  fetched for the reviews section anyway.
- Enroll button reuses `GET /api/enrollments/me` (already built for My Courses) to check
  whether the viewing student is already enrolled, instead of adding a new
  "am I enrolled in this one course" endpoint — one extra `.some()` on data already needed
  elsewhere beats a new backend route for the same fact.
- Course Detail page has no login guard (same rule as Student Landing) — browsing a
  course's public info doesn't require an account. Only clicking Enroll checks for a
  token, and sends logged-out visitors to /login instead of the page refusing to render.
- Global body font switched from `system-ui` to `'Source Sans 3'` (`index.css`) — every
  page already explicitly set Montserrat/Source Sans 3 on its own headings and paragraphs,
  but any element without its own override (card titles, instructor names, meta text) was
  inheriting the OS default instead, which looked inconsistent within the same card/page.
  Fixed once at the root instead of patching font-family onto every individual element
  across every page's CSS file.
- Manage Courses page treats "manage" as create + view-your-own-list only, matching what
  the backend actually supports right now (POST + GET, no PUT/DELETE on courses) — same
  "don't scaffold ahead" rule already applied to sessions not getting edit/cancel routes.
  A visible note on the page says editing/deleting isn't available yet, instead of adding
  dead buttons for it.
- Fixed two more dead links while building this, same bug pattern as the earlier
  Explore-Courses-linking-to-"/" fix: InstructorNav's "Create Course" was a `<a href="#">`,
  and the Dashboard's "Create Course" quick-action card was non-clickable entirely. Both
  now point at /manage-courses.
- Reviews UI was built into Course Detail rather than a separate page — there's no
  standalone "review this course" flow anywhere else in the app (mockups never had one),
  and the reviews list it's attached to already lives there.
- No pre-check for "have I already reviewed this course" before showing the form (unlike
  Enroll, which checks GET /api/enrollments/me first) — there's no equivalent endpoint,
  and GET /api/reviews doesn't return student_id to match locally against the logged-in
  user. Simpler to just let the student submit and treat the backend's 409 the same as a
  successful submit, since the end state (form replaced by a message) is identical either
  way.
- Rating input is five plain clickable ★ buttons (click one to set 1-5) instead of a star
  library or hover-preview interaction — simplest possible thing that lets a beginner see
  exactly what state (`reviewRating`) drives which star fills in.

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
- When pushing to GitHub, double check server/.env.example keeps its leading dot and
  that no stray duplicate copy gets committed (this happened once already).
- Watch out for accidentally nested folders (e.g. server/server) if re-extracting zip files —
  always confirm with "dir" that package.json is in your current folder before running npm commands.

--- Carried from this session ---
- Become Instructor is now fully confirmed working end-to-end: instructor_profiles table
  created in pgAdmin, register route tested with role: "instructor" + bio/phone/location,
  /become-instructor route in the browser confirmed (form submit → redirect to /login).
- Fixed along the way: App.jsx locally was missing the BecomeInstructor import/route
  (blank white page on /become-instructor) — make sure you're editing the same App.jsx
  Claude gives you each session, not an older saved copy.
- src.rar (uploaded this session) contains 3 more mockup pages not yet built:
  Studentdashboard.jsx, Instructordashboard.jsx, Mycourses.jsx — see the new
  "Branch: Dashboards & course pages" section in the checklist above for build order and
  what each one needs translated from mockup to real backend calls.
- Open question to settle before/during Student Dashboard or My Courses: is course
  "progress" (% complete) worth a real schema addition now, or a placeholder to skip for
  later? Both those mockups show a progress bar with no backing data yet. Still unresolved.
- Next piece: Student Dashboard (first item in the new dashboards branch).

--- Carried from this session ---
- `sessions` table + routes fully verified: table created in pgAdmin, and
  server/routes/sessions.js tested via Hoppscotch — POST 201 (own course), POST 403
  (someone else's course), POST 400 (invalid session_type), GET 200 (session listed by
  course_id). Backend foundation checklist section is now fully checked off.
- Next piece: "Course browse + detail pages" (frontend, no mockup yet, uses the existing
  public GET /api/courses).

--- Carried from this session ---
- Created StudentLanding.jsx as the new post-login landing page for students. Instead of
  going straight to Student Dashboard (stats), students now see StudentNav + hero + a grid
  of all available courses they can explore. This replaces the previous flow where
  login → /student-dashboard; Student Dashboard itself wasn't deleted, it's just no longer
  the default destination.
- StudentNav's "Explore" link is now a real Link to /student-landing (previously just
  <a href="#">).
- "Explore" link highlights with active state when the user is on student-landing, same
  pattern as "My Courses" highlighting on /mycourse.
- Course grid uses GET /api/courses (already exists) — each card shows title, instructor
  name, price, and rating. Cards are clickable but don't navigate yet (course detail page
  is next).
- Next piece: "Course Browse + Detail Pages" — individual course view with full
  description, sessions, reviews, and enrollment button.
- Student Dashboard became unreachable through normal navigation once Login.jsx started
  sending students to /student-landing instead — StudentNav's Explore/My Courses links
  never pointed to it either. Fixed by adding a "Dashboard" link to ProfileMenu.jsx's
  student section (next to "My Courses"), so the page stays reachable via the avatar
  dropdown instead of only by typing the URL directly.

--- Carried from this session ---
- Reconsidered which page should be the post-login landing spot for students. Student
  Dashboard (welcome + journey recap + two action cards) makes a better first landing
  than jumping straight into a course grid — so Login.jsx's student redirect was changed
  back from /student-landing to /student-dashboard.
- Student Landing is now purpose-built as the "Explore Courses" page instead of the
  landing page — same file/route (/student-landing), just a different role in the flow.
  Reached via StudentNav's "Explore" link (visible on every student page including the
  Dashboard) or via the Dashboard's own "Explore Courses" action card.
- Fixed a pre-existing bug while doing this: Student Dashboard's "Explore Courses" card
  linked to "/" (the public homepage, logged-out Navbar) instead of anywhere useful for a
  logged-in student. Now points to /student-landing.
- ProfileMenu.jsx's student "Dashboard" link (added last session) is no longer strictly
  necessary since login lands there directly again, but kept anyway as a quick way back
  to the Dashboard from other pages like My Courses or the Explore page.

--- Carried from this session ---
- Course Detail page built: `CourseDetail.jsx` at `/courses/:id`, so the Explore page's
  course cards (which already called `navigate(...)`) now actually go somewhere. Shows
  full description, sessions, reviews, and an Enroll button.
- Backend gained one new route: `GET /api/courses/:id` (public, 404 if missing).
- Enroll button: POST /api/enrollments, pre-checks GET /api/enrollments/me to show
  "Enrolled ✓" instead of re-enrolling, sends logged-out visitors to /login.
- Average rating shown is computed from the fetched reviews list — flagging again (same
  open item as MyCourses) that there's no schema support for a stored rating/progress
  figure; still fine since it's cheap to compute from data already being fetched.
- Next piece: "Create/manage course page (instructor)" — no mockup yet, uses the existing
  POST /api/courses (instructor-only, already built).

--- Carried from this session ---
- Manage Courses page built: `ManageCourses.jsx` at `/manage-courses` — create-course
  form (POST /api/courses) + list of the instructor's own courses (GET /api/courses
  ?instructor_id=). No edit/delete yet since there's no backend route for that.
- Fixed two dead links that pointed nowhere: InstructorNav's "Create Course" nav link, and
  the Dashboard's "Create Course" quick-action card — both now go to /manage-courses.
- Next piece: "Reviews UI" — no mockup yet, uses the existing review routes
  (POST /api/reviews, GET /api/reviews?course_id=).

--- Carried from this session ---
- Reviews UI built into `CourseDetail.jsx` — a star-rating (1-5, click to select) +
  optional comment form under the existing reviews list, posting to the existing
  POST /api/reviews. No "already reviewed" pre-check (no matching endpoint exists); a
  409 from the backend is treated the same as a successful submit.
- This closes out the entire main frontend checklist branch — everything under "Frontend
  (screen by screen)" is now checked off. What's left is the late-stage geolocation
  feature (intentionally saved for last, per the project's own plan) and the final
  testing/polish pass.
- Next piece: "Geolocation / 'nearby instructors'" — backend query + frontend UI. Worth
  deciding at the start of that session: what "nearby" means for a query (bounding box vs.
  full Haversine distance calc) and whether location is entered as an address (needs
  geocoding) or raw lat/lng (simpler, no geocoding dependency) for a first pass.
```

---

## Phase 2

### Session Rules

- **Session counter:** track how many sessions have worked on Phase 2 (see counter below). Increment by 1 at the start of every new Phase 2 session.
- **At the start of every new session**, ask the user which branch they're working on this session (e.g. `Main` or `InstructorFunctionalities`).
  - If the user says **Main**, then every entry added to that session's "Files Created So Far" must mention the branch name in brackets, e.g. `client/src/pages/Foo.jsx (Main)`.
  - If the branch chosen has **no tasks currently listed** in its checklist, ask the user which task(s) they want to work on before starting, and add them to that branch's checklist. This applies to any branch, not just one in particular.

**Session counter:** 1

### Branch Main

Carried over from Phase 1 — unfinished/open items, not yet started or not fully resolved.

#### Checklist

**Late-stage differentiator**
- [ ] Geolocation / "nearby instructors" — backend query + frontend UI

**Testing & polish**
- [ ] Basic backend tests
- [ ] Manual QA pass, loading/error states

**Open items carried forward (checked off in Phase 1 but not fully resolved)**
- [ ] Decide whether `progress` (course completion %) gets a real schema column, or stays dropped for good
- [ ] Instructor Dashboard: wire up Total Students, Total Earnings, Avg. Rating (currently hardcoded placeholders — only Active Courses is real)
- [ ] Courses: add edit/delete (PUT/DELETE) — Manage Courses is currently create + view only
- [ ] Sessions: add edit/cancel routes — currently create + list only
- [ ] Reviews: add an "already reviewed" pre-check before showing the review form (no matching GET endpoint exists yet; a duplicate submit currently just silently no-ops on the backend's 409)

### Branch InstructorFunctionalities

#### Checklist

- (none yet)

### Branch InstructorUI

#### Checklist

- [x] "My Courses" (instructor) should show only the courses this instructor has created —
      not a combined create-form + list page.
- [x] Add a "Create Course" button on that page (the actual create-course page is a future
      piece — button is a placeholder for now, not wired to a route yet).

### Files Created So Far

```
client/src/pages/ManageCourses.jsx (rewritten — dropped the inline "Create a New Course"
  form. Page now shows only the instructor's own courses list, renamed heading to
  "My Courses", plus a placeholder "+ Create Course" button — not wired to a route yet,
  since the dedicated create-course page doesn't exist. Follows the same "don't fake it"
  pattern already used elsewhere in this repo, e.g. Instructor Dashboard's non-clickable
  Go Live/Schedule Offline cards.)
client/src/pages/ManageCourses.css (removed the now-unused create-form styles; added
  styles for the placeholder Create Course button)
client/src/components/InstructorNav.jsx ("Create Course" nav link relabeled to
  "My Courses" — still points at /manage-courses, since that route is now a courses list
  instead of a create form)
```

### Decisions Log

- Kept the route as `/manage-courses` rather than renaming it, since renaming would touch
  every other link that already points there (InstructorNav, InstructorDashboard's
  quick-action card) — only the page's content and the nav label changed, not the URL.
- The "Create Course" button on this page is intentionally non-functional (no route to
  send it to yet) rather than linking to `/manage-courses` again — that would be circular
  since this page already is Manage Courses now. The real create-course page is future
  work.

### Known Issues / TODO Carried Between Sessions

```
- Create Course page doesn't exist yet — the button on My Courses (instructor) is a
  placeholder. Next InstructorUI piece: build the actual create-course page and wire the
  button to it.
```

---

## 5. Session Prompt (copy-paste this each time)

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
5. Phase 2 session rules:
   - Increment the "Session counter" under Phase 2 by 1 at the start of this session.
   - Ask me which branch I'm working on this session (e.g. `Main` or `InstructorFunctionalities`).
   - If I say `Main`, every entry added to this session's "Files Created So Far" must mention
     the branch name in brackets, e.g. `client/src/pages/Foo.jsx (Main)`.
   - If the branch I choose has no tasks currently listed in its checklist, ask me which
     task(s) I want to work on before starting, and add them to that branch's checklist.
     This applies to any branch, not just one in particular.
6. When done, give me:
   - the new/changed files (as a diff or full files, whichever is clearer for a beginner to apply)
   - the exact text to paste into PROGRESS.md's "Files Created So Far", "Decisions Log",
     "Repo layout", and checklist (with the box ticked) before my next session.
   - if notes were generated this session, update the "Notes chapter tracking" line for
     whichever track (backend/frontend) was used.
```
