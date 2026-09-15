// routes/enrollments.js
// Two routes: a student enrolls in a course, and a student views their
// own list of enrolled courses.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/enrollments
// Body: { course_id }
// Only students can enroll (an instructor enrolling in their own course
// doesn't make sense for this app, so it's kept simple and restricted).
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const { course_id } = req.body;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO enrollments (student_id, course_id)
       VALUES ($1, $2)
       RETURNING id, student_id, course_id, enrolled_at`,
      [req.user.id, course_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 23505 = unique constraint violated (this student already enrolled in this course)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You are already enrolled in this course' });
    }
    // 23503 = foreign key violated (course_id doesn't match a real course)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'That course does not exist' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong enrolling in the course' });
  }
});

// GET /api/enrollments/me
// Returns the logged-in student's own enrollments, with course details joined in.
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT enrollments.id, enrollments.enrolled_at,
              courses.id AS course_id, courses.title, courses.price
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       WHERE enrollments.student_id = $1
       ORDER BY enrollments.enrolled_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching your enrollments' });
  }
});

module.exports = router;
