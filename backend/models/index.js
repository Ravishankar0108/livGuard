// ─────────────────────────────────────────
//  FamTrack — Database Models
// ─────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── User ──────────────────────────────────
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  phone:        { type: String, required: true, unique: true }, // Primary SIM
  passwordHash: { type: String, required: true },
  avatar:       { type: String, default: '#3b82f6' }, // color
  fcmToken:     { type: String },                     // push notifications
  familyId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  role:         { type: String, enum: ['admin', 'member'], default: 'member' },
  consentGiven: { type: Boolean, default: false },     // PDPB consent
  trackingEnabled: { type: Boolean, default: true },
  createdAt:    { type: Date, default: Date.now }
});

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ── Family ────────────────────────────────
const familySchema = new mongoose.Schema({
  name:      { type: String, required: true },
  adminId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteCode:{ type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

// ── Location ──────────────────────────────
const locationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Family', index: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  accuracy:  { type: Number },       // meters
  speed:     { type: Number },       // km/h
  bearing:   { type: Number },       // degrees
  altitude:  { type: Number },
  battery:   { type: Number },       // 0-100
  network:   { type: String },       // wifi/cellular/none
  address:   { type: String },       // reverse geocoded
  timestamp: { type: Date, default: Date.now, index: true }
});

// TTL: auto-delete location points older than 90 days
locationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ── Stoppage ──────────────────────────────
const stoppageSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  address:   { type: String },
  startTime: { type: Date, required: true },
  endTime:   { type: Date },          // null = currently stopped here
  durationMs:{ type: Number },
  date:      { type: String }         // YYYY-MM-DD for easy querying
});

// ── Alert ─────────────────────────────────
const alertSchema = new mongoose.Schema({
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Family', index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who triggered it
  type:      { type: String, enum: ['sos', 'low_battery', 'geofence_enter', 'geofence_exit', 'arrival', 'long_stop', 'offline'] },
  title:     { type: String, required: true },
  body:      { type: String },
  lat:       { type: Number },
  lng:       { type: Number },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ── Geofence Zone ─────────────────────────
const geofenceSchema = new mongoose.Schema({
  familyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  name:      { type: String, required: true },   // "Home", "School"
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  radius:    { type: Number, default: 200 },      // meters
  color:     { type: String, default: '#3b82f6' },
  active:    { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// ── OTP ───────────────────────────────────
const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false }
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  User:      mongoose.model('User', userSchema),
  Family:    mongoose.model('Family', familySchema),
  Location:  mongoose.model('Location', locationSchema),
  Stoppage:  mongoose.model('Stoppage', stoppageSchema),
  Alert:     mongoose.model('Alert', alertSchema),
  Geofence:  mongoose.model('Geofence', geofenceSchema),
  OTP:       mongoose.model('OTP', otpSchema)
};
