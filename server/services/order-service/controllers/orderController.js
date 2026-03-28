// ─────────────────────────────────────────────
// ORDER CONTROLLER — HTTP handlers
// ─────────────────────────────────────────────
const orderService = require('../services/orderService');
const { success, created, badRequest, notFound } = require('../../../shared/utils/response');

const orderController = {
  // POST /v1/orders
  placeOrder(req, res, next) {
    try {
      const { items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return badRequest(res, 'Cart is empty.', req);
      }

      const order = orderService.placeOrder(req.session.userId, items);
      return created(res, { message: 'Order placed successfully!', order }, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/orders
  getOrderHistory(req, res, next) {
    try {
      const orders = orderService.getOrderHistory(req.session.userId);
      return success(res, { orders }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/orders/:orderId
  getOrder(req, res, next) {
    try {
      const order = orderService.getOrder(req.params.orderId, req.session.userId);
      if (!order) {
        return notFound(res, 'Order not found.', req);
      }
      return success(res, { order }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /v1/orders/:orderId/cancel
  cancelOrder(req, res, next) {
    try {
      const result = orderService.cancelOrder(req.params.orderId, req.session.userId);
      if (!result) {
        return notFound(res, 'Order not found.', req);
      }
      return success(res, { message: 'Order cancelled.', order: result }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = orderController;
