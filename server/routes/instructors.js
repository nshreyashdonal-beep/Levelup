// routes/instructors.js
// Public instructor discovery routes. No login is needed because the
// nearby-instructor map is available on the public landing page.

const express = require('express');
const db = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_RADIUS_KM = 25;
const DEFAULT_RESULT_LIMIT = 20;
const MAX_RADIUS_KM = 100;
const MAX_RESULT_LIMIT = 50;

// GET /api/instructors/nearby?lat=22.7&lng=75.8
// Optional query params:
//   radius — search radius in kilometres (default 25, maximum 100)
//   limit  — maximum instructors returned (default 20, maximum 50)
//   category_id — filter by category subtree
//   q      — case-insensitive keyword search on course title and description
//
// Only instructors with a saved location and at least one published course
// are returned. Course data is grouped per instructor so each map marker has
// a course link available without another request.
router.get('/nearby', async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const requestedRadius = Number(req.query.radius);
  const requestedLimit = Number(req.query.limit);
  const categoryId = req.query.category_id;
  const keyword = req.query.q;

  if (categoryId) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      return res.status(400).json({
        error: 'Invalid category_id format',
      });
    }
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return res.status(400).json({
      error: 'lat and lng must be valid geographic coordinates',
    });
  }

  if (req.query.radius !== undefined && (
    !Number.isFinite(requestedRadius) || requestedRadius <= 0
  )) {
    return res.status(400).json({
      error: 'radius must be a positive number of kilometres',
    });
  }

  if (req.query.limit !== undefined && (
    !Number.isInteger(requestedLimit) || requestedLimit <= 0
  )) {
    return res.status(400).json({
      error: 'limit must be a positive whole number',
    });
  }

  const radius = Math.min(
    requestedRadius || DEFAULT_RADIUS_KM,
    MAX_RADIUS_KM
  );
  const limit = Math.min(
    requestedLimit || DEFAULT_RESULT_LIMIT,
    MAX_RESULT_LIMIT
  );

  try {
    const params = [latitude, longitude, radius, limit];
    let ctePrefix = 'WITH ';
    let courseCategoryCondition = '';
    let courseKeywordCondition = '';

    if (categoryId) {
      params.push(categoryId);
      ctePrefix = `WITH RECURSIVE target_categories AS (
        SELECT id FROM categories WHERE id = $${params.length}
        UNION ALL
        SELECT c.id FROM categories c JOIN target_categories tc ON c.parent_id = tc.id
      ), `;
      courseCategoryCondition = 'AND courses.category_id IN (SELECT id FROM target_categories)';
    }

    if (keyword) {
      params.push(`%${keyword}%`);
      courseKeywordCondition = `AND (courses.title ILIKE $${params.length} OR courses.description ILIKE $${params.length})`;
    }

    const result = await db.query(
      `${ctePrefix}instructor_distances AS (
         SELECT
           users.id AS instructor_id,
           users.name AS instructor_name,
           instructor_profiles.bio,
           instructor_profiles.city,
           instructor_profiles.avatar_url,
           instructor_profiles.latitude,
           instructor_profiles.longitude,
           6371 * acos(
             LEAST(1, GREATEST(-1,
               cos(radians($1))
               * cos(radians(instructor_profiles.latitude))
               * cos(radians(instructor_profiles.longitude) - radians($2))
               + sin(radians($1))
               * sin(radians(instructor_profiles.latitude))
             ))
           ) AS distance_km
         FROM users
         JOIN instructor_profiles ON instructor_profiles.user_id = users.id
         WHERE users.role = 'instructor'
           AND instructor_profiles.latitude IS NOT NULL
           AND instructor_profiles.longitude IS NOT NULL
       )
       SELECT
         instructor_distances.instructor_id,
         instructor_distances.instructor_name,
         instructor_distances.bio,
         instructor_distances.city,
         instructor_distances.avatar_url,
         instructor_distances.latitude,
         instructor_distances.longitude,
         ROUND(instructor_distances.distance_km::numeric, 2) AS distance_km,
         COALESCE(
           json_agg(
             json_build_object(
               'id', courses.id,
               'title', courses.title,
               'description', courses.description,
               'price', courses.price,
               'category_id', courses.category_id,
               'avg_rating', (
                 SELECT COALESCE(AVG(course_reviews.rating), 0)::numeric(2,1)
                 FROM reviews course_reviews
                 WHERE course_reviews.course_id = courses.id
               ),
               'review_count', (
                 SELECT COUNT(*)::int
                 FROM reviews course_reviews
                 WHERE course_reviews.course_id = courses.id
               )
             )
             ORDER BY courses.created_at DESC
           ) FILTER (WHERE courses.id IS NOT NULL),
           '[]'::json
         ) AS courses
       FROM instructor_distances
       LEFT JOIN courses
         ON courses.instructor_id = instructor_distances.instructor_id
        AND courses.status = 'published'
        ${courseCategoryCondition}
        ${courseKeywordCondition}
       WHERE instructor_distances.distance_km <= $3
       GROUP BY
         instructor_distances.instructor_id,
         instructor_distances.instructor_name,
         instructor_distances.bio,
         instructor_distances.city,
         instructor_distances.avatar_url,
         instructor_distances.latitude,
         instructor_distances.longitude,
         instructor_distances.distance_km
       HAVING COUNT(courses.id) > 0
       ORDER BY instructor_distances.distance_km ASC
       LIMIT $4`,
      params
    );

    res.json({
      center: { latitude, longitude },
      radius_km: radius,
      category_id: categoryId || null,
      q: keyword || null,
      results: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong finding nearby instructors' });
  }
});

