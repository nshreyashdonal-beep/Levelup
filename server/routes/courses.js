// routes/courses.js
// Routes: create a course (instructors only), add a module to a course
// (instructors only), and browse all courses (anyone, even logged-out
// visitors, can see the list).

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Helper: validates that category_id exists and is a leaf node in the category tree.
// A leaf category has a parent and has NO children of its own (Level-3 topic or subcategory 'Other').
async function validateLeafCategory(categoryId) {
  if (!categoryId) return null;

  // Validate UUID syntax before querying to prevent Postgres 22P02 error
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(categoryId)) {
    return { error: 'Invalid category ID format', status: 400 };
  }

  const result = await db.query(
    `SELECT categories.id, categories.name, categories.parent_id,
            EXISTS (SELECT 1 FROM categories child WHERE child.parent_id = categories.id) AS has_children
     FROM categories
     WHERE categories.id = $1`,
    [categoryId]
  );

  if (result.rows.length === 0) {
    return { error: 'Selected category does not exist', status: 400 };
  }

  const row = result.rows[0];

  // A category cannot be assigned to a course if it has children or has no parent (root category)
  if (row.has_children || !row.parent_id) {
    return {
      error: 'Courses must be assigned to a specific topic (leaf category), not a parent category',
      status: 400,
    };
  }

  return { category: row };
}

