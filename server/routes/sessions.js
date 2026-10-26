// routes/sessions.js
// Session management routes:
// 1. Instructor creates, reschedules, or cancels sessions for their own courses
//    (in-person labs, doubt sessions, mock tests).
// 2. Anyone can view upcoming sessions for a specific course.
// 3. Enrolled students can fetch upcoming sessions across all their enrolled courses.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// The only three values session_type is allowed to be — matches the
// CHECK constraint on the sessions table in schema.sql.
const SESSION_TYPES = ['doubt', 'offline', 'mock_test'];

// GET /api/sessions/enrolled
// Authenticated route: Returns all upcoming scheduled sessions across all courses
// the logged-in student is enrolled in, sorted by earliest scheduled_at.
router.get('/enrolled', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.course_id, s.session_type, s.title, s.description,
              s.scheduled_at, s.location, s.created_at,
              c.title AS course_title, c.delivery_mode, c.thumbnail_url,
              u.name AS instructor_name,
              ip.city AS instructor_city
       FROM sessions s
       JOIN courses c ON c.id = s.course_id
       JOIN enrollments e ON e.course_id = c.id
       JOIN users u ON u.id = c.instructor_id
       LEFT JOIN instructor_profiles ip ON ip.user_id = c.instructor_id
       WHERE e.student_id = $1
         AND s.scheduled_at >= NOW() - INTERVAL '3 hours'
       ORDER BY s.scheduled_at ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching enrolled student sessions:', err);
    res.status(500).json({ error: 'Failed to load upcoming sessions' });
  }
});

// POST /api/sessions
// Requires: logged in AND role = 'instructor'
// Body: { course_id, session_type, title, description, scheduled_at, location }
// Only the instructor who OWNS the course can add a session to it.
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
    console.error('Error creating session:', err);
    res.status(500).json({ error: 'Something went wrong creating the session' });
  }
});

// PATCH /api/sessions/:id
// Requires: logged in AND role = 'instructor'
// Updates session details (title, description, session_type, scheduled_at, location)
// Verifies that the session belongs to a course owned by the requesting instructor.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { session_type, title, description, scheduled_at, location } = req.body;

  try {
    const existing = await db.query(
      `SELECT s.id, s.course_id, c.instructor_id
       FROM sessions s
       JOIN courses c ON c.id = s.course_id
       WHERE s.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (existing.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit sessions for your own courses' });
    }

    if (session_type && !SESSION_TYPES.includes(session_type)) {
      return res.status(400).json({
        error: `session_type must be one of: ${SESSION_TYPES.join(', ')}`,
      });
    }

    const result = await db.query(
      `UPDATE sessions
       SET session_type = COALESCE($1, session_type),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           scheduled_at = COALESCE($4, scheduled_at),
           location = COALESCE($5, location)
       WHERE id = $6
       RETURNING id, course_id, session_type, title, description, scheduled_at, location, created_at`,
      [session_type || null, title || null, description !== undefined ? description : null, scheduled_at || null, location !== undefined ? location : null, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/sessions/:id
// Requires: logged in AND role = 'instructor'
// Cancels/removes a scheduled session if owned by the requesting instructor.
router.delete('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db.query(
      `SELECT s.id, s.course_id, c.instructor_id
       FROM sessions s
       JOIN courses c ON c.id = s.course_id
       WHERE s.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (existing.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel sessions for your own courses' });
    }

    await db.query('DELETE FROM sessions WHERE id = $1', [id]);
    res.json({ message: 'Session canceled successfully', id });
  } catch (err) {
    console.error('Error deleting session:', err);
    res.status(500).json({ error: 'Failed to cancel session' });
  }
});

// GET /api/sessions?course_id=...
// Public route: Returns all scheduled sessions for a course, sorted by earliest scheduled_at.
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
    console.error('Error fetching course sessions:', err);
    res.status(500).json({ error: 'Something went wrong fetching sessions' });
  }
});

module.exports = router;
