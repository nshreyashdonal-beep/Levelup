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
// Requires: logged in AND role = 'instructor' AND the instructor owns the course containing this lecture
// Body: any subset of { title, content, video_url, duration_minutes,
// position, status } — same partial-update pattern as the course/module
// PATCH routes (COALESCE keeps a field's current value when it isn't
// sent). Used to flip a lecture's status from 'planned' to 'available'
// once its content is actually ready, or just to edit its fields.
// `status` isn't restricted to planned->available only in JS — the DB's
// CHECK constraint (status IN ('planned', 'available')) already stops
// invalid values from being saved.
router.patch('/:id', requireAuth, requireRole('instructor'), async (req, res) => {
  const { id } = req.params;
  const { title, content, video_url, duration_minutes, position, status } = req.body;

  try {
    // Check ownership: does this instructor own the course that contains this lecture?
    // Lecture → Module → Course → Instructor
    const lectureCheck = await db.query(
      `SELECT courses.instructor_id
       FROM course_lectures
       JOIN course_modules ON course_modules.id = course_lectures.module_id
       JOIN courses ON courses.id = course_modules.course_id
       WHERE course_lectures.id = $1`,
      [id]
    );

    if (lectureCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Lecture not found' });
    }

    if (lectureCheck.rows[0].instructor_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit lectures in your own courses' });
    }

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
