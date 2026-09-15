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
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

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

    res.status(201).json(result.rows[0]);
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
