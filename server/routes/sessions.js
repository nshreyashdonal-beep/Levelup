// routes/sessions.js
// Two routes: an instructor creates a session for one of their own courses
// (doubt session / offline meet / mock test), and anyone can view the
// upcoming sessions for a course (same "public browsing" rule as courses).

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// The only three values session_type is allowed to be — matches the
// CHECK constraint on the sessions table in schema.sql. Checked here too
// so we can send back a clear error instead of letting Postgres reject it.
const SESSION_TYPES = ['doubt', 'offline', 'mock_test'];

// POST /api/sessions
// Requires: logged in AND role = 'instructor'
// Body: { course_id, session_type, title, description, scheduled_at, location }
// Only the instructor who OWNS the course can add a session to it — checked
// below by comparing courses.instructor_id to req.user.id.
router.post('/', requireAuth, requireRole('instructor'), async (req, res) => {
  const { course_id, session_type, title, description, scheduled_at, location } = req.body;

  if (!course_id || !session_type || !title || !scheduled_at) {
    return res.status(400).json({
      error: 'course_id, session_type, title, and scheduled_at are required',
    });
  }

  if (!SESSION_TYPES.includes(session_type)) {
    return res.status(400).json({
      error: `session_type must be one of: ${SESSION_TYPES.join(', ')}`,
    });
  }

  try {
    // Look up the course first so we can check it exists AND belongs to
    // this instructor, before inserting anything.
    const courseResult = await db.query(
      'SELECT instructor_id FROM courses WHERE id = $1',
      [course_id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(400).json({ error: 'That course does not exist' });
    }

    if (courseResult.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only add sessions to your own courses' });
    }

    const result = await db.query(
      `INSERT INTO sessions (course_id, session_type, title, description, scheduled_at, location)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, course_id, session_type, title, description, scheduled_at, location, created_at`,
      [course_id, session_type, title, description, scheduled_at, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong creating the session' });
  }
});

// GET /api/sessions?course_id=5
// No auth needed — anyone can see a course's scheduled sessions, same as
// browsing courses. course_id is required (unlike GET /api/courses, there's
// no "show every session ever" use case yet).
router.get('/', async (req, res) => {
  const { course_id } = req.query;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id query param is required' });
  }

  try {
    const result = await db.query(
      `SELECT id, course_id, session_type, title, description, scheduled_at, location, created_at
       FROM sessions
       WHERE course_id = $1
       ORDER BY scheduled_at ASC`,
      [course_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching sessions' });
  }
});

module.exports = router;
