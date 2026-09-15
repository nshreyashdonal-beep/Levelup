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
