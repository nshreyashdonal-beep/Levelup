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

-- Insert courses with structured category_id references mapped to leaf topics
INSERT INTO courses (
  title,
  description,
  price,
  instructor_id,
  category_id,
  level,
  delivery_mode,
  language,
  status
)
SELECT demo.title,
       demo.description,
       demo.price,
       users.id,
       topic.id AS category_id,
       demo.level,
       demo.delivery_mode,
       'English',
       'published'
FROM users
JOIN (
  VALUES
    ('demo.riya@levelup.local', 'Design Thinking for Beginners', 'Learn a practical process for turning ideas into clear user-focused designs.', 799, 'Design & Multimedia', 'UI / UX Design', 'beginner', 'hybrid'),
    ('demo.arjun@levelup.local', 'Capture Your City', 'Build photography fundamentals through guided city and street projects.', 599, 'Design & Multimedia', 'Other', 'beginner', 'offline'),
    ('demo.neha@levelup.local', 'Speak with Confidence', 'Practice everyday English speaking, listening, and presentation skills.', 499, 'Programming', 'Other', 'intermediate', 'online'),
    ('demo.kabir@levelup.local', 'Digital Marketing Foundations', 'Learn the core channels and habits behind a simple marketing plan.', 699, 'Programming', 'Other', 'beginner', 'hybrid'),
    ('demo.meera@levelup.local', 'Classical Dance Basics', 'Develop rhythm, posture, and foundational movement through guided practice.', 899, 'Programming', 'Other', 'beginner', 'offline'),
    ('demo.dev@levelup.local', 'Python Programming Foundations', 'Write useful beginner Python programs with hands-on exercises.', 999, 'Programming', 'Python', 'beginner', 'online')
) AS demo(email, title, description, price, subcategory_name, topic_name, level, delivery_mode)
  ON users.email = demo.email
JOIN categories AS subcategory
  ON subcategory.name = demo.subcategory_name
JOIN categories AS topic
  ON topic.parent_id = subcategory.id
 AND topic.name = demo.topic_name
WHERE NOT EXISTS (
  SELECT 1
  FROM courses existing
  WHERE existing.instructor_id = users.id
    AND existing.title = demo.title
);

-- Backfill category_id for any existing demo courses inserted before Branch 6
UPDATE courses
SET category_id = mapping.topic_id
FROM (
  SELECT c.id AS course_id, topic.id AS topic_id
  FROM courses c
  JOIN users u ON c.instructor_id = u.id
  JOIN (
    VALUES
      ('demo.riya@levelup.local', 'Design Thinking for Beginners', 'Design & Multimedia', 'UI / UX Design'),
      ('demo.arjun@levelup.local', 'Capture Your City', 'Design & Multimedia', 'Other'),
      ('demo.neha@levelup.local', 'Speak with Confidence', 'Programming', 'Other'),
      ('demo.kabir@levelup.local', 'Digital Marketing Foundations', 'Programming', 'Other'),
      ('demo.meera@levelup.local', 'Classical Dance Basics', 'Programming', 'Other'),
      ('demo.dev@levelup.local', 'Python Programming Foundations', 'Programming', 'Python')
  ) AS target(email, title, subcategory_name, topic_name)
    ON u.email = target.email AND c.title = target.title
  JOIN categories subcategory ON subcategory.name = target.subcategory_name
  JOIN categories topic ON topic.parent_id = subcategory.id AND topic.name = target.topic_name
) AS mapping
WHERE courses.id = mapping.course_id
  AND courses.category_id IS NULL;

-- Branch 7 / InstructorLectureStudio demo lecture content.
-- These URLs are examples only; the video bytes are hosted externally.
-- The script is repeatable and never stores media files on the server.
INSERT INTO course_modules (course_id, title, position, status)
SELECT courses.id, demo.module_title, demo.position, 'available'
FROM courses
JOIN users ON users.id = courses.instructor_id
JOIN (
  VALUES
    ('demo.riya@levelup.local', 'Design Thinking for Beginners', 'Design Foundations', 0),
    ('demo.arjun@levelup.local', 'Capture Your City', 'Photography Foundations', 0),
    ('demo.neha@levelup.local', 'Speak with Confidence', 'Communication Practice', 0),
    ('demo.kabir@levelup.local', 'Digital Marketing Foundations', 'Marketing Fundamentals', 0),
    ('demo.meera@levelup.local', 'Classical Dance Basics', 'Movement Foundations', 0),
    ('demo.dev@levelup.local', 'Python Programming Foundations', 'Python Fundamentals', 0)
) AS demo(email, course_title, module_title, position)
  ON users.email = demo.email
 AND courses.title = demo.course_title
WHERE NOT EXISTS (
  SELECT 1
  FROM course_modules existing
  WHERE existing.course_id = courses.id
    AND existing.title = demo.module_title
);

INSERT INTO course_lectures (
  module_id,
  title,
  content,
  video_url,
  duration_minutes,
  position,
  status
)
SELECT modules.id,
       demo.lecture_title,
       demo.content,
       demo.video_url,
       demo.duration_minutes,
       demo.position,
       'available'
FROM course_modules modules
JOIN courses ON courses.id = modules.course_id
JOIN users ON users.id = courses.instructor_id
JOIN (
  VALUES
    (
      'demo.riya@levelup.local',
      'Design Thinking for Beginners',
      'Design Foundations',
      'Design Thinking Overview',
      'Understand the five stages of a practical design-thinking process.',
      'https://www.youtube.com/watch?v=_WI28J3s8jE',
      12,
      0
    ),
    (
      'demo.riya@levelup.local',
      'Design Thinking for Beginners',
      'Design Foundations',
      'Prototype Walkthrough',
      'See how a rough idea becomes a testable prototype.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      30,
      1
    ),
    (
      'demo.arjun@levelup.local',
      'Capture Your City',
      'Photography Foundations',
      'Reading Light in the Street',
      'Learn a simple process for observing light, contrast, and subject placement.',
      'https://www.youtube.com/watch?v=V7z7BAZdt2M',
      18,
      0
    ),
    (
      'demo.dev@levelup.local',
      'Python Programming Foundations',
      'Python Fundamentals',
      'Python Basics',
      'Write your first Python program and understand variables, values, and output.',
      'https://www.youtube.com/watch?v=rfscVS0vtbw',
      35,
      0
    ),
    (
      'demo.dev@levelup.local',
      'Python Programming Foundations',
      'Python Fundamentals',
      'Practice with a Small Program',
      'Use a short exercise to combine input, conditions, and reusable functions.',
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      22,
      1
    )
) AS demo(
  email,
  course_title,
  module_title,
  lecture_title,
  content,
  video_url,
  duration_minutes,
  position
)
  ON users.email = demo.email
 AND courses.title = demo.course_title
 AND modules.title = demo.module_title
WHERE NOT EXISTS (
  SELECT 1
  FROM course_lectures existing
  WHERE existing.module_id = modules.id
    AND existing.title = demo.lecture_title
);
