-- db/schema.sql
-- This file is just a running RECORD of your database structure - it is
-- not executed automatically. Every time we add SQL here, you paste that
-- same SQL into pgAdmin's Query Tool and run it there.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- users table
-- Holds both students and instructors — the `role` column tells
-- them apart, so we don't need two separate tables.
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up login lookups (WHERE email = ...)
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- courses table
-- Each course belongs to one instructor (a user with role = 'instructor').
-- ============================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  instructor_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "show all courses by this instructor" queries
CREATE INDEX idx_courses_instructor ON courses(instructor_id);

-- ============================================================
-- enrollments table
-- Links a student to a course they've signed up for.
-- ============================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

-- Speeds up "who is enrolled in this course" queries
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
