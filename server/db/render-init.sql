-- server/db/render-init.sql
-- Consolidated single-pass initialization & seed script for LevelUp on Render.
-- Idempotent: Can be run on a fresh or existing PostgreSQL database.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. SCHEMAS & TABLES
-- ============================================================

-- users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_root ON categories (name) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_unique_child ON categories (name, parent_id) WHERE parent_id IS NOT NULL;

-- courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  delivery_mode VARCHAR(20) CHECK (delivery_mode IN ('online', 'offline', 'hybrid')),
  language VARCHAR(50),
  thumbnail_url TEXT,
  duration_weeks INTEGER,
  capacity INTEGER,
  curriculum TEXT,
  outcomes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  parent_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_parent_course_id ON courses(parent_course_id);

-- instructor_profiles table
CREATE TABLE IF NOT EXISTS instructor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  phone VARCHAR(20),
  city VARCHAR(150),
  latitude NUMERIC(9, 6),
  longitude NUMERIC(9, 6),
  avatar_url TEXT
);

-- enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);

-- reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);

-- sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('doubt', 'offline', 'mock_test')),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);

-- course_modules table
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'available')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id);

-- course_lectures table
CREATE TABLE IF NOT EXISTS course_lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  duration_seconds INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'available')),
  is_trial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_lectures_module ON course_lectures(module_id);

-- lecture_progress table
CREATE TABLE IF NOT EXISTS lecture_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lecture_id UUID NOT NULL REFERENCES course_lectures(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, lecture_id)
);
CREATE INDEX IF NOT EXISTS idx_lecture_progress_student ON lecture_progress(student_id);

-- payments table (Branch 14 / PaymentGateway)
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_course ON payments(course_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(razorpay_order_id);


-- ============================================================
-- 2. SEED CATEGORIES TREE
-- ============================================================

INSERT INTO categories (name)
SELECT 'Technology'
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE name = 'Technology' AND parent_id IS NULL
);

INSERT INTO categories (name, parent_id)
SELECT subcategory.name, technology.id
FROM (
  VALUES
    ('Programming'),
    ('Web Development'),
    ('Data & AI'),
    ('Cybersecurity'),
    ('Design & Multimedia')
) AS subcategory(name)
CROSS JOIN categories AS technology
WHERE technology.name = 'Technology'
  AND technology.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.name = subcategory.name AND c.parent_id = technology.id
  );

INSERT INTO categories (name, parent_id)
SELECT topic.name, subcategory.id
FROM (
  VALUES
    ('Programming', 'Python'),
    ('Programming', 'JavaScript'),
    ('Programming', 'Java'),
    ('Programming', 'C / C++'),
    ('Programming', 'Other'),
    ('Web Development', 'Frontend'),
    ('Web Development', 'Backend'),
    ('Web Development', 'Full Stack'),
    ('Web Development', 'Other'),
    ('Data & AI', 'Data Analysis'),
    ('Data & AI', 'Machine Learning'),
    ('Data & AI', 'Artificial Intelligence'),
    ('Data & AI', 'Other'),
    ('Cybersecurity', 'Network Security'),
    ('Cybersecurity', 'Ethical Hacking'),
    ('Cybersecurity', 'Cloud Security'),
    ('Cybersecurity', 'Other'),
    ('Design & Multimedia', 'UI / UX Design'),
    ('Design & Multimedia', 'Graphic Design'),
    ('Design & Multimedia', 'Video & Animation'),
    ('Design & Multimedia', 'Other')
) AS topic(subcategory_name, name)
JOIN categories AS subcategory ON subcategory.name = topic.subcategory_name
JOIN categories AS technology ON technology.id = subcategory.parent_id AND technology.name = 'Technology'
WHERE NOT EXISTS (
  SELECT 1 FROM categories c WHERE c.name = topic.name AND c.parent_id = subcategory.id
);

-- ============================================================
-- 3. SEED USERS (5 Instructors + 1 Student, password: 64006400)
-- ============================================================

