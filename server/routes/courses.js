// routes/courses.js
// Two routes: create a course (instructors only) and browse all courses
// (anyone, even logged-out visitors, can see the list).

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/courses
// Requires: logged in AND role = 'instructor'
// Body: { title, description, price }
router.post('/', requireAuth, requireRole('instructor'), async (req, res) => {
  const { title, description, price } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO courses (title, description, price, instructor_id)
       VALUES ($1, $2, COALESCE($3::numeric, 0), $4)
       RETURNING id, title, description, price, instructor_id, created_at`,
      [title, description, price, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong creating the course' });
  }
});

// GET /api/courses
// No auth needed — anyone can browse the course list.
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT courses.id, courses.title, courses.description, courses.price,
              courses.created_at, users.name AS instructor_name
       FROM courses
       JOIN users ON users.id = courses.instructor_id
       ORDER BY courses.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong fetching courses' });
  }
});

module.exports = router;
