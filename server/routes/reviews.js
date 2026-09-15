// routes/reviews.js
// Two routes: a student leaves a review for a course, and anyone can
// browse the reviews for a specific course.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/reviews
// Body: { course_id, rating, comment }
// Only students can leave reviews.
router.post('/', requireAuth, requireRole('student'), async (req, res) => {
  const { course_id, rating, comment } = req.body;

  if (!course_id || !rating) {
    return res.status(400).json({ error: 'course_id and rating are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO reviews (student_id, course_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       RETURNING id, student_id, course_id, rating, comment, created_at`,
      [req.user.id, course_id, rating, comment]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    // 23505 = unique constraint violated (this student already reviewed this course)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You have already reviewed this course' });
    }
    // 23503 = foreign key violated (course_id doesn't match a real course)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'That course does not exist' });
    }
    // 23514 = check constraint violated (rating outside 1-5)
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong submitting the review' });
  }
});

// GET /api/reviews?course_id=<id>
// Public — anyone can browse reviews for a course, no login needed.
router.get('/', async (req, res) => {
  const { course_id } = req.query;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id query parameter is required' });
  }

  try {
    const result = await db.query(
      `SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at,
              users.name AS student_name
       FROM reviews
       JOIN users ON users.id = reviews.student_id
       WHERE reviews.course_id = $1
       ORDER BY reviews.created_at DESC`,
      [course_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching reviews' });
  }
});

module.exports = router;
