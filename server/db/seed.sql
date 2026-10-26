-- server/db/seed.sql
-- Seed 5 Instructors calibrated around user location: 22.730812, 75.872910
-- Password for all accounts: 64006400
-- NOTE: Does NOT insert courses. Course creation will be handled in a separate step.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Insert Users (role: 'instructor')
INSERT INTO users (name, email, password_hash, role)
VALUES
  (
    'Shreyash Donal',
    'shreyash1instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor'
  ),
  (
    'Pooja Rathore',
    'shreyash2instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor'
  ),
  (
    'Rohan Mehta',
    'shreyash3instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor'
  ),
  (
    'Kavita Patel',
    'shreyash4instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor'
  ),
  (
    'Vikram Malhotra',
    'shreyash5instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor'
  )
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- 2. Insert Instructor Profiles (Bio, Phone, City, GPS Coordinates, Avatar)
INSERT INTO instructor_profiles (user_id, bio, phone, city, latitude, longitude, avatar_url)
SELECT
  users.id,
  demo.bio,
  demo.phone,
  demo.city,
  demo.latitude,
  demo.longitude,
  demo.avatar_url
FROM users
JOIN (
  VALUES
    (
      'shreyash1instructor@gmail.com',
      'Senior Full-Stack Architect with 7+ years of experience building enterprise systems in Java Spring Boot and modern MERN ecosystems. Passionate about teaching practical backend microservices, RESTful APIs, and scalable React applications.',
      '9826011001',
      'Indore',
      22.721500,
      75.885000,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash2instructor@gmail.com',
      'Creative Visual Designer & Brand Strategist with 6+ years in digital aesthetics. Specializes in Adobe Creative Suite (Photoshop, Illustrator), Figma UI design, and visual storytelling to help students master commercial graphic design.',
      '9826011002',
      'Indore',
      22.753500,
      75.893000,
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash3instructor@gmail.com',
      'Java Developer and Competitive Programming mentor. Dedicated to demystifying Object-Oriented Programming, memory management, Java Collections Framework, and algorithmic problem-solving for aspiring software engineers.',
      '9826011003',
      'Indore',
      22.699000,
      75.865000,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash4instructor@gmail.com',
      'Frontend Engineer and JavaScript enthusiast. Focused on teaching deep JavaScript fundamentals—from closures and promises to the event loop, modern ES6+ tooling, and browser APIs—through hands-on interactive coding.',
      '9826011004',
      'Indore',
      22.685000,
      75.832000,
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash5instructor@gmail.com',
      'Software Engineer & Python Specialist with extensive background in Python automation, scripting, and backend development. Committed to taking beginners from writing their first Python script to building robust modular systems.',
      '9826011005',
      'Indore',
      22.775000,
      75.935000,
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    )
) AS demo(email, bio, phone, city, latitude, longitude, avatar_url)
  ON users.email = demo.email
ON CONFLICT (user_id) DO UPDATE
SET bio = EXCLUDED.bio,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    avatar_url = EXCLUDED.avatar_url;
