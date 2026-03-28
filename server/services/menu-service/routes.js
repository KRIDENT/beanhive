// ─────────────────────────────────────────────
// MENU SERVICE ROUTES (Public — no auth needed)
//   GET  /v1/menu
//   GET  /v1/menu/categories
//   GET  /v1/menu/featured
//   GET  /v1/menu/:slug
// ─────────────────────────────────────────────
const express = require('express');
const menuController = require('./controllers/menuController');

const router = express.Router();

// Static routes must come before :slug param route
router.get('/categories', menuController.getCategories);
router.get('/featured', menuController.getFeatured);
router.get('/:slug', menuController.getBySlug);
router.get('/', menuController.getAll);

module.exports = router;