// POST /api/courses
// Requires: logged in AND role = 'instructor'
// Body: { title, description, price, category_id, level, delivery_mode, language,
//         thumbnail_url, duration_weeks, capacity, curriculum, outcomes }
// Only `title` is required — everything else is optional so an instructor can
// create a bare-bones course now and fill in the rest later. New courses always
// start as `status = 'draft'` (the DB column default).
router.post('/', requireAuth, requireRole('instructor'), async (req, res) => {
  const {
    title,
    description,
    price,
    category_id,
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
    if (category_id) {
      const validation = await validateLeafCategory(category_id);
      if (validation.error) {
        return res.status(validation.status).json({ error: validation.error });
      }
    }

    const result = await db.query(
      `INSERT INTO courses (
         title, description, price, instructor_id,
         category_id, level, delivery_mode, language, thumbnail_url,
         duration_weeks, capacity, curriculum, outcomes
       )
       VALUES (
         $1, $2, COALESCE($3::numeric, 0), $4,
         $5, $6, $7, $8, $9, $10,
         $11, $12, $13
       )
       RETURNING id, title, description, price, instructor_id, created_at,
                 category_id, level, delivery_mode, language, thumbnail_url,
                 duration_weeks, capacity, curriculum, outcomes, status`,
      [
        title,
        description,
        price,
        req.user.id,
        category_id || null,
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
// sent, so modules stay in insertion order unless explicitly positioned.
router.post('/:id/modules', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, position } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    // Check ownership: does this instructor actually own this course?
    // We query the courses table first — prevents instructor A adding a module
    // to instructor B's course.
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
      `INSERT INTO course_modules (course_id, title, position)
       VALUES ($1, $2, COALESCE($3, 0))
       RETURNING id, course_id, title, position, status, created_at`,
      [id, title, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong creating the module' });
  }
});

// GET /api/courses
// No auth needed — anyone can browse courses.
// Returns an array of courses with the instructor's name included.
// Instructors can filter their own courses with ?instructor_id=<id>
// (used on MyCourses page).
// Supports ?category_id=<uuid> with recursive subtree matching.
// Supports ?q=<keyword> for case-insensitive keyword search on title and description.
// Only published courses are returned unless specifically filtering by instructor.
router.get('/', async (req, res) => {
  const { instructor_id, category_id, q } = req.query;

  try {
    const params = [];
    const conditions = [];

    // Filter by instructor if requested (e.g. MyCourses page)
    if (instructor_id) {
      params.push(instructor_id);
      conditions.push(`courses.instructor_id = $${params.length}`);
    } else {
      // Public browse only sees published courses
      conditions.push(`courses.status = 'published'`);
    }

    let cte = '';
    // Category filter with recursive subtree matching
    if (category_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(category_id)) {
        return res.status(400).json({ error: 'Invalid category_id format' });
      }

      params.push(category_id);
      cte = `
        WITH RECURSIVE category_tree AS (
          SELECT id FROM categories WHERE id = $${params.length}
          UNION ALL
          SELECT c.id FROM categories c
          JOIN category_tree ct ON c.parent_id = ct.id
        )
      `;
      conditions.push(`courses.category_id IN (SELECT id FROM category_tree)`);
    }

    // Keyword search filter (case‑insensitive substring match on title or description)
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(courses.title ILIKE $${params.length} OR courses.description ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      ${cte}
      SELECT courses.id, courses.title, courses.description, courses.price,
             courses.created_at, courses.status, courses.category_id,
             courses.instructor_id,
             COALESCE(courses.delivery_mode, 'online') AS delivery_mode,
             courses.level, courses.thumbnail_url,
             users.name AS instructor_name,
             instructor_profiles.avatar_url AS instructor_avatar_url,
             instructor_profiles.city AS instructor_city,
             (SELECT COALESCE(AVG(rating), 0)::numeric(2,1) FROM reviews WHERE reviews.course_id = courses.id) AS avg_rating,
             (SELECT COUNT(*)::int FROM reviews WHERE reviews.course_id = courses.id) AS review_count
      FROM courses
      JOIN users ON users.id = courses.instructor_id
      LEFT JOIN instructor_profiles ON instructor_profiles.user_id = courses.instructor_id
      ${whereClause}
      ORDER BY courses.created_at DESC
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong fetching courses' });
  }
});

// GET /api/courses/:id
// No auth needed — same public-browsing rule as the list route above.
// Returns one course's full info, extended for the student-facing course view:
// all the Branch 3 fields plus category breadcrumb metadata (category_id,
// topic_name, subcategory_name, root_category_name, and category_path) and
// the course's modules and each module's lectures, both ordered by `position`
// so the frontend can render them in the right order without re-sorting.
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const courseResult = await db.query(
      `SELECT courses.id, courses.title, courses.description, courses.price,
              courses.created_at, courses.instructor_id, users.name AS instructor_name,
              courses.category_id,
              topic.name AS topic_name,
              subcategory.name AS subcategory_name,
              root.name AS root_category_name,
              courses.level, COALESCE(courses.delivery_mode, 'online') AS delivery_mode,
              courses.language, courses.thumbnail_url, courses.duration_weeks,
              courses.capacity, courses.curriculum, courses.outcomes,
              courses.status,
              instructor_profiles.avatar_url AS instructor_avatar_url,
              instructor_profiles.city AS instructor_city,
              instructor_profiles.bio AS instructor_bio
       FROM courses
       JOIN users ON users.id = courses.instructor_id
       LEFT JOIN instructor_profiles ON instructor_profiles.user_id = courses.instructor_id
       LEFT JOIN categories AS topic ON topic.id = courses.category_id
       LEFT JOIN categories AS subcategory ON subcategory.id = topic.parent_id
       LEFT JOIN categories AS root ON root.id = subcategory.parent_id
       WHERE courses.id = $1`,
      [id]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const course = courseResult.rows[0];

    // Build human-readable breadcrumb path e.g. "Technology > Web Development > Frontend"
    const pathSegments = [
      course.root_category_name,
      course.subcategory_name,
      course.topic_name,
    ].filter(Boolean);

    course.category_path =
      pathSegments.length > 0 ? pathSegments.join(' > ') : null;

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
              course_lectures.duration_minutes, course_lectures.duration_seconds,
              course_lectures.position, course_lectures.is_trial,
              course_lectures.status, course_lectures.created_at
       FROM course_lectures
       JOIN course_modules ON course_modules.id = course_lectures.module_id
       WHERE course_modules.course_id = $1
       ORDER BY course_lectures.position ASC`,
      [id]
    );

    // Nest each lecture under its module (single query above, grouped here in
    // JS) instead of a query per module — one round trip for all lectures.
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
// Body: any subset of the course's editable fields, including `status` and `category_id`.
// Every field is optional here — COALESCE keeps a column's existing value
// when that field isn't sent.
// When category_id is provided, validateLeafCategory ensures it is a Level-3 leaf node.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    price,
    category_id,
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

    if (category_id !== undefined && category_id !== null) {
      const validation = await validateLeafCategory(category_id);
      if (validation.error) {
        return res.status(validation.status).json({ error: validation.error });
      }
    }

    const result = await db.query(
      `UPDATE courses
       SET title = COALESCE($2, title),
           description = COALESCE($3, description),
           price = COALESCE($4::numeric, price),
           category_id = COALESCE($5, category_id),
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
                 category_id, level, delivery_mode, language, thumbnail_url,
                 duration_weeks, capacity, curriculum, outcomes, status`,
      [
        id,
        title,
        description,
        price,
        category_id !== undefined ? category_id : null,
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
