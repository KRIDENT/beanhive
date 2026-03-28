// ─────────────────────────────────────────────
// EVENT BUS — In-process event emitter
// Simulates the Kafka event bus from the
// architecture spec for decoupled communication
// between services. In production, replace with
// Kafka topics per section 8.
// ─────────────────────────────────────────────
const EventEmitter = require('events');

class EventBus extends EventEmitter {
  publish(topic, payload) {
    const event = {
      topic,
      payload,
      timestamp: new Date().toISOString(),
      id: require('crypto').randomUUID()
    };
    this.emit(topic, event);
  }

  subscribe(topic, handler) {
    this.on(topic, handler);
  }
}

// Singleton instance
const eventBus = new EventBus();

// Topic constants matching architecture naming convention:
// {domain}.{entity}.{event}
const Topics = {
  USER_REGISTERED: 'user.accounts.registered',
  USER_PROFILE_UPDATED: 'user.accounts.profile-updated',
  USER_DELETED: 'user.accounts.deleted',
  ORDER_CREATED: 'order.orders.created',
  ORDER_CONFIRMED: 'order.orders.confirmed',
  ORDER_CANCELLED: 'order.orders.cancelled',
  REWARDS_STARS_EARNED: 'rewards.stars.earned',
  REWARDS_TIER_UPGRADED: 'rewards.tier.upgraded',
  REWARDS_REDEEMED: 'rewards.redeemed'
};

module.exports = { eventBus, Topics };
