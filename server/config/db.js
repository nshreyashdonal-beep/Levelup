// config/db.js
// This creates ONE shared connection ("pool") to Postgres.
// Every other file that needs to run a SQL query imports this same pool
// instead of opening a brand new connection every time.

const { Pool } = require('pg');
require('dotenv').config();

// Pool reads DATABASE_URL from your .env file automatically.
const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Simple helper so other files can just do:
//   const db = require('../config/db');
//   await db.query('SELECT * FROM users');
module.exports = {
  query: (text, params) => pool.query(text, params),
};
