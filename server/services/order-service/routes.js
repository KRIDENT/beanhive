// ─────────────────────────────────────────────
// ORDER SERVICE ROUTES
// Endpoints per architecture section 3.3:
//   POST   /v1/orders
//   GET    /v1/orders
//   GET    /v1/orders/:orderId
//   PATCH  /v1/orders/:orderId/cancel
// ─────────────────────────────────────────────
const express = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const orderController = require('./controllers/orderController');

const router = express.Router();

router.post('/', requireAuth, orderController.placeOrder);
router.get('/', requireAuth, orderController.getOrderHistory);
router.get('/:orderId', requireAuth, orderController.getOrder);
router.patch('/:orderId/cancel', requireAuth, orderController.cancelOrder);

module.exports = router;
