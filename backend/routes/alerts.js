const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Alert } = require('../models');

router.get('/', auth, async (req, res) => {
  try {
    const alerts = await Alert.find({ familyId: req.user.familyId }).sort({ createdAt: -1 }).limit(100);
    res.json({ alerts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/sos', auth, async (req, res) => {
  try {
    const { lat, lng, message } = req.body;
    const alert = await Alert.create({
      familyId: req.user.familyId,
      userId: req.user._id,
      type: 'sos',
      title: `${req.user.name} triggered SOS`,
      body: message || 'Emergency help requested',
      lat,
      lng
    });
    const io = req.app.get('io');
    if (io && req.user.familyId) io.to(`family:${req.user.familyId}`).emit('sos_alert', alert);
    res.json({ alert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, familyId: req.user.familyId },
      { read: true },
      { new: true }
    );
    res.json({ alert });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