INSERT INTO users (name, email, password_hash, role, avatar_url)
VALUES
  (
    'Shreyash Donal',
    'shreyash1instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
  ),
  (
    'Pooja Rathore',
    'shreyash2instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
  ),
  (
    'Rohan Mehta',
    'shreyash3instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  ),
  (
    'Kavita Patel',
    'shreyash4instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80'
  ),
  (
    'Vikram Malhotra',
    'shreyash5instructor@gmail.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'instructor',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
  ),
  (
    'Aarav Sharma',
    'student@levelup.com',
    '$2a$10$xFr4SC7Gs/f..vMH18zUMOczaPtwJTSWhkwMrEmgMd/bYoDUf4Knq',
    'student',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
  )
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url;

-- ============================================================
-- 4. SEED INSTRUCTOR PROFILES (Indore coordinates)
-- ============================================================

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
      'Senior Full Stack Architect with 10+ years building scalable distributed microservices in Java, Spring Boot, and React. Passionate about mentoring students in clean architecture, performance tuning, and practical software engineering.',
      '+91 98260 12341',
      'Indore',
      22.730812::numeric,
      75.872910::numeric,
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash2instructor@gmail.com',
      'Lead Data Scientist and Machine Learning Researcher specializing in Python, Deep Learning, and Predictive Analytics. Conducts hands-on offline workshops and industry-aligned capstone mentorship.',
      '+91 98260 12342',
      'Indore',
      22.738000::numeric,
      75.881000::numeric,
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash3instructor@gmail.com',
      'Certified Java Enterprise Specialist and Backend Engineer. 8+ years designing high-throughput relational database architectures, Spring Cloud microservices, and DevOps deployment pipelines.',
      '+91 98260 12343',
      'Indore',
      22.721500::numeric,
      75.864000::numeric,
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash4instructor@gmail.com',
      'Frontend Specialist & UI/UX Design Technologist with deep expertise in React 18, TypeScript, Design Systems, and Web Accessibility. Trains aspiring engineers in modern web craft.',
      '+91 98260 12344',
      'Indore',
      22.745000::numeric,
      75.892000::numeric,
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80'
    ),
    (
      'shreyash5instructor@gmail.com',
      'Cybersecurity Consultant and Ethical Hacking Instructor with 12+ years securing cloud infrastructure, conducting vulnerability assessments, and defensive penetration testing.',
      '+91 98260 12345',
      'Indore',
      22.712000::numeric,
      75.851000::numeric,
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    )
) AS demo(email, bio, phone, city, latitude, longitude, avatar_url)
  ON demo.email = users.email
ON CONFLICT (user_id) DO UPDATE
SET bio = EXCLUDED.bio,
    phone = EXCLUDED.phone,
    city = EXCLUDED.city,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    avatar_url = EXCLUDED.avatar_url;

-- ============================================================
-- 5. SEED CURATED COURSES
-- ============================================================

INSERT INTO courses (
  title,
  description,
  price,
  instructor_id,
  category_id,
  level,
  delivery_mode,
  language,
  thumbnail_url,
  duration_weeks,
  capacity,
  curriculum,
  outcomes,
  status
)
SELECT
  demo.title,
  demo.description,
  demo.price,
  users.id,
  cat.id,
  demo.level,
  demo.delivery_mode,
  demo.language,
  demo.thumbnail_url,
  demo.duration_weeks,
  demo.capacity,
  demo.curriculum,
  demo.outcomes,
  'published'
