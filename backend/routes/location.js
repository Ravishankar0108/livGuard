// ─────────────────────────────────────────
//  FamTrack — Location Routes
// ─────────────────────────────────────────
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Location, Stoppage, Alert, User } = require('../models');
const stoppageService = require('../services/stoppageService');
const geocodeService = require('../services/geocodeService');

// ── POST /api/location/ping ───────────────
// Mobile app posts GPS every 30-60 sec
router.post('/ping', auth, async (req, res) => {
  try {
    const { lat, lng, speed, accuracy, bearing, altitude, battery, network } = req.body;
    const userId = req.user._id;
    const familyId = req.user.familyId;

    // Reverse geocode (async, don't block response)
    let address = '';
    try { address = await geocodeService.reverse(lat, lng); } catch (_) {}

    // Save location point
    const loc = await Location.create({
      userId, familyId, lat, lng, speed, accuracy,
      bearing, altitude, battery, network, address
    });

    // Check stoppages (background)
    stoppageService.process(userId, { lat, lng, speed, timestamp: loc.timestamp });

    // Low battery alert
    if (battery && battery <= 20) {
      const existing = await Alert.findOne({
        userId, type: 'low_battery',
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // once per hour
      });
      if (!existing) {
        const user = req.user;
        await Alert.create({
          familyId, userId, type: 'low_battery',
          title: `${user.name}'s battery is low`,
          body: `Battery at ${battery}% — may go offline soon.`,
          lat, lng
        });
      }
    }

    // Broadcast to family via Socket.IO
    const io = req.app.get('io');
    if (familyId && io) {
      io.to(`family:${familyId}`).emit('location_update', {
        userId, lat, lng, speed, battery, address,
        timestamp: loc.timestamp
      });
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/location/live/:familyId ──────
// Get latest location for all family members
router.get('/live/:familyId', auth, async (req, res) => {
  try {
    const { familyId } = req.params;

    // Get latest point per user using aggregation
    const latest = await Location.aggregate([
      { $match: { familyId: new (require('mongoose').Types.ObjectId)(familyId) } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: '$userId', doc: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$doc' } },
      { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' }
    ]);

    res.json({ locations: latest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/location/history ─────────────
// Query: userId, date (YYYY-MM-DD), limit
router.get('/history', auth, async (req, res) => {
  try {
    const { userId, date, limit = 500 } = req.query;

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const points = await Location.find({
      userId,
      timestamp: { $gte: start, $lt: end }
    })
    .sort({ timestamp: 1 })
    .limit(parseInt(limit))
    .select('lat lng speed battery address timestamp');

    // Calculate stats
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      distance += haversine(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
    }

    res.json({ points, stats: { distance: +distance.toFixed(2), count: points.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/location/stoppages ───────────
router.get('/stoppages', auth, async (req, res) => {
  try {
    const { userId, date } = req.query;
    const stoppages = await Stoppage.find({ userId, date }).sort({ startTime: 1 });
    res.json({ stoppages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Haversine distance (km) ───────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

module.exports = router;
