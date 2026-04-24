// ─────────────────────────────────────────
//  FamTrack — JWT Auth Middleware
// ─────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'Authorization header required' });

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.consentGiven) return res.status(403).json({ error: 'Consent required' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
