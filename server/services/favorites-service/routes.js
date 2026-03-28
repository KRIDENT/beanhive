// ─────────────────────────────────────────────
// FAVORITES SERVICE ROUTES
//   GET    /v1/favorites
//   POST   /v1/favorites
//   DELETE /v1/favorites/:drinkId
//   GET    /v1/favorites/check/:drinkId
// ─────────────────────────────────────────────
const express = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const favoritesController = require('./controllers/favoritesController');

const router = express.Router();

router.get('/', requireAuth, favoritesController.list);
router.post('/', requireAuth, favoritesController.add);
router.delete('/:drinkId', requireAuth, favoritesController.remove);
router.get('/check/:drinkId', requireAuth, favoritesController.check);

module.exports = router;
