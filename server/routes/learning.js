// Student classroom routes: load an enrolled course curriculum and record
// lecture completion after the client video player reaches its end.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { isUuid } = require('../utils/lectureValidation');

const router = express.Router();

// GET /api/learning/courses/:courseId
// Only an enrolled student may load the classroom curriculum.
router.get('/courses/:courseId', requireAuth, requireRole('student'), async (req, res) => {
  const { courseId } = req.params;

  if (!isUuid(courseId)) {
    return res.status(400).json({ error: 'courseId must be a valid UUID' });
  }

  try {
    const enrollment = await db.query(
      `SELECT courses.id, courses.title, courses.description,
              courses.instructor_id, users.name AS instructor_name
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       JOIN users ON users.id = courses.instructor_id
       WHERE enrollments.student_id = $1
         AND enrollments.course_id = $2`,
      [req.user.id, courseId]
    );

    if (enrollment.rows.length === 0) {
      return res.status(403).json({ error: 'You must be enrolled in this course' });
    }

    const curriculum = await db.query(
      `SELECT course_modules.id AS module_id,
              course_modules.title AS module_title,
              course_modules.position AS module_position,
              course_modules.status AS module_status,
              course_lectures.id AS lecture_id,
              course_lectures.title AS lecture_title,
              course_lectures.content,
              course_lectures.video_url,
              course_lectures.duration_minutes,
              course_lectures.duration_seconds,
              course_lectures.position AS lecture_position,
              course_lectures.status AS lecture_status,
              lecture_progress.completed_at
       FROM course_modules
       LEFT JOIN course_lectures
         ON course_lectures.module_id = course_modules.id
       LEFT JOIN lecture_progress
         ON lecture_progress.lecture_id = course_lectures.id
        AND lecture_progress.student_id = $1
       WHERE course_modules.course_id = $2
       ORDER BY course_modules.position, course_modules.created_at,
                course_lectures.position, course_lectures.created_at`,
      [req.user.id, courseId]
    );

    const modules = [];
    const modulesById = new Map();

    for (const row of curriculum.rows) {
      let module = modulesById.get(row.module_id);

      if (!module) {
        module = {
          id: row.module_id,
          title: row.module_title,
          position: row.module_position,
          status: row.module_status,
          lectures: [],
        };
        modulesById.set(row.module_id, module);
        modules.push(module);
      }

      if (row.lecture_id) {
        module.lectures.push({
          id: row.lecture_id,
          title: row.lecture_title,
          content: row.content,
          video_url: row.video_url,
          duration_minutes: row.duration_minutes,
          duration_seconds: row.duration_seconds,
          position: row.lecture_position,
          status: row.lecture_status,
          completed_at: row.completed_at,
          completed: Boolean(row.completed_at),
        });
      }
    }

    res.json({
      course: enrollment.rows[0],
      modules,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong loading the classroom' });
  }
});

// POST /api/learning/lectures/:lectureId/complete
// The client calls this only from the video's ended event.
router.post(
  '/lectures/:lectureId/complete',
  requireAuth,
  requireRole('student'),
  async (req, res) => {
    const { lectureId } = req.params;

    if (!isUuid(lectureId)) {
      return res.status(400).json({ error: 'lectureId must be a valid UUID' });
    }

    try {
      const lecture = await db.query(
        `SELECT course_lectures.id, course_modules.course_id
         FROM course_lectures
         JOIN course_modules ON course_modules.id = course_lectures.module_id
         JOIN enrollments
           ON enrollments.course_id = course_modules.course_id
          AND enrollments.student_id = $1
         WHERE course_lectures.id = $2`,
        [req.user.id, lectureId]
      );

      if (lecture.rows.length === 0) {
        return res.status(403).json({ error: 'You must be enrolled to complete this lecture' });
      }

      const result = await db.query(
        `INSERT INTO lecture_progress (student_id, lecture_id, completed_at)
         VALUES ($1, $2, now())
         ON CONFLICT (student_id, lecture_id)
         DO UPDATE SET completed_at = EXCLUDED.completed_at
         RETURNING id, student_id, lecture_id, completed_at`,
        [req.user.id, lectureId]
      );

      res.json({
        completed: true,
        progress: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong completing the lecture' });
    }
  }
);

module.exports = router;
