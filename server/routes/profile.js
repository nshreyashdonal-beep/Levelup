// routes/profile.js
// Profile management routes for both students and instructors.
// Enables reading full profile details, updating personal info (including email with duplicate check),
// uploading avatar, updating instructor geolocation and credentials, and changing passwords.

const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
// Returns current authenticated user's profile.
// Includes extended bio/phone/city/lat/lng for instructors.
router.get('/', requireAuth, async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, name, email, role, avatar_url, created_at 
       FROM users 
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];

    let instructorDetails = null;
    if (user.role === 'instructor') {
      const instRes = await db.query(
        `SELECT bio, phone, city, latitude, longitude, avatar_url 
         FROM instructor_profiles 
         WHERE user_id = $1`,
        [req.user.id]
      );

      if (instRes.rows.length > 0) {
        instructorDetails = instRes.rows[0];
      }
    }

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url || instructorDetails?.avatar_url || null,
      created_at: user.created_at,
      bio: instructorDetails?.bio || '',
      phone: instructorDetails?.phone || '',
      city: instructorDetails?.city || '',
      latitude: instructorDetails?.latitude ?? null,
      longitude: instructorDetails?.longitude ?? null,
    };

    res.json(profile);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/profile
// Updates user information (name, email, avatar_url), password change, and instructor fields.
router.patch('/', requireAuth, async (req, res) => {
  const {
    name,
    email,
    avatar_url,
    bio,
    phone,
    city,
    latitude,
    longitude,
    currentPassword,
    newPassword,
  } = req.body;

  try {
    // 1. Verify user exists
    const userRes = await db.query(
      'SELECT id, name, email, password_hash, role, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = userRes.rows[0];

    // 2. Handle Password Change (if requested)
    let updatedPasswordHash = currentUser.password_hash;
    if (newPassword) {
      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: 'Current password is required to change password' });
      }

      if (typeof newPassword !== 'string' || newPassword.trim().length < 6) {
        return res
          .status(400)
          .json({ error: 'New password must be at least 6 characters' });
      }

      const match = await bcrypt.compare(currentPassword, currentUser.password_hash);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      updatedPasswordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    // 3. Prepare updated name
    const updatedName = typeof name === 'string' && name.trim().length > 0
      ? name.trim()
      : currentUser.name;

    // 4. Handle Email Modification & Duplicate Prevention
    let updatedEmail = currentUser.email;
    if (typeof email === 'string' && email.trim().length > 0) {
      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail !== currentUser.email.toLowerCase()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ error: 'Please enter a valid email address' });
        }

        const duplicateCheck = await db.query(
          'SELECT id FROM users WHERE LOWER(email) = $1 AND id != $2',
          [trimmedEmail, currentUser.id]
        );

        if (duplicateCheck.rows.length > 0) {
          return res.status(409).json({ error: 'An account with that email already exists' });
        }

        updatedEmail = trimmedEmail;
      }
    }

    // 5. Avatar URL can be updated or explicitly preserved
    const updatedAvatar = avatar_url !== undefined
      ? avatar_url
      : currentUser.avatar_url;

    // 6. Update users table with name, email, avatar, password
    await db.query(
      `UPDATE users 
       SET name = $1, email = $2, avatar_url = $3, password_hash = $4 
       WHERE id = $5`,
      [updatedName, updatedEmail, updatedAvatar, updatedPasswordHash, currentUser.id]
    );

    // 7. If instructor, upsert instructor_profiles
    if (currentUser.role === 'instructor') {
      const parsedLat = latitude !== undefined && latitude !== '' && latitude !== null
        ? parseFloat(latitude)
        : null;
      const parsedLng = longitude !== undefined && longitude !== '' && longitude !== null
        ? parseFloat(longitude)
        : null;

      await db.query(
        `INSERT INTO instructor_profiles (user_id, bio, phone, city, latitude, longitude, avatar_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
           bio = COALESCE(EXCLUDED.bio, instructor_profiles.bio),
           phone = COALESCE(EXCLUDED.phone, instructor_profiles.phone),
           city = COALESCE(EXCLUDED.city, instructor_profiles.city),
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           avatar_url = COALESCE(EXCLUDED.avatar_url, instructor_profiles.avatar_url)`,
        [
          currentUser.id,
          bio !== undefined ? (bio || null) : null,
          phone !== undefined ? (phone || null) : null,
          city !== undefined ? (city || null) : null,
          parsedLat,
          parsedLng,
          updatedAvatar,
        ]
      );
    }

    // 8. Fetch full updated profile to return
    const refreshedUserRes = await db.query(
      `SELECT id, name, email, role, avatar_url, created_at FROM users WHERE id = $1`,
      [currentUser.id]
    );
    const refreshedUser = refreshedUserRes.rows[0];

    let instructorDetails = null;
    if (refreshedUser.role === 'instructor') {
      const instRes = await db.query(
        `SELECT bio, phone, city, latitude, longitude, avatar_url 
         FROM instructor_profiles 
         WHERE user_id = $1`,
        [refreshedUser.id]
      );
      if (instRes.rows.length > 0) {
        instructorDetails = instRes.rows[0];
      }
    }

    const fullProfile = {
      id: refreshedUser.id,
      name: refreshedUser.name,
      email: refreshedUser.email,
      role: refreshedUser.role,
      avatar_url: refreshedUser.avatar_url || instructorDetails?.avatar_url || null,
      created_at: refreshedUser.created_at,
      bio: instructorDetails?.bio || '',
      phone: instructorDetails?.phone || '',
      city: instructorDetails?.city || '',
      latitude: instructorDetails?.latitude ?? null,
      longitude: instructorDetails?.longitude ?? null,
    };

    res.json({
      message: 'Profile updated successfully',
      profile: fullProfile,
      user: {
        id: refreshedUser.id,
        name: refreshedUser.name,
        email: refreshedUser.email,
        role: refreshedUser.role,
        avatar_url: refreshedUser.avatar_url,
      },
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
