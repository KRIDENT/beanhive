// Load environment variables first — must be before any other require
require('dotenv').config();

// ─────────────────────────────────────────────
// BEANHIVE API GATEWAY
// Express server acting as the API Gateway layer
// per architecture section 4.1:
//   - Authentication (session-based)
//   - Request routing to microservices
//   - Request logging with correlation ID
//   - Rate limiting (basic)
//   - SSL termination (in production)
// ─────────────────────────────────────────────
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

// Shared middleware
const correlationId = require('./shared/middleware/correlationId');
const requestLogger = require('./shared/middleware/requestLogger');
const errorHandler = require('./shared/middleware/errorHandler');

// Service routes (versioned under /v1/)
const userRoutes = require('./services/user-service/routes');
const orderRoutes = require('./services/order-service/routes');
const rewardsRoutes = require('./services/rewards-service/routes');
const favoritesRoutes = require('./services/favorites-service/routes');
const adminRoutes = require('./services/admin-service/routes');
const menuRoutes = require('./services/menu-service/routes');
const authRoutes = require('./services/auth-service/routes');
const healthRoutes = require('./health/healthController');

// Initialize event subscriptions (rewards listens for user events)
require('./services/rewards-service/services/rewardsService');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (required for secure cookies behind Render/Cloudflare)
app.set('trust proxy', 1);

// ── Gateway Middleware ───────────────────────

// Correlation ID — every request gets a unique trace ID
app.use(correlationId);

// Compression
app.use(compression());

// CORS policy
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow localhost and the deployed Render URL
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    if (/\.onrender\.com$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  exposedHeaders: ['X-Correlation-ID']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  name: 'beanhive.sid',
  secret: process.env.SESSION_SECRET || 'beanhive-secret-key-change-in-production', // set SESSION_SECRET in .env
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Passport — initialise without session (we use our own req.session)
app.use(passport.initialize());

// Structured request logging
app.use(requestLogger);

// ── Health Check Routes ──────────────────────
app.use('/health', healthRoutes);

// ── Versioned API Routes (v1) ────────────────
app.use('/v1/users', userRoutes);
app.use('/v1/orders', orderRoutes);
app.use('/v1/rewards', rewardsRoutes);
app.use('/v1/favorites', favoritesRoutes);
app.use('/v1/admin', adminRoutes);
app.use('/v1/menu', menuRoutes);
app.use('/v1/auth', authRoutes);

// ── Static Files ─────────────────────────────
// Images: cache 7 days (immutable)
app.use('/Images', express.static(path.join(__dirname, '..', 'Images'), {
  maxAge: '7d',
  immutable: true
}));

// CSS/JS: no cache (ensures latest code is always served)
app.use('/src', express.static(path.join(__dirname, '..', 'src'), {
  maxAge: 0
}));

// Everything else (HTML): no cache
app.use(express.static(path.join(__dirname, '..'), {
  maxAge: 0,
  etag: true
}));

// ── HTML Routes (SPA fallback) ───────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── 404 Handler ──────────────────────────────
app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/v1/') && !req.path.startsWith('/health')) {
    return res.status(404).sendFile(path.join(__dirname, '..', '404.html'));
  }
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: 'The requested endpoint does not exist.'
    },
    meta: {
      requestId: req.correlationId,
      timestamp: new Date().toISOString()
    }
  });
});

// ── Global Error Handler ─────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ☕ Beanhive API Gateway running!');
  console.log(`  → Local:   http://localhost:${PORT}`);
  console.log(`  → Health:  http://localhost:${PORT}/health/ready`);
  console.log(`  → API:     http://localhost:${PORT}/v1/`);
  console.log('');
});
