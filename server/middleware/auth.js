// middleware/auth.js
// requireAuth checks that a valid JWT was sent, and attaches the
// logged-in user's info to req.user so later routes can use it.
// requireRole checks req.user.role after requireAuth has already run.

const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  // Tokens are sent as: Authorization: Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.userId, role: payload.role };
    next(); // token is valid, let the request continue to the actual route
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Use AFTER requireAuth on routes that only certain roles should access.
// Example: router.post('/courses', requireAuth, requireRole('instructor'), ...)
function requireRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Only ${role}s can do this` });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
