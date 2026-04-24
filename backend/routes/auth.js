// ─────────────────────────────────────────
//  FamTrack — Auth Routes
// ─────────────────────────────────────────
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Family, OTP } = require('../models');
const crypto = require('crypto');

// Twilio for OTP SMS
const twilio = require('twilio');
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// ── Helpers ───────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateInviteCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();
const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── POST /api/auth/send-otp ───────────────
// Send OTP to phone number
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP
    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt });

    // Send via Twilio
    if (twilioClient && process.env.TWILIO_PHONE && process.env.NODE_ENV === 'production') {
      await twilioClient.messages.create({
        body: `Your FamTrack verification code is: ${otp}. Valid for 10 minutes. Do not share.`,
        from: process.env.TWILIO_PHONE,
        to: phone
      });
    }

    res.json({ message: 'OTP sent', ...((process.env.NODE_ENV !== 'production') && { otp }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/verify-otp ─────────────
// Register or login via OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    const record = await OTP.findOne({ phone, used: false, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    if (!record || record.otp !== otp)
      return res.status(401).json({ error: 'Invalid or expired OTP' });

    // Mark OTP used
    record.used = true;
    await record.save();

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      if (!name) return res.status(400).json({ error: 'Name required for registration', needsName: true });
      user = await User.create({ name, phone, passwordHash: crypto.randomBytes(16).toString('hex'), consentGiven: true });
      isNewUser = true;
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: { id: user._id, name: user.name, phone: user.phone, familyId: user.familyId, avatar: user.avatar },
      isNewUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/create-family ──────────
router.post('/create-family', require('../middleware/auth'), async (req, res) => {
  try {
    const { name } = req.body;
    const user = req.user;

    const family = await Family.create({
      name,
      adminId: user._id,
      members: [user._id],
      inviteCode: generateInviteCode()
    });

    user.familyId = family._id;
    user.role = 'admin';
    await user.save();

    res.json({ family, inviteCode: family.inviteCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/join-family ────────────
router.post('/join-family', require('../middleware/auth'), async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const family = await Family.findOne({ inviteCode });
    if (!family) return res.status(404).json({ error: 'Invalid invite code' });

    const user = req.user;
    if (!family.members.includes(user._id)) {
      family.members.push(user._id);
      await family.save();
    }
    user.familyId = family._id;
    await user.save();

    res.json({ message: 'Joined family', family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
