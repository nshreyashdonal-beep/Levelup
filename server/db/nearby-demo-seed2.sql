-- Branch 5 / NearbyInstructor demo data set 2
-- Center point for this test data:
-- Latitude:  22.730729
-- Longitude: 75.872913
--
-- Intended distance groups from the center point:
--   5 instructors at or under 5 km
--   10 additional instructors at or under 10 km
--   10 additional instructors at or under 20 km
--
-- Run this file manually in pgAdmin after the NearbyInstructor schema changes
-- have been applied. Every instructor has one published course so the public
-- nearby route can return all of them.
--
-- Demo password for every account:
-- DemoPassword123!
--
-- The script is repeatable:
--   - users are upserted by email
--   - instructor profiles are updated by user_id
--   - duplicate courses are not inserted

INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Nearby Test 01', 'nearby.test01@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 02', 'nearby.test02@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 03', 'nearby.test03@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 04', 'nearby.test04@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 05', 'nearby.test05@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 06', 'nearby.test06@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 07', 'nearby.test07@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 08', 'nearby.test08@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 09', 'nearby.test09@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 10', 'nearby.test10@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 11', 'nearby.test11@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 12', 'nearby.test12@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 13', 'nearby.test13@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 14', 'nearby.test14@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 15', 'nearby.test15@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 16', 'nearby.test16@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 17', 'nearby.test17@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 18', 'nearby.test18@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 19', 'nearby.test19@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 20', 'nearby.test20@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 21', 'nearby.test21@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 22', 'nearby.test22@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 23', 'nearby.test23@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 24', 'nearby.test24@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Nearby Test 25', 'nearby.test25@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role;

INSERT INTO instructor_profiles (
  user_id,
  bio,
  phone,
  city,
  latitude,
  longitude
)
SELECT users.id,
       demo.bio,
       demo.phone,
       demo.city,
       demo.latitude,
       demo.longitude
FROM users
JOIN (
  VALUES
    -- Group 1: five instructors within 5 km
    ('nearby.test01@levelup.local', 'Nearby test instructor 01.', '9999100001', 'Indore Near Me 01', 22.735729, 75.872913),
    ('nearby.test02@levelup.local', 'Nearby test instructor 02.', '9999100002', 'Indore Near Me 02', 22.720729, 75.882913),
    ('nearby.test03@levelup.local', 'Nearby test instructor 03.', '9999100003', 'Indore Near Me 03', 22.750729, 75.862913),
    ('nearby.test04@levelup.local', 'Nearby test instructor 04.', '9999100004', 'Indore Near Me 04', 22.705729, 75.857913),
    ('nearby.test05@levelup.local', 'Nearby test instructor 05.', '9999100005', 'Indore Near Me 05', 22.760729, 75.892913),

    -- Group 2: ten additional instructors between 5 km and 10 km
    ('nearby.test06@levelup.local', 'Nearby test instructor 06.', '9999100006', 'Indore Near Me 06', 22.780729, 75.892913),
    ('nearby.test07@levelup.local', 'Nearby test instructor 07.', '9999100007', 'Indore Near Me 07', 22.670729, 75.902913),
    ('nearby.test08@levelup.local', 'Nearby test instructor 08.', '9999100008', 'Indore Near Me 08', 22.800729, 75.832913),
    ('nearby.test09@levelup.local', 'Nearby test instructor 09.', '9999100009', 'Indore Near Me 09', 22.650729, 75.852913),
    ('nearby.test10@levelup.local', 'Nearby test instructor 10.', '9999100010', 'Indore Near Me 10', 22.770729, 75.942913),
    ('nearby.test11@levelup.local', 'Nearby test instructor 11.', '9999100011', 'Indore Near Me 11', 22.690729, 75.792913),
    ('nearby.test12@levelup.local', 'Nearby test instructor 12.', '9999100012', 'Indore Near Me 12', 22.800729, 75.932913),
    ('nearby.test13@levelup.local', 'Nearby test instructor 13.', '9999100013', 'Indore Near Me 13', 22.660729, 75.822913),
    ('nearby.test14@levelup.local', 'Nearby test instructor 14.', '9999100014', 'Indore Near Me 14', 22.770729, 75.922913),
    ('nearby.test15@levelup.local', 'Nearby test instructor 15.', '9999100015', 'Indore Near Me 15', 22.680729, 75.932913),

    -- Group 3: ten additional instructors between 10 km and 20 km
    ('nearby.test16@levelup.local', 'Nearby test instructor 16.', '9999100016', 'Indore Near Me 16', 22.840729, 75.902913),
    ('nearby.test17@levelup.local', 'Nearby test instructor 17.', '9999100017', 'Indore Near Me 17', 22.610729, 75.912913),
    ('nearby.test18@levelup.local', 'Nearby test instructor 18.', '9999100018', 'Indore Near Me 18', 22.860729, 75.822913),
    ('nearby.test19@levelup.local', 'Nearby test instructor 19.', '9999100019', 'Indore Near Me 19', 22.580729, 75.842913),
    ('nearby.test20@levelup.local', 'Nearby test instructor 20.', '9999100020', 'Indore Near Me 20', 22.880729, 75.932913),
    ('nearby.test21@levelup.local', 'Nearby test instructor 21.', '9999100021', 'Indore Near Me 21', 22.570729, 75.812913),
    ('nearby.test22@levelup.local', 'Nearby test instructor 22.', '9999100022', 'Indore Near Me 22', 22.830729, 76.012913),
    ('nearby.test23@levelup.local', 'Nearby test instructor 23.', '9999100023', 'Indore Near Me 23', 22.630729, 75.732913),
    ('nearby.test24@levelup.local', 'Nearby test instructor 24.', '9999100024', 'Indore Near Me 24', 22.900729, 75.862913),
    ('nearby.test25@levelup.local', 'Nearby test instructor 25.', '9999100025', 'Indore Near Me 25', 22.580729, 75.942913)
) AS demo(email, bio, phone, city, latitude, longitude)
  ON users.email = demo.email
