// ─────────────────────────────────────────────
// REWARDS CONTROLLER — HTTP handlers
// ─────────────────────────────────────────────
const rewardsService = require('../services/rewardsService');
const { success } = require('../../../shared/utils/response');

const rewardsController = {
  // GET /v1/rewards
  getBalance(req, res, next) {
    try {
      const rewards = rewardsService.getBalance(req.session.userId);
      return success(res, rewards, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/rewards/history
  getHistory(req, res, next) {
    try {
      const history = rewardsService.getHistory(req.session.userId);
      return success(res, { transactions: history }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = rewardsController;
