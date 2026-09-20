// routes/instructors.js
// Public instructor discovery routes. No login is needed because the
// nearby-instructor map is available on the public landing page.

const express = require('express');
const db = require('../config/db');

const router = express.Router();

const DEFAULT_RADIUS_KM = 25;
const DEFAULT_RESULT_LIMIT = 20;
const MAX_RADIUS_KM = 100;
const MAX_RESULT_LIMIT = 50;

// GET /api/instructors/nearby?lat=22.7&lng=75.8
// Optional query params:
//   radius — search radius in kilometres (default 25, maximum 100)
//   limit  — maximum instructors returned (default 20, maximum 50)
//
// Only instructors with a saved location and at least one published course
// are returned. Course data is grouped per instructor so each map marker has
// a course link available without another request.
router.get('/nearby', async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const requestedRadius = Number(req.query.radius);
  const requestedLimit = Number(req.query.limit);

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
    const result = await db.query(
      `WITH instructor_distances AS (
         SELECT
           users.id AS instructor_id,
           users.name AS instructor_name,
           instructor_profiles.bio,
           instructor_profiles.city,
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
         instructor_distances.latitude,
         instructor_distances.longitude,
         ROUND(instructor_distances.distance_km::numeric, 2) AS distance_km,
         COALESCE(
           json_agg(
             json_build_object(
               'id', courses.id,
               'title', courses.title,
               'description', courses.description,
               'price', courses.price
             )
             ORDER BY courses.created_at DESC
           ) FILTER (WHERE courses.id IS NOT NULL),
           '[]'::json
         ) AS courses
       FROM instructor_distances
       LEFT JOIN courses
         ON courses.instructor_id = instructor_distances.instructor_id
        AND courses.status = 'published'
       WHERE instructor_distances.distance_km <= $3
       GROUP BY
         instructor_distances.instructor_id,
         instructor_distances.instructor_name,
         instructor_distances.bio,
         instructor_distances.city,
         instructor_distances.latitude,
         instructor_distances.longitude,
         instructor_distances.distance_km
       HAVING COUNT(courses.id) > 0
       ORDER BY instructor_distances.distance_km ASC
       LIMIT $4`,
      [latitude, longitude, radius, limit]
    );

    res.json({
      center: { latitude, longitude },
      radius_km: radius,
      results: result.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong finding nearby instructors' });
  }
});

module.exports = router;