FROM (
  VALUES
    (
      'shreyash1instructor@gmail.com',
      'Full Stack Java Developer: Spring Boot, Microservices & React',
      'Master enterprise full-stack software development from the ground up. This intensive program bridges fundamental Object-Oriented Java with production-grade backend engineering using Spring Boot 3, Hibernate JPA, and PostgreSQL. Ideal for developers aiming for high-impact software engineering roles.',
      4999.00,
      'Full Stack',
      'Web Development',
      'intermediate',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
      12,
      35,
      E'Week 1-3: Advanced Java, Streams API, and Multithreading Foundations\nWeek 4-6: Spring Boot 3 Core, Dependency Injection, REST APIs & PostgreSQL JPA\nWeek 7-8: Microservices Architecture, API Gateway & Eureka Service Discovery\nWeek 9-10: JWT Security, Role-Based Access Control & Unit Testing with JUnit 5\nWeek 11-12: Modern React 18 Frontend, State Management & Full-Stack Cloud Deployment',
      E'Architect scalable microservices using Spring Boot 3 and Spring Cloud\nImplement robust authentication and RBAC with Spring Security and JWT\nDesign, normalize, and query high-throughput relational databases with PostgreSQL and Hibernate\nDevelop interactive single-page dashboards using React 18 and Redux Toolkit\nContainerize full-stack services with Docker and setup CI/CD deployment pipelines'
    ),
    (
      'shreyash1instructor@gmail.com',
      'Hands-on React & Modern Frontend Engineering Masterclass',
      'Build rich, accessible, production-ready frontend web applications. Delve deep into React 18 core fundamentals including hooks, concurrent rendering, custom hooks, and memoization techniques.',
      3499.00,
      'Frontend',
      'Web Development',
      'beginner',
      'online',
      'English',
      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
      8,
      50,
      E'Week 1-2: Modern JavaScript (ES6+), DOM, and React Component Architecture\nWeek 3-4: State, Hooks (useState, useEffect, useMemo, useCallback) and Custom Hooks\nWeek 5-6: Global State with Redux Toolkit and Context API\nWeek 7-8: Routing with React Router v6, Tailwind CSS, Performance Optimization & Vercel Deployment',
      E'Master component-driven architecture with React 18 and JSX\nManage scalable global state using Redux Toolkit and modern Context patterns\nImplement responsive, accessible UI layouts with Tailwind CSS\nOptimize frontend bundles for sub-second Core Web Vitals performance\nDeploy and host production web apps with continuous deployment'
    ),
    (
      'shreyash2instructor@gmail.com',
      'Python for Data Science, Machine Learning & Predictive Analytics',
      'A comprehensive classroom bootcamp for turning raw data into strategic machine learning insights. Work with Pandas, NumPy, Scikit-Learn, and Seaborn on real-world datasets.',
      5999.00,
      'Machine Learning',
      'Data & AI',
      'beginner',
      'offline',
      'English',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      14,
      25,
      E'Week 1-3: Python Programming, Vectorized Computing with NumPy & Pandas Data Wrangling\nWeek 4-6: Exploratory Data Analysis (EDA), Statistical Inference & Data Visualization with Seaborn\nWeek 7-9: Classical Machine Learning: Regression, Classification, Clustering & Scikit-Learn Pipelines\nWeek 10-12: Deep Learning Foundations with PyTorch, Model Evaluation, Cross-Validation & Hyperparameter Tuning\nWeek 13-14: End-to-End ML Model Deployment with FastAPI and Streamlit',
      E'Clean, transform, and analyze complex unstructured data using Pandas and NumPy\nBuild, tune, and evaluate predictive machine learning models with Scikit-Learn\nVisualize multi-dimensional statistical patterns with Matplotlib and Seaborn\nImplement neural network architectures using PyTorch\nDeploy production ML inference APIs using FastAPI and cloud containers'
    ),
    (
      'shreyash3instructor@gmail.com',
      'Core Java Programming & Object-Oriented Design Fundamentals',
      'Build an rock-solid programming foundation with Java 21. From OOP principles, polymorphic abstractions, interfaces, exception handling, to collection frameworks and memory models.',
      2999.00,
      'Java',
      'Programming',
      'beginner',
      'offline',
      'English',
      'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
      10,
      30,
      E'Week 1-2: Java Syntax, Variables, Control Flow, and Memory Stack vs Heap\nWeek 3-4: Object-Oriented Programming: Encapsulation, Inheritance, Polymorphism & Abstract Classes\nWeek 5-6: Java Collections Framework: Lists, Sets, Maps, Generics & Iterators\nWeek 7-8: Robust Exception Handling, File I/O Streams & Modern Serialization\nWeek 9-10: Java 8-21 Features: Lambdas, Streams API, Virtual Threads & Mini-Project',
      E'Understand core Java syntax, memory management, and runtime execution\nDesign clean, modular software systems using robust Object-Oriented principles\nLeverage Java Collections effectively for high-performance data processing\nWrite expressive, functional code using Java Streams and Lambda expressions\nConfidently tackle technical Java coding interviews and assessments'
    ),
    (
      'shreyash4instructor@gmail.com',
      'UI/UX Design Systems, Prototyping & Modern Figma Masterclass',
      'Master the complete product design cycle from user research and wireframing to enterprise Figma design systems and interactive prototyping.',
      3999.00,
      'UI / UX Design',
      'Design & Multimedia',
      'intermediate',
      'hybrid',
      'English',
      'https://images.unsplash.com/photo-1581291518655-9523c932deda?w=800&auto=format&fit=crop&q=80',
      8,
      28,
      E'Week 1-2: Design Thinking, User Research, Journey Mapping & Information Architecture\nWeek 3-4: Figma Fundamentals, Typography, Color Palettes & Auto-Layout 5.0\nWeek 5-6: Scalable Component Architecture, Design Tokens, Variables & Interactive Components\nWeek 7-8: Advanced Prototyping, Usability Testing, Developer Hand-off & Portfolio Showcase',
      E'Conduct actionable user research and synthesize empathetic user personas\nArchitect scalable, modular Figma component libraries with variables and design tokens\nCreate pixel-perfect, accessible interface layouts following WCAG guidelines\nBuild realistic, micro-interactive prototypes for client presentations\nPrepare industry-grade design specifications for frictionless developer hand-off'
    ),
    (
      'shreyash5instructor@gmail.com',
      'Ethical Hacking, Network Defense & Cybersecurity Operations',
      'Defend corporate infrastructure and uncover critical vulnerabilities through professional penetration testing methodologies and defensive security controls.',
      6499.00,
      'Ethical Hacking',
      'Cybersecurity',
      'advanced',
      'online',
      'English',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      12,
      40,
      E'Week 1-3: Networking Protocols (TCP/IP, DNS, OSI), Linux Security Foundations & Kali Linux Setup\nWeek 4-6: Passive & Active Reconnaissance, Nmap Network Scanning & Vulnerability Assessment\nWeek 7-9: Web Application Penetration Testing (OWASP Top 10, SQLi, XSS, CSRF, Authentication Bypass)\nWeek 10-11: Network Exploitation with Metasploit, Privilege Escalation & Active Directory Basics\nWeek 12: Remediation Engineering, Security Hardening & Incident Response Reporting',
      E'Analyze network traffic and identify protocol vulnerabilities using Wireshark and Nmap\nPerform comprehensive web application penetration tests against the OWASP Top 10\nIdentify and exploit operating system misconfigurations and software vulnerabilities\nDraft professional security audit reports with prioritized remediation plans\nImplement defensive perimeter controls, firewalls, and intrusion detection systems'
    )
) AS demo(email, title, description, price, topic_name, subcat_name, level, delivery_mode, language, thumbnail_url, duration_weeks, capacity, curriculum, outcomes)
JOIN users ON users.email = demo.email
JOIN categories cat ON cat.name = demo.topic_name
WHERE NOT EXISTS (
  SELECT 1 FROM courses c WHERE c.title = demo.title AND c.instructor_id = users.id
);

