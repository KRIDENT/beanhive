// ─────────────────────────────────────────────
// REWARDS SERVICE ROUTES
// Endpoints per architecture section 3.4:
//   GET    /v1/rewards
//   GET    /v1/rewards/history
// ─────────────────────────────────────────────
const express = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const rewardsController = require('./controllers/rewardsController');

const router = express.Router();

router.get('/', requireAuth, rewardsController.getBalance);
router.get('/history', requireAuth, rewardsController.getHistory);

module.exports = router;
