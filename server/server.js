// server.js
// The starting point of our backend. /api/health now also checks that
// the database connection actually works, not just that the server runs.

const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

// Lets a separate frontend (running on a different port later) call this API.
app.use(cors());

// Lets Express read JSON request bodies (req.body) — needed for register/login.
app.use(express.json());

// All auth routes live under /api/auth (e.g. /api/auth/register, /api/auth/login)
app.use('/api/auth', authRoutes);

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