-- ============================================================
-- 6. SEED COURSE MODULES & TRIAL LECTURES
-- ============================================================

-- Add Module 1 for each course
INSERT INTO course_modules (course_id, title, position)
SELECT courses.id, 'Module 1: Foundations & Architecture Overview', 1
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules cm WHERE cm.course_id = courses.id AND cm.position = 1
);

-- Add Module 2 for each course
INSERT INTO course_modules (course_id, title, position)
SELECT courses.id, 'Module 2: Practical Implementation & Deep Dive', 2
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM course_modules cm WHERE cm.course_id = courses.id AND cm.position = 2
);

-- Add Free Trial Preview Lecture for Module 1
INSERT INTO course_lectures (module_id, title, content, video_url, duration_minutes, duration_seconds, position, status, is_trial)
SELECT
  cm.id,
  'Course Orientation & Architecture Walkthrough',
  'Welcome to the course! In this introductory lecture, we explore the comprehensive roadmap, setup our development environment, and build our foundational hello-world project.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  12,
  720,
  1,
  'available',
  true
FROM course_modules cm
WHERE cm.position = 1
  AND NOT EXISTS (
    SELECT 1 FROM course_lectures cl WHERE cl.module_id = cm.id AND cl.position = 1
  );

-- Add Locked Lecture 2 for Module 1
INSERT INTO course_lectures (module_id, title, content, video_url, duration_minutes, duration_seconds, position, status, is_trial)
SELECT
  cm.id,
  'Core Principles, Workflow Setup & Best Practices',
  'Deep dive into the underlying design principles, production configuration, and setting up industry-standard linters, formatters, and environment variables.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  24,
  1440,
  2,
  'available',
  false
