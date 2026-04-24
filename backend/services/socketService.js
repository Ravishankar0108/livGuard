// ─────────────────────────────────────────
//  FamTrack — Socket.IO Real-Time Service
// ─────────────────────────────────────────
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = function setupSocketHandlers(io) {

  // ── Auth middleware ──────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ───────────────────────────
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`Socket connected: ${user.name} (${user._id})`);

    // Join family room automatically
    if (user.familyId) {
      socket.join(`family:${user.familyId}`);
      console.log(`${user.name} joined room family:${user.familyId}`);

      // Notify others this member is online
      socket.to(`family:${user.familyId}`).emit('member_online', {
        userId: user._id,
        name: user.name,
        timestamp: new Date()
      });
    }

    // ── Events ────────────────────────────

    // Client joins specific family room
    socket.on('join_family', (familyId) => {
      socket.join(`family:${familyId}`);
    });

    // SOS emergency broadcast
    socket.on('sos', async (data) => {
      const { lat, lng, message } = data;
      if (!user.familyId) return;

      const sosData = {
        userId: user._id,
        name: user.name,
        lat, lng,
        message: message || `${user.name} triggered SOS!`,
        timestamp: new Date()
      };

      // Broadcast to ALL family members
      io.to(`family:${user.familyId}`).emit('sos_alert', sosData);

      // Save to DB
      const { Alert } = require('../models');
      await Alert.create({
        familyId: user.familyId,
        userId: user._id,
        type: 'sos',
        title: `SOS from ${user.name}!`,
        body: message || 'Emergency! Tap to see location.',
        lat, lng
      });
    });

    // Typing / check-in
    socket.on('checkin', (data) => {
      socket.to(`family:${user.familyId}`).emit('member_checkin', {
        userId: user._id,
        name: user.name,
        ...data
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Disconnected: ${user.name}`);
      if (user.familyId) {
        socket.to(`family:${user.familyId}`).emit('member_offline', {
          userId: user._id,
          timestamp: new Date()
        });
      }
    });
  });
};
