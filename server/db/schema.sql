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

-- ============================================================
-- reviews table
-- A student leaves at most one review per course (rating 1-5, optional comment).
-- ============================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, course_id)
);

-- Speeds up "show all reviews for this course" queries
CREATE INDEX idx_reviews_course ON reviews(course_id);

-- ============================================================
-- instructor_profiles table
-- Extra fields only instructors fill in (bio, phone, location).
-- Kept OUT of the users table because students don't need these
-- columns at all — a separate 1-to-1 table means we're not adding
-- nullable junk to every student row.
-- One row per instructor, created right after they register.
-- ============================================================
CREATE TABLE instructor_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  bio TEXT,
  phone VARCHAR(20),
  location VARCHAR(150)
);

-- ============================================================
-- sessions table
-- One extra "event" tied to a course: a doubt session, an
-- offline in-person meet, or a mock test. All three share the
-- same shape (a course, a time, who's running it), so one table
-- with a `session_type` column instead of three separate tables.
-- Created by the course's instructor.
-- ============================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('doubt', 'offline', 'mock_test')),
  title VARCHAR(150) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "show all sessions for this course" queries
CREATE INDEX idx_sessions_course ON sessions(course_id);

-- ============================================================
-- courses table — new columns (Branch 3 / InstructorFunctionalities)
-- Everything a student needs to see on the course view page, plus
-- fields instructors fill in while building the course.
-- `status` gates visibility: students should only ever see 'published'
-- courses in browse/search — 'draft' courses are still being built.
-- `curriculum` is the instructor's advertised roadmap
-- (free text) — separate from course_modules/course_lectures below,
-- which track what's actually built so far. The two are allowed to
-- differ on purpose (live/hybrid courses grow their real content
-- over time, but the advertised plan doesn't need to change).
-- ============================================================
ALTER TABLE courses
  ADD COLUMN category VARCHAR(100),
  ADD COLUMN level VARCHAR(20) CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN delivery_mode VARCHAR(20) CHECK (delivery_mode IN ('online', 'offline', 'hybrid')),
  ADD COLUMN language VARCHAR(50),
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN duration_weeks INTEGER,
  ADD COLUMN capacity INTEGER,
  ADD COLUMN curriculum TEXT,
  ADD COLUMN outcomes TEXT,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published'));

-- ============================================================
-- course_modules table
-- A module is one major section of a course (e.g. "Week 1: Basics").
-- `position` controls the display order on the course view page.
-- `status` tracks whether this module's content actually exists yet
-- ('planned' = on the roadmap, 'available' = built and ready).
-- ============================================================
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(150) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'available')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "show all modules for this course, in order" queries
CREATE INDEX idx_course_modules_course ON course_modules(course_id);

-- ============================================================
-- course_lectures table
-- A lecture is one piece of actual content inside a module
-- (a video, a text lesson, etc). Same 'planned'/'available' status
-- idea as modules, and its own `position` for ordering within
-- the module.
-- ============================================================
CREATE TABLE course_lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id),
  title VARCHAR(150) NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'available')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up "show all lectures for this module, in order" queries
CREATE INDEX idx_course_lectures_module ON course_lectures(module_id);
