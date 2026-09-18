// routes/modules.js
// Routes: add a lecture to a module (instructors only).
// A module lives under /api/modules (not nested under /api/courses) because
// the only identifier a client has at this point is the module id, not the
// course id — matches the one-router-per-resource convention used by
// courses.js/enrollments.js/reviews.js/sessions.js.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/modules/:id/lectures
// Requires: logged in AND role = 'instructor'
// Body: { title, content, video_url, duration_minutes, position }
// Adds one lecture (actual content, e.g. a video or text lesson) to a module.
// Only `title` is required — everything else is optional, `position` defaults
// to 0 (DB column default) if not given, and `status` always starts as
// 'planned' (also a DB default) since a lecture has no content marked live yet
// when it's first created.
// No ownership check yet (anyone with an instructor account can add a lecture
// to any module id) — same known gap as the modules route in courses.js,
// covered by the later checklist item: "Validation + auth checks — only the
// instructor who owns the course can create/edit its modules and lectures".
router.post('/:id/lectures', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, content, video_url, duration_minutes, position } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO course_lectures (module_id, title, content, video_url, duration_minutes, position)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::integer, 0))
       RETURNING id, module_id, title, content, video_url, duration_minutes, position, status, created_at`,
      [id, title, content, video_url, duration_minutes, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong adding the lecture' });
  }
});

// PATCH /api/modules/:id
// Requires: logged in AND role = 'instructor'
// Body: any subset of { title, position, status } — same partial-update
// pattern as PATCH /api/courses/:id (COALESCE keeps a field's current
// value when it isn't sent). Used to flip a module's status from
// 'planned' to 'available' once it actually has content, or just to
// rename/reorder it.
// `status` isn't restricted to planned->available only in JS — the DB's
// CHECK constraint (status IN ('planned', 'available')) already stops
// invalid values from being saved.
// No ownership check yet (anyone with an instructor account can edit any
// module id) — same known gap as the other module/lecture routes, covered
// by the later "Validation + auth checks" checklist item.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, position, status } = req.body;

  try {
    const result = await db.query(
      `UPDATE course_modules
       SET title = COALESCE($2, title),
           position = COALESCE($3::integer, position),
           status = COALESCE($4, status)
       WHERE id = $1
       RETURNING id, course_id, title, position, status, created_at`,
      [id, title, position, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong updating the module' });
  }
});

module.exports = router;
