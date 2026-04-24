const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { User, Family } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.familyId) return res.json({ members: [] });
    const family = await Family.findById(req.user.familyId).populate('members', '-passwordHash');
    res.json({ family, members: family ? family.members : [] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/me/tracking', auth, async (req, res) => {
  try {
    const { trackingEnabled, consentGiven } = req.body;
    if (typeof trackingEnabled === 'boolean') req.user.trackingEnabled = trackingEnabled;
    if (typeof consentGiven === 'boolean') req.user.consentGiven = consentGiven;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId);
    if (!family) return res.status(404).json({ error: 'Family not found' });
    if (String(family.adminId) !== String(req.user._id)) return res.status(403).json({ error: 'Only admin can remove members' });
    family.members = family.members.filter(m => String(m) !== req.params.id);
    await family.save();
    await User.findByIdAndUpdate(req.params.id, { $unset: { familyId: '' }, role: 'member' });
    res.json({ message: 'Member removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
