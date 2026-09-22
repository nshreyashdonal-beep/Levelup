// server.js
// The starting point of our backend. /api/health now also checks that
// the database connection actually works, not just that the server runs.

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const moduleRoutes = require('./routes/modules');
const lectureRoutes = require('./routes/lectures');
const enrollmentRoutes = require('./routes/enrollments');
const reviewRoutes = require('./routes/reviews');
const sessionRoutes = require('./routes/sessions');
const instructorRoutes = require('./routes/instructors');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Lets a separate frontend (running on a different port later) call this API.
app.use(cors());

// Lets Express read JSON request bodies (req.body) — needed for register/login.
app.use(express.json());

// All auth routes live under /api/auth (e.g. /api/auth/register, /api/auth/login)
app.use('/api/auth', authRoutes);

// All course routes live under /api/courses (e.g. POST /api/courses, GET /api/courses)
app.use('/api/courses', courseRoutes);

// All module routes live under /api/modules (e.g. POST /api/modules/:id/lectures)
app.use('/api/modules', moduleRoutes);

// All lecture routes live under /api/lectures (e.g. PATCH /api/lectures/:id)
app.use('/api/lectures', lectureRoutes);

// All enrollment routes live under /api/enrollments
app.use('/api/enrollments', enrollmentRoutes);

// All review routes live under /api/reviews
app.use('/api/reviews', reviewRoutes);

// All session routes live under /api/sessions
app.use('/api/sessions', sessionRoutes);

// Public instructor discovery routes, including nearby instructors.
app.use('/api/instructors', instructorRoutes);

// Temporary test route to prove the middleware works — remove once real
// protected routes (courses, etc.) exist to test against instead.
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ loggedInAs: req.user });
});

// A "health check" route — visiting this tells you the server is alive
// AND whether it can currently reach Postgres.
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    // We still respond 200 here (the server itself is fine) but flag the DB issue.
    res.json({ status: 'ok', db: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
