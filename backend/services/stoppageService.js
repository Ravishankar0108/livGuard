// ─────────────────────────────────────────
//  FamTrack — Stoppage Detection Service
//  Detects when a user stays in one spot
// ─────────────────────────────────────────
const { Stoppage, User } = require('../models');

// In-memory buffer per user (last known state)
const userState = new Map();

const STOP_SPEED_THRESHOLD = 2;     // km/h — below this = stopped
const STOP_RADIUS_METERS = 50;      // movement within this = same stop
const MIN_STOP_DURATION = 3 * 60 * 1000; // 3 min minimum to count as a stop

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function process(userId, { lat, lng, speed, timestamp }) {
  try {
    const state = userState.get(userId.toString()) || { status: 'moving', stopStart: null, stopLat: null, stopLng: null };

    const isStopped = speed === undefined || speed === null || speed < STOP_SPEED_THRESHOLD;

    if (isStopped) {
      if (state.status === 'moving') {
        // Just stopped
        state.status = 'stopped';
        state.stopStart = timestamp;
        state.stopLat = lat;
        state.stopLng = lng;
        userState.set(userId.toString(), state);

      } else if (state.status === 'stopped') {
        // Still stopped — check if same place
        const dist = haversineMeters(state.stopLat, state.stopLng, lat, lng);

        if (dist > STOP_RADIUS_METERS) {
          // Moved to a new stop — close old one
          await endStoppage(userId, timestamp);
          state.stopStart = timestamp;
          state.stopLat = lat;
          state.stopLng = lng;
          userState.set(userId.toString(), state);
        }
        // else: still at same stop, no action
      }

    } else {
      // Moving
      if (state.status === 'stopped') {
        // Just started moving — close stoppage
        await endStoppage(userId, timestamp);
        state.status = 'moving';
        state.stopStart = null;
        userState.set(userId.toString(), state);
      }
    }

  } catch (err) {
    console.error('Stoppage processing error:', err);
  }
}

async function endStoppage(userId, endTime) {
  // Find open stoppage
  const open = await Stoppage.findOne({ userId, endTime: null }).sort({ startTime: -1 });
  if (!open) return;

  const duration = endTime - open.startTime;
  if (duration < MIN_STOP_DURATION) {
    // Too short — delete
    await open.deleteOne();
    return;
  }

  open.endTime = endTime;
  open.durationMs = duration;
  await open.save();
}

async function startStoppage(userId, familyId, lat, lng, address, startTime) {
  const date = new Date(startTime).toISOString().split('T')[0];
  await Stoppage.create({ userId, familyId, lat, lng, address, startTime, date });
}

module.exports = { process, endStoppage, startStoppage };
