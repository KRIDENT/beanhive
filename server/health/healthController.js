// ─────────────────────────────────────────────
// HEALTH CHECK — Liveness and readiness probes
// Per architecture section 15 checklist:
//   /health/live  — Is the process running?
//   /health/ready — Is the service ready to accept traffic?
// ─────────────────────────────────────────────
const express = require('express');
const db = require('../shared/db');

const router = express.Router();

// Liveness probe — is the process up?
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Readiness probe — can the service handle requests?
router.get('/ready', (req, res) => {
  try {
    // Check database connectivity
    db.prepare('SELECT 1').get();
    res.status(200).json({
      status: 'READY',
      checks: {
        database: 'UP'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'NOT_READY',
      checks: {
        database: 'DOWN'
      },
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