FROM course_modules cm
WHERE cm.position = 1
  AND NOT EXISTS (
    SELECT 1 FROM course_lectures cl WHERE cl.module_id = cm.id AND cl.position = 2
  );

-- Add Locked Lecture 1 for Module 2
INSERT INTO course_lectures (module_id, title, content, video_url, duration_minutes, duration_seconds, position, status, is_trial)
SELECT
  cm.id,
  'Advanced Component Engineering & State Architecture',
  'Detailed exploration of advanced component patterns, custom hooks, and scalable state management.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  35,
  2100,
  1,
  'available',
  false
FROM course_modules cm
WHERE cm.position = 2
  AND NOT EXISTS (
    SELECT 1 FROM course_lectures cl WHERE cl.module_id = cm.id AND cl.position = 1
  );

-- ============================================================
-- 7. SEED INITIAL SESSIONS (In-Person Meetups & Online Doubts)
-- ============================================================

INSERT INTO sessions (course_id, session_type, title, description, scheduled_at, location)
SELECT
  c.id,
  CASE WHEN c.delivery_mode = 'offline' THEN 'offline'
       WHEN c.delivery_mode = 'online' THEN 'doubt'
       ELSE 'offline' END,
  CASE WHEN c.delivery_mode = 'offline' THEN 'Classroom Lab & Code Review'
       WHEN c.delivery_mode = 'online' THEN 'Weekly Live Q&A and Doubt Solving'
       ELSE 'In-Person Practical Architecture Meetup' END,
  'Join the session to review project code, clear technical doubts, and discuss industry architectures.',
  NOW() + INTERVAL '3 days',
  CASE WHEN c.delivery_mode = 'online' THEN 'https://meet.google.com/abc-defg-hij'
       ELSE 'Indore MG Road Center — Lab 3' END
FROM courses c
WHERE NOT EXISTS (
  SELECT 1 FROM sessions s WHERE s.course_id = c.id
);

-- ============================================================
-- 8. SEED DEFAULT REVIEWS
-- ============================================================

INSERT INTO reviews (student_id, course_id, rating, comment)
SELECT
  u.id,
  c.id,
  5,
  'Outstanding course! The practical real-world examples and clear explanations made complex concepts easy to understand.'
FROM courses c
CROSS JOIN users u
WHERE u.email = 'student@levelup.com'
  AND NOT EXISTS (
    SELECT 1 FROM reviews r WHERE r.course_id = c.id AND r.student_id = u.id
  )
LIMIT 3;
