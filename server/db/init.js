// server/db/init.js
// Automated single-pass database runner for local and cloud environments (e.g. Render).
// Usage:
//   Local: node server/db/init.js
//   Cloud (Render): DATABASE_URL="<external-url>" npm --prefix server run db:init

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Resolve .env path if local
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is missing.');
  console.error('Please provide DATABASE_URL via .env or CLI argument.');
  process.exit(1);
}

const isLocal =
  connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function initializeDatabase() {
  console.log('----------------------------------------------------');
  console.log('LevelUp Database Initializer & Seeder');
  console.log('Target:', isLocal ? 'Local PostgreSQL' : 'Remote Cloud PostgreSQL (Render)');
  console.log('----------------------------------------------------');

  const client = await pool.connect();
  try {
    console.log('1. Connected to database. Reading render-init.sql...');
    const sqlPath = path.join(__dirname, 'render-init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('2. Executing consolidated schema, constraints, and seed data...');
    const startTime = Date.now();
    await client.query(sql);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✓ SQL execution finished successfully in ${duration}s!`);

    console.log('\n3. Verifying populated table counts:');
    const tables = [
      'users',
      'categories',
      'courses',
      'instructor_profiles',
      'course_modules',
      'course_lectures',
      'sessions',
      'reviews',
    ];

    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
        console.log(`   - ${table.padEnd(20)}: ${res.rows[0].count} records`);
      } catch (err) {
        console.log(`   - ${table.padEnd(20)}: [table not found or error]`);
      }
    }

    console.log('\n====================================================');
    console.log('✓ Database is 100% initialized, seeded, and ready!');
    console.log('Default Seed Accounts:');
    console.log('  Instructor: shreyash1instructor@gmail.com (Password: 64006400)');
    console.log('  Student:    student@levelup.com          (Password: 64006400)');
    console.log('====================================================');
  } catch (err) {
    console.error('\n✗ Database initialization failed:');
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();
