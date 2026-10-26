// config/db.js
// This creates ONE shared connection ("pool") to Postgres.
// Every other file that needs to run a SQL query imports this same pool
// instead of opening a brand new connection every time.

const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Sanitize connection string by stripping unwanted newlines or whitespace that can occur from UI copy-pastes
const rawDbUrl = process.env.DATABASE_URL || '';
const cleanDbUrl = rawDbUrl.trim().replace(/[\r\n\s]+/g, '');

const isLocal = !cleanDbUrl || cleanDbUrl.includes('localhost') || cleanDbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: cleanDbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Simple helper so other files can just do:
//   const db = require('../config/db');
//   await db.query('SELECT * FROM users');
module.exports = {
  query: (text, params) => pool.query(text, params),
};
