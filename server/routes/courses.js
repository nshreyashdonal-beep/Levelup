// routes/courses.js
// Routes: create a course (instructors only), add a module to a course
// (instructors only), and browse all courses (anyone, even logged-out
// visitors, can see the list).

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/courses
// Requires: logged in AND role = 'instructor'
// Body: { title, description, price, category, level, delivery_mode, language,
//         thumbnail_url, duration_weeks, capacity, curriculum, outcomes }
// Only `title` is required — everything else is optional so an instructor can
// create a bare-bones course now and fill in the rest later. New courses always
// start as `status = 'draft'` (the DB column default) — there's no way to set
// status here yet; that comes with the future PATCH route that publishes a course.
router.post('/', requireAuth, requireRole('instructor'), async (req, res) => {
  const {
    title,
    description,
    price,
    category,
    level,
    delivery_mode,
    language,
    thumbnail_url,
    duration_weeks,
    capacity,
    curriculum,
    outcomes,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO courses (
         title, description, price, instructor_id,
         category, level, delivery_mode, language, thumbnail_url,
         duration_weeks, capacity, curriculum, outcomes
       )
       VALUES (
         $1, $2, COALESCE($3::numeric, 0), $4,
         $5, $6, $7, $8, $9,
         $10, $11, $12, $13
       )
       RETURNING id, title, description, price, instructor_id, created_at,
                 category, level, delivery_mode, language, thumbnail_url,
                 duration_weeks, capacity, curriculum, outcomes, status`,
      [
        title,
        description,
        price,
        req.user.id,
        category,
        level,
        delivery_mode,
        language,
        thumbnail_url,
        duration_weeks,
        capacity,
        curriculum,
        outcomes,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong creating the course' });
  }
});

// POST /api/courses/:id/modules
// Requires: logged in AND role = 'instructor'
// Body: { title, position }
// Adds one module (a major section, e.g. "Week 1: Basics") to a course.
// Only `title` is required — `position` defaults to 0 (DB column default) if not
// given, and `status` always starts as 'planned' (also a DB default) since a module
// has no lectures yet when it's first created.
// No ownership check yet (anyone with an instructor account can add a module to any
// course id) — that's its own later checklist item: "Validation + auth checks — only
// the instructor who owns the course can create/edit its modules and lectures".
router.post('/:id/modules', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO course_modules (course_id, title, position)
       VALUES ($1, $2, COALESCE($3::integer, 0))
       RETURNING id, course_id, title, position, status, created_at`,
      [id, title, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong adding the module' });
  }
});

// GET /api/courses
// GET /api/courses?instructor_id=5
// No auth needed — anyone can browse the course list. The optional
// instructor_id query param narrows it to just one instructor's own
// courses (used by the Instructor Dashboard to count "Active Courses").
router.get('/', async (req, res) => {
  const { instructor_id } = req.query;

  try {
    // Same base query either way — just add a WHERE clause when
    // instructor_id was given, instead of writing a second query.
    const result = instructor_id
      ? await db.query(
          `SELECT courses.id, courses.title, courses.description, courses.price,
                  courses.created_at, users.name AS instructor_name
           FROM courses
           JOIN users ON users.id = courses.instructor_id
           WHERE courses.instructor_id = $1
           ORDER BY courses.created_at DESC`,
          [instructor_id]
        )
      : await db.query(
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

// GET /api/courses/:id
// No auth needed — same public-browsing rule as the list route above.
// Returns one course's full info (used by the Course Detail page instead
// of filtering the already-fetched list client-side, so the page also
// works if someone opens the URL directly without visiting Explore first).
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT courses.id, courses.title, courses.description, courses.price,
              courses.created_at, users.name AS instructor_name
       FROM courses
       JOIN users ON users.id = courses.instructor_id
       WHERE courses.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong fetching the course' });
  }
});

module.exports = router;
