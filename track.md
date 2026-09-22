# Cloud Deployment Tracker

### Strategy 3: Cloud Deployment (Vercel + Render + Neon)

#### Checklist

- [x] **Step 1: Code Adjustments for Cloud** — dynamic PORT, DB SSL support, start script, and dynamic `VITE_API_BASE`.
- [ ] **Step 2: Commit & Push changes to GitHub** — push the updated code so Render and Vercel can pull it.
- [ ] **Step 3: Cloud Database Setup (Neon.tech)** — create free PostgreSQL instance, run `schema.sql` and `nearby-demo-seed2.sql`, copy connection string.
- [ ] **Step 4: Backend Deployment (Render.com)** — create Web Service on Render, connect GitHub repo, configure `DATABASE_URL` & `JWT_SECRET`, verify `/api/health`.
- [ ] **Step 5: Frontend Deployment (Vercel)** — import repo to Vercel, set root to `client`, configure `VITE_API_BASE` pointing to Render, deploy.
- [ ] **Step 6: End-to-End Testing & Examiner Prep** — test live site authentication, course operations, nearby instructors geolocation, and pre-warm backend.
