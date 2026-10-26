// routes/categories.js
// Public route for loading the complete course category tree.

const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET /api/categories
// Returns categories as a nested tree so the frontend can build cascading
// Category -> Subcategory -> Topic selectors from one response.
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, parent_id
       FROM categories
       ORDER BY name`
    );

    const categoriesById = new Map();
    const rootCategories = [];

    for (const row of result.rows) {
      categoriesById.set(row.id, {
        id: row.id,
        name: row.name,
        children: [],
      });
    }

    for (const row of result.rows) {
      const category = categoriesById.get(row.id);

      if (row.parent_id) {
        const parent = categoriesById.get(row.parent_id);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    }

    res.json({ categories: rootCategories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong loading categories' });
  }
});

module.exports = router;
