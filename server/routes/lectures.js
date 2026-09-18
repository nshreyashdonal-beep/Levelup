// routes/lectures.js
// Routes: edit a lecture (instructors only).
// Lives under /api/lectures (not nested under /api/modules) for the same
// reason modules.js lives under /api/modules instead of nested under
// /api/courses — the only identifier a client has at this point is the
// lecture id itself. Matches the one-router-per-resource convention used
// by auth/courses/modules/enrollments/reviews/sessions.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// PATCH /api/lectures/:id
// Requires: logged in AND role = 'instructor'
// Body: any subset of { title, content, video_url, duration_minutes,
// position, status } — same partial-update pattern as the course/module
// PATCH routes (COALESCE keeps a field's current value when it isn't
// sent). Used to flip a lecture's status from 'planned' to 'available'
// once its content is actually ready, or just to edit its fields.
// `status` isn't restricted to planned->available only in JS — the DB's
// CHECK constraint (status IN ('planned', 'available')) already stops
// invalid values from being saved.
// No ownership check yet (anyone with an instructor account can edit any
// lecture id) — same known gap as the modules route, covered by the later
// "Validation + auth checks" checklist item.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, content, video_url, duration_minutes, position, status } = req.body;

  try {
    const result = await db.query(
      `UPDATE course_lectures
       SET title = COALESCE($2, title),
           content = COALESCE($3, content),
           video_url = COALESCE($4, video_url),
           duration_minutes = COALESCE($5::integer, duration_minutes),
           position = COALESCE($6::integer, position),
           status = COALESCE($7, status)
       WHERE id = $1
       RETURNING id, module_id, title, content, video_url, duration_minutes,
                 position, status, created_at`,
      [id, title, content, video_url, duration_minutes, position, status]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err); // print the real error in the terminal so we can debug it
    res.status(500).json({ error: 'Something went wrong updating the lecture' });
  }
});

module.exports = router;
