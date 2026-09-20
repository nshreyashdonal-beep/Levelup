-- Branch 5 / NearbyInstructor demo data
-- Run this file in pgAdmin after schema.sql has added instructor_profiles.city,
-- latitude, longitude, and courses.status.
--
-- Demo instructor login password for every account:
-- DemoPassword123!
--
-- The coordinates are intentionally spread across different Indian cities so
-- the public map can be tested from more than one area.

INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Riya Kapoor', 'demo.riya@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Arjun Mehta', 'demo.arjun@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Neha Joshi', 'demo.neha@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Kabir Shah', 'demo.kabir@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Meera Iyer', 'demo.meera@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor'),
  ('Dev Malhotra', 'demo.dev@levelup.local', '$2a$10$xVo8xmd7sRS9n3X8GuV9yugfGP9XsA9I3RtqQL8Pk10igbd.vSIGu', 'instructor')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    role = EXCLUDED.role;

INSERT INTO instructor_profiles (user_id, bio, phone, city, latitude, longitude)
SELECT users.id, demo.bio, demo.phone, demo.city, demo.latitude, demo.longitude
FROM users
JOIN (
  VALUES
    ('demo.riya@levelup.local', 'UI/UX mentor for practical product design.', '9999000001', 'Indore', 22.7196, 75.8577),
    ('demo.arjun@levelup.local', 'Photography instructor focused on visual storytelling.', '9999000002', 'Bhopal', 23.2599, 77.4126),
    ('demo.neha@levelup.local', 'Spoken English coach for confident communication.', '9999000003', 'Pune', 18.5204, 73.8567),
    ('demo.kabir@levelup.local', 'Digital marketing mentor for growing online brands.', '9999000004', 'Jaipur', 26.9124, 75.7873),
    ('demo.meera@levelup.local', 'Classical dance teacher with a performance-first approach.', '9999000005', 'Bengaluru', 12.9716, 77.5946),
    ('demo.dev@levelup.local', 'Python instructor teaching useful programming foundations.', '9999000006', 'New Delhi', 28.6139, 77.2090)
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
       demo.level,
       demo.delivery_mode,
       'English',
       'published'
FROM users
JOIN (
  VALUES
    ('demo.riya@levelup.local', 'Design Thinking for Beginners', 'Learn a practical process for turning ideas into clear user-focused designs.', 799, 'Design', 'beginner', 'hybrid'),
    ('demo.arjun@levelup.local', 'Capture Your City', 'Build photography fundamentals through guided city and street projects.', 599, 'Photography', 'beginner', 'offline'),
    ('demo.neha@levelup.local', 'Speak with Confidence', 'Practice everyday English speaking, listening, and presentation skills.', 499, 'Language', 'intermediate', 'online'),
    ('demo.kabir@levelup.local', 'Digital Marketing Foundations', 'Learn the core channels and habits behind a simple marketing plan.', 699, 'Marketing', 'beginner', 'hybrid'),
    ('demo.meera@levelup.local', 'Classical Dance Basics', 'Develop rhythm, posture, and foundational movement through guided practice.', 899, 'Dance', 'beginner', 'offline'),
    ('demo.dev@levelup.local', 'Python Programming Foundations', 'Write useful beginner Python programs with hands-on exercises.', 999, 'Technology', 'beginner', 'online')
) AS demo(email, title, description, price, category, level, delivery_mode)
  ON users.email = demo.email
WHERE NOT EXISTS (
  SELECT 1
  FROM courses existing
  WHERE existing.instructor_id = users.id
    AND existing.title = demo.title
);
