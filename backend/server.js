// ─────────────────────────────────────────
//  FamTrack — Main Server
// ─────────────────────────────────────────
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const locationRoutes = require('./routes/location');
const alertRoutes = require('./routes/alerts');
const setupSocketHandlers = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ─────────────────────────────
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
});
app.set('io', io);
setupSocketHandlers(io);

// ── Middleware ────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' }));

// ── Routes ────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/alerts', alertRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Error Handler ─────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ── Connect DB + Start ────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`FamTrack server on port ${PORT}`));
  })
  .catch(err => { console.error('DB connection failed:', err); process.exit(1); });
