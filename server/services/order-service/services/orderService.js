// ─────────────────────────────────────────────
// ORDER SERVICE — Business logic
// Responsibility: Order creation, state machine,
// fulfillment orchestration (section 3.3).
//
// Order state machine:
//   PENDING → CONFIRMED → IN_PREPARATION → READY → COMPLETED
//                      └→ CANCELLED
// ─────────────────────────────────────────────
const orderRepository = require('../repositories/orderRepository');
const rewardsService = require('../../rewards-service/services/rewardsService');
const { eventBus, Topics } = require('../../../shared/events/eventBus');

const TAX_RATE = 0.0825;

const orderService = {
  placeOrder(userId, items) {
    // Validate and calculate totals
    let subtotal = 0;
    const validatedItems = items.map((item) => {
      const price = parseFloat(item.price) || 0;
      const qty = parseInt(item.qty, 10) || 1;
      subtotal += price * qty;

      return {
        id: item.id,
        name: item.name,
        price,
        qty,
        size: item.size || 'Grande',
        img: item.img || ''
      };
    });

    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    // Insert order with confirmed status
    const orderId = orderRepository.create({
      userId,
      items: validatedItems,
      subtotal,
      tax,
      total,
      status: 'confirmed'
    });

    // Award stars via rewards service
    const rewardsResult = rewardsService.earnStars(userId, orderId, total);

    // Publish order events
    eventBus.publish(Topics.ORDER_CREATED, { orderId, userId, total });
    eventBus.publish(Topics.ORDER_CONFIRMED, { orderId, userId });

    return {
      id: orderId,
      items: validatedItems,
      subtotal,
      tax,
      total,
      status: 'confirmed',
      starsEarned: rewardsResult.starsEarned
    };
  },

  getOrder(orderId, userId) {
    const order = orderRepository.findById(orderId, userId);
    if (!order) return null;

    return {
      id: order.id,
      items: JSON.parse(order.items),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: order.status,
      createdAt: order.created_at
    };
  },

  getOrderHistory(userId) {
    const orders = orderRepository.findByUserId(userId);
    return orders.map((order) => ({
      id: order.id,
      items: JSON.parse(order.items),
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      status: order.status,
      createdAt: order.created_at
    }));
  },

  cancelOrder(orderId, userId) {
    const order = orderRepository.findById(orderId, userId);
    if (!order) return null;
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      const err = new Error('Order cannot be cancelled in its current state.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    orderRepository.cancel(orderId);
    eventBus.publish(Topics.ORDER_CANCELLED, { orderId, userId });
    return { id: orderId, status: 'CANCELLED' };
  }
};

module.exports = orderService;
