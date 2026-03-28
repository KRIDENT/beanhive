// ─────────────────────────────────────────────
// MENU CONTROLLER — Public read endpoints
// ─────────────────────────────────────────────
const menuService = require('../services/menuService');
const { success, notFound } = require('../../../shared/utils/response');

const menuController = {
  // GET /v1/menu
  getAll(req, res, next) {
    try {
      const category = req.query.category || null;
      const items = menuService.getAll(category);
      return success(res, { items }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/menu/categories
  getCategories(req, res, next) {
    try {
      const categories = menuService.getCategories();
      return success(res, { categories }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/menu/featured
  getFeatured(req, res, next) {
    try {
      const items = menuService.getFeatured();
      return success(res, { items }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/menu/:slug
  getBySlug(req, res, next) {
    try {
      const item = menuService.getBySlug(req.params.slug);
      if (!item) return notFound(res, 'Menu item not found.', req);
      return success(res, { item }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = menuController;
