// routes/auth.js
// Two routes: register (create a new user) and login (check password,
// hand back a token). Kept as plain functions in one file — no
// controllers/services split, that's overkill for two routes.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();

// POST /api/auth/register
// Body: { name, email, password, role }  (role is optional, defaults to 'student')
// If role is 'instructor', also accepts { bio, phone, location, latitude,
// longitude } and saves them into instructor_profiles — students never
// send/see these. latitude/longitude come from the signup form's
// "Locate Yourself" button (browser Geolocation API) and are optional —
// an instructor can still register if they skip or deny that prompt.
router.post('/register', async (req, res) => {
  const { name, email, password, role, bio, phone, location, latitude, longitude } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  try {
    // Never store the real password — only a hashed version.
    // The "10" is the hashing cost; 10 is a normal default.
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, COALESCE($4, 'student'))
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    const newUser = result.rows[0];

    // Only instructors get a profile row, and only if they actually
    // sent profile fields (BecomeInstructor.jsx always does).
    if (newUser.role === 'instructor') {
      // Column is named `city` in the DB (renamed from `location` in
      // Branch 5 — see schema.sql) but the request body / form field is
      // still called `location` for now, so this stays a straight pass-through.
      // latitude/longitude default to null if the instructor skipped or
      // denied the location prompt — the column allows nulls on purpose.
      await db.query(
        `INSERT INTO instructor_profiles (user_id, bio, phone, city, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [newUser.id, bio || null, phone || null, location || null, latitude || null, longitude || null]
      );
    }

    res.status(201).json(newUser);
  } catch (err) {
    // Postgres error code 23505 = unique constraint violation (duplicate email).
    if (err.code === '23505') {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }
    res.status(500).json({ error: 'Something went wrong creating the account' });
  }
});

// POST /api/auth/login
// Body: { email, password }
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Same error for "no such user" and "wrong password" — don't tell
    // an attacker which one it was.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Token proves who the user is on future requests, without
    // sending their password every time. Expires in 7 days here.
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong logging in' });
  }
});

module.exports = router;
