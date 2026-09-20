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
// Requires: logged in AND role = 'instructor' AND the instructor owns this course
// Body: { title, position }
// Adds one module (a major section, e.g. "Week 1: Basics") to a course.
// Only `title` is required — `position` defaults to 0 (DB column default) if not
// given, and `status` always starts as 'planned' (also a DB default) since a module
// has no lectures yet when it's first created.
router.post('/:id/modules', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    // Check ownership: does this instructor own this course?
    const courseCheck = await db.query(
      `SELECT instructor_id FROM courses WHERE id = $1`,
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only add modules to your own courses' });
    }

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
    // `status` is included so the instructor's own "My Courses" page can
    // split a course into the Published or Draft section (Branch 3, Session 8).
    const result = instructor_id
      ? await db.query(
          `SELECT courses.id, courses.title, courses.description, courses.price,
                  courses.created_at, courses.status, users.name AS instructor_name
           FROM courses
           JOIN users ON users.id = courses.instructor_id
           WHERE courses.instructor_id = $1
           ORDER BY courses.created_at DESC`,
          [instructor_id]
        )
      : await db.query(
          `SELECT courses.id, courses.title, courses.description, courses.price,
                  courses.created_at, courses.status, users.name AS instructor_name
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
// Returns one course's full info, extended for the student-facing course view:
// all the Branch 3 fields (category, level, delivery_mode, language,
// thumbnail_url, duration_weeks, capacity, curriculum, outcomes, status) plus
// the course's modules and each module's lectures, both ordered by `position`
// so the frontend can render them in the right order without re-sorting.
// Used by the Course Detail page instead of filtering the already-fetched list
// client-side, so the page also works if someone opens the URL directly
// without visiting Explore first. Also used by the instructor's Manage
// Course workspace, which is why `instructor_id` (not just `instructor_name`)
// is included below — it lets that page confirm the logged-in instructor
// owns this course with the one request it already has to make, instead of
// fetching the whole instructor_id course list separately just to check.
// No status filter here (e.g. hiding 'draft' courses from students) — that's
// left for a later piece since it isn't part of this checklist item.
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const courseResult = await db.query(
      `SELECT courses.id, courses.title, courses.description, courses.price,
              courses.created_at, courses.instructor_id, users.name AS instructor_name,
              courses.category, courses.level, courses.delivery_mode,
              courses.language, courses.thumbnail_url, courses.duration_weeks,
              courses.capacity, courses.curriculum, courses.outcomes,
              courses.status
       FROM courses
       JOIN users ON users.id = courses.instructor_id
       WHERE courses.id = $1`,
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    const modulesResult = await db.query(
      `SELECT id, title, position, status, created_at
       FROM course_modules
       WHERE course_id = $1
       ORDER BY position ASC`,
      [id]
    );

    const lecturesResult = await db.query(
      `SELECT course_lectures.id, course_lectures.module_id, course_lectures.title,
              course_lectures.content, course_lectures.video_url,
              course_lectures.duration_minutes, course_lectures.position,
              course_lectures.status, course_lectures.created_at
       FROM course_lectures
       JOIN course_modules ON course_modules.id = course_lectures.module_id
       WHERE course_modules.course_id = $1
       ORDER BY course_lectures.position ASC`,
      [id]
    );

    // Nest each lecture under its module (single query above, grouped here in
    // JS) instead of a query per module — one round trip for all lectures,
    // matching the number of queries no matter how many modules a course has.
    course.modules = modulesResult.rows.map((mod) => ({
      ...mod,
      lectures: lecturesResult.rows.filter((lec) => lec.module_id === mod.id),
    }));

    res.json(course);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong fetching the course' });
  }
});

// PATCH /api/courses/:id
// Requires: logged in AND role = 'instructor' AND the instructor owns this course
// Body: any subset of the course's editable fields, including `status`
// (e.g. { status: 'published' } to publish a draft course).
// Every field is optional here — COALESCE keeps a column's existing value
// when that field isn't sent, so an instructor can flip just `status`
// without resending the whole course, same partial-update idea as the
// POST route's optional fields.
// `status` isn't restricted to draft->published only — the DB's CHECK
// constraint (status IN ('draft', 'published')) is what actually stops
// invalid values, so there's no extra JS logic needed to enforce that here.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
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
    status,
  } = req.body;

  try {
    // Check ownership: does this instructor own this course?
    const courseCheck = await db.query(
      `SELECT instructor_id FROM courses WHERE id = $1`,
      [id]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (courseCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own courses' });
    }

    const result = await db.query(
      `UPDATE courses
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           price = COALESCE($4::numeric, price),
           category = COALESCE($5, category),
           level = COALESCE($6, level),
           delivery_mode = COALESCE($7, delivery_mode),
           language = COALESCE($8, language),
           thumbnail_url = COALESCE($9, thumbnail_url),
           duration_weeks = COALESCE($10::integer, duration_weeks),
           capacity = COALESCE($11::integer, capacity),
           curriculum = COALESCE($12, curriculum),
           outcomes = COALESCE($13, outcomes),
           status = COALESCE($14, status)
       WHERE id = $1
       RETURNING id, title, description, price, instructor_id, created_at,
                 category, level, delivery_mode, language, thumbnail_url,
                 duration_weeks, capacity, curriculum, outcomes, status`,
      [
        id,
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
        status,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong updating the course' });
  }
});

module.exports = router;

