// ─────────────────────────────────────────────
// REWARDS SERVICE — Business logic
// Responsibility: Stars accumulation, tier
// management, redemption (section 3.4).
//
// Tier System:
//   green   (0–99 stars)   — base benefits
//   gold    (650+ stars)    — premium benefits
//   reserve (1200+ stars)   — elite benefits
// ─────────────────────────────────────────────
const rewardsRepository = require('../repositories/rewardsRepository');
const { eventBus, Topics } = require('../../../shared/events/eventBus');

const STARS_PER_DOLLAR = 2;

const TIER_THRESHOLDS = [
  { tier: 'reserve', minStars: 1200 },
  { tier: 'gold', minStars: 650 },
  { tier: 'green', minStars: 0 }
];

function calculateTier(stars) {
  for (const threshold of TIER_THRESHOLDS) {
    if (stars >= threshold.minStars) return threshold.tier;
  }
  return 'green';
}

const rewardsService = {
  getBalance(userId) {
    const rewards = rewardsRepository.findByUserId(userId);
    return rewards
      ? { stars: rewards.stars, tier: rewards.tier }
      : { stars: 0, tier: 'green' };
  },

  getUserStats(userId) {
    const orderCount = rewardsRepository.getOrderCount(userId);
    const favCount = rewardsRepository.getFavoritesCount(userId);
    return {
      orderCount: orderCount ? orderCount.count : 0,
      favoritesCount: favCount ? favCount.count : 0
    };
  },

  getHistory(userId) {
    return rewardsRepository.getTransactionHistory(userId);
  },

  earnStars(userId, orderId, totalAmount) {
    const starsEarned = Math.floor(totalAmount * STARS_PER_DOLLAR);
    const rewards = rewardsRepository.findByUserId(userId);

    if (!rewards) return { starsEarned: 0, newStars: 0, tier: 'green' };

    const newStars = rewards.stars + starsEarned;
    const oldTier = rewards.tier;
    const newTier = calculateTier(newStars);

    rewardsRepository.updateBalance(userId, newStars, newTier);
    rewardsRepository.logTransaction(userId, orderId, starsEarned, 'EARNED');

    eventBus.publish(Topics.REWARDS_STARS_EARNED, {
      userId, orderId, starsEarned, newStars, tier: newTier
    });

    if (newTier !== oldTier) {
      eventBus.publish(Topics.REWARDS_TIER_UPGRADED, {
        userId, oldTier, newTier, stars: newStars
      });
    }

    return { starsEarned, newStars, tier: newTier };
  },

  createAccount(userId) {
    rewardsRepository.create(userId);
  }
};

// Subscribe to user registration events to create rewards account
eventBus.subscribe(Topics.USER_REGISTERED, (event) => {
  rewardsService.createAccount(event.payload.userId);
});

module.exports = rewardsService;
