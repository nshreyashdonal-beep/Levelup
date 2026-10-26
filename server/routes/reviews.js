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
    // Verify that the student is actually enrolled in this course
    const enrollmentCheck = await db.query(
      'SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2',
      [req.user.id, course_id]
    );

    if (enrollmentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You must be enrolled in this course to leave a review' });
    }

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
// If a course is cloned or created from a previous edition (parent_course_id)
// and has 0 direct reviews, returns reviews from the previous course with
// is_from_previous_course = true.
router.get('/', async (req, res) => {
  const { course_id } = req.query;

  if (!course_id) {
    return res.status(400).json({ error: 'course_id query parameter is required' });
  }

  try {
    const directResult = await db.query(
      `SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at,
              users.name AS student_name,
              false AS is_from_previous_course
       FROM reviews
       JOIN users ON users.id = reviews.student_id
       WHERE reviews.course_id = $1
       ORDER BY reviews.created_at DESC`,
      [course_id]
    );

    if (directResult.rows.length > 0) {
      return res.json(directResult.rows);
    }

    // Check if course has a parent_course_id to inherit reviews from
    const courseCheck = await db.query(
      `SELECT courses.parent_course_id,
              parent.title AS parent_title
       FROM courses
       LEFT JOIN courses parent ON parent.id = courses.parent_course_id
       WHERE courses.id = $1`,
      [course_id]
    );

    if (courseCheck.rows.length > 0 && courseCheck.rows[0].parent_course_id) {
      const parentReviews = await db.query(
        `SELECT reviews.id, reviews.rating, reviews.comment, reviews.created_at,
                users.name AS student_name,
                true AS is_from_previous_course,
                $2 AS previous_course_title
         FROM reviews
         JOIN users ON users.id = reviews.student_id
         WHERE reviews.course_id = $1
         ORDER BY reviews.created_at DESC`,
        [courseCheck.rows[0].parent_course_id, courseCheck.rows[0].parent_title || 'previous edition']
      );

      return res.json(parentReviews.rows);
    }

    res.json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching reviews' });
  }
});

module.exports = router;
