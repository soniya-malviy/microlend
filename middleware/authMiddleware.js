const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads "Authorization: Bearer <token>", verifies JWT, sets req.user
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = User.toPublicUser(user);
    return next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = authMiddleware;