// GET /api/instructors/dashboard
// Private route for logged-in instructors returning aggregated dashboard metrics,
// per-course performance, recent student enrollments, and recent student reviews.
router.get('/dashboard', requireAuth, requireRole('instructor'), async (req, res) => {
  const instructorId = req.user.id;

  try {
    // 1. Overall stats
    const statsQuery = await db.query(
      `SELECT
         COUNT(DISTINCT c.id)::int AS total_courses,
         COUNT(DISTINCT CASE WHEN c.status = 'published' THEN c.id END)::int AS published_courses,
         COUNT(DISTINCT CASE WHEN c.status != 'published' THEN c.id END)::int AS draft_courses,
         COUNT(DISTINCT e.student_id)::int AS total_students,
         COUNT(e.id)::int AS total_enrollments,
         COALESCE(SUM(CASE WHEN e.id IS NOT NULL THEN c.price ELSE 0 END), 0)::numeric(12, 2) AS total_earnings
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.instructor_id = $1`,
      [instructorId]
    );

    const reviewsQuery = await db.query(
      `SELECT
         COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
         COUNT(r.id)::int AS total_reviews
       FROM reviews r
       JOIN courses c ON c.id = r.course_id
       WHERE c.instructor_id = $1`,
      [instructorId]
    );

    const stats = {
      total_courses: statsQuery.rows[0]?.total_courses || 0,
      published_courses: statsQuery.rows[0]?.published_courses || 0,
      draft_courses: statsQuery.rows[0]?.draft_courses || 0,
      total_students: statsQuery.rows[0]?.total_students || 0,
      total_enrollments: statsQuery.rows[0]?.total_enrollments || 0,
      total_earnings: Number(statsQuery.rows[0]?.total_earnings || 0),
      avg_rating: Number(reviewsQuery.rows[0]?.avg_rating || 0),
      total_reviews: reviewsQuery.rows[0]?.total_reviews || 0,
    };

    // 2. Per-course performance breakdown
    const coursesResult = await db.query(
      `SELECT
         c.id,
         c.title,
         c.status,
         c.price,
         c.delivery_mode,
         c.level,
         c.thumbnail_url,
         c.created_at,
         COUNT(DISTINCT e.id)::int AS enrolled_count,
         (COUNT(DISTINCT e.id) * c.price)::numeric(12, 2) AS course_earnings,
         COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
         COUNT(DISTINCT r.id)::int AS review_count
       FROM courses c
       LEFT JOIN enrollments e ON e.course_id = c.id
       LEFT JOIN reviews r ON r.course_id = c.id
       WHERE c.instructor_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [instructorId]
    );

    // 3. Recent student enrollments (limit 6)
    const recentEnrollmentsResult = await db.query(
      `SELECT
         e.id AS enrollment_id,
         e.enrolled_at,
         e.student_id,
         u.name AS student_name,
         u.email AS student_email,
         c.id AS course_id,
         c.title AS course_title,
         c.price AS course_price
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       JOIN users u ON u.id = e.student_id
       WHERE c.instructor_id = $1
       ORDER BY e.enrolled_at DESC
       LIMIT 6`,
      [instructorId]
    );

    // 4. Recent student reviews (limit 6)
    const recentReviewsResult = await db.query(
      `SELECT
         r.id AS review_id,
         r.rating,
         r.comment,
         r.created_at,
         u.name AS student_name,
         c.id AS course_id,
         c.title AS course_title
       FROM reviews r
       JOIN courses c ON c.id = r.course_id
       JOIN users u ON u.id = r.student_id
       WHERE c.instructor_id = $1
       ORDER BY r.created_at DESC
       LIMIT 6`,
      [instructorId]
    );

    res.json({
      stats,
      courses: coursesResult.rows,
      recent_enrollments: recentEnrollmentsResult.rows,
      recent_reviews: recentReviewsResult.rows,
    });
  } catch (err) {
    console.error('Error fetching instructor dashboard metrics:', err);
    res.status(500).json({ error: 'Failed to load instructor dashboard metrics' });
  }
});

// GET /api/instructors/:id
// Public route returning comprehensive instructor profile details,
// aggregate rating, review count, student count, and total published courses.
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT users.id, users.name, users.created_at,
              instructor_profiles.bio, instructor_profiles.city,
              instructor_profiles.avatar_url, instructor_profiles.phone,
              COALESCE(AVG(reviews.rating), 0)::numeric(2,1) AS avg_rating,
              COUNT(DISTINCT reviews.id)::int AS review_count,
              COUNT(DISTINCT enrollments.id)::int AS student_count,
              COUNT(DISTINCT courses.id)::int AS total_courses
       FROM users
       LEFT JOIN instructor_profiles ON instructor_profiles.user_id = users.id
       LEFT JOIN courses ON courses.instructor_id = users.id AND courses.status = 'published'
       LEFT JOIN reviews ON reviews.course_id = courses.id
       LEFT JOIN enrollments ON enrollments.course_id = courses.id
       WHERE users.id = $1 AND users.role = 'instructor'
       GROUP BY users.id, instructor_profiles.bio, instructor_profiles.city,
                instructor_profiles.avatar_url, instructor_profiles.phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong fetching instructor details' });
  }
});

module.exports = router;