ON CONFLICT (user_id) DO UPDATE
SET bio = EXCLUDED.bio,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

INSERT INTO courses (
  title,
  description,
  price,
  instructor_id,
  category,
  level,
  delivery_mode,
  language,
  status
)
SELECT demo.title,
       demo.description,
       demo.price,
       users.id,
       demo.category,
       'beginner',
       'hybrid',
       'English',
       'published'
FROM users
JOIN (
  VALUES
    ('nearby.test01@levelup.local', 'Nearby Practice Course 01', 'A local demo course for testing nearby instructor results.', 401, 'Nearby Test'),
    ('nearby.test02@levelup.local', 'Nearby Practice Course 02', 'A local demo course for testing nearby instructor results.', 402, 'Nearby Test'),
    ('nearby.test03@levelup.local', 'Nearby Practice Course 03', 'A local demo course for testing nearby instructor results.', 403, 'Nearby Test'),
    ('nearby.test04@levelup.local', 'Nearby Practice Course 04', 'A local demo course for testing nearby instructor results.', 404, 'Nearby Test'),
    ('nearby.test05@levelup.local', 'Nearby Practice Course 05', 'A local demo course for testing nearby instructor results.', 405, 'Nearby Test'),
    ('nearby.test06@levelup.local', 'Nearby Practice Course 06', 'A local demo course for testing nearby instructor results.', 406, 'Nearby Test'),
    ('nearby.test07@levelup.local', 'Nearby Practice Course 07', 'A local demo course for testing nearby instructor results.', 407, 'Nearby Test'),
    ('nearby.test08@levelup.local', 'Nearby Practice Course 08', 'A local demo course for testing nearby instructor results.', 408, 'Nearby Test'),
    ('nearby.test09@levelup.local', 'Nearby Practice Course 09', 'A local demo course for testing nearby instructor results.', 409, 'Nearby Test'),
    ('nearby.test10@levelup.local', 'Nearby Practice Course 10', 'A local demo course for testing nearby instructor results.', 410, 'Nearby Test'),
    ('nearby.test11@levelup.local', 'Nearby Practice Course 11', 'A local demo course for testing nearby instructor results.', 411, 'Nearby Test'),
    ('nearby.test12@levelup.local', 'Nearby Practice Course 12', 'A local demo course for testing nearby instructor results.', 412, 'Nearby Test'),
    ('nearby.test13@levelup.local', 'Nearby Practice Course 13', 'A local demo course for testing nearby instructor results.', 413, 'Nearby Test'),
    ('nearby.test14@levelup.local', 'Nearby Practice Course 14', 'A local demo course for testing nearby instructor results.', 414, 'Nearby Test'),
    ('nearby.test15@levelup.local', 'Nearby Practice Course 15', 'A local demo course for testing nearby instructor results.', 415, 'Nearby Test'),
    ('nearby.test16@levelup.local', 'Nearby Practice Course 16', 'A local demo course for testing nearby instructor results.', 416, 'Nearby Test'),
    ('nearby.test17@levelup.local', 'Nearby Practice Course 17', 'A local demo course for testing nearby instructor results.', 417, 'Nearby Test'),
    ('nearby.test18@levelup.local', 'Nearby Practice Course 18', 'A local demo course for testing nearby instructor results.', 418, 'Nearby Test'),
    ('nearby.test19@levelup.local', 'Nearby Practice Course 19', 'A local demo course for testing nearby instructor results.', 419, 'Nearby Test'),
    ('nearby.test20@levelup.local', 'Nearby Practice Course 20', 'A local demo course for testing nearby instructor results.', 420, 'Nearby Test'),
    ('nearby.test21@levelup.local', 'Nearby Practice Course 21', 'A local demo course for testing nearby instructor results.', 421, 'Nearby Test'),
    ('nearby.test22@levelup.local', 'Nearby Practice Course 22', 'A local demo course for testing nearby instructor results.', 422, 'Nearby Test'),
    ('nearby.test23@levelup.local', 'Nearby Practice Course 23', 'A local demo course for testing nearby instructor results.', 423, 'Nearby Test'),
    ('nearby.test24@levelup.local', 'Nearby Practice Course 24', 'A local demo course for testing nearby instructor results.', 424, 'Nearby Test'),
    ('nearby.test25@levelup.local', 'Nearby Practice Course 25', 'A local demo course for testing nearby instructor results.', 425, 'Nearby Test')
) AS demo(email, title, description, price, category)
  ON users.email = demo.email
WHERE NOT EXISTS (
  SELECT 1
  FROM courses existing
  WHERE existing.instructor_id = users.id
    AND existing.title = demo.title
);

-- Optional verification after running the seed:
--
-- SELECT
--   u.name,
--   ip.latitude,
--   ip.longitude,
--   ROUND((
--     6371 * acos(
--       LEAST(1, GREATEST(-1,
--         cos(radians(22.730729)) * cos(radians(ip.latitude))
--         * cos(radians(ip.longitude) - radians(75.872913))
--         + sin(radians(22.730729)) * sin(radians(ip.latitude))
--       ))
--     )
--   )::numeric, 2) AS distance_km
-- FROM users u
-- JOIN instructor_profiles ip ON ip.user_id = u.id
-- WHERE u.email LIKE 'nearby.test%@levelup.local'
-- ORDER BY distance_km;
