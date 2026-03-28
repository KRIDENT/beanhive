// ─────────────────────────────────────────────
// ADMIN CONTROLLER — HTTP handlers
// ─────────────────────────────────────────────
const adminService = require('../services/adminService');
const menuService = require('../../menu-service/services/menuService');
const { success, created, badRequest } = require('../../../shared/utils/response');

const adminController = {
  // GET /v1/admin/stats
  getStats(req, res, next) {
    try {
      const stats = adminService.getStats();
      return success(res, stats, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/admin/users
  getUsers(req, res, next) {
    try {
      const users = adminService.getAllUsers();
      return success(res, { users }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /v1/admin/users/:id/role
  updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      if (!role) {
        return badRequest(res, 'Role is required.', req);
      }

      const targetId = parseInt(req.params.id, 10);
      const user = adminService.updateUserRole(targetId, role, req.session.userId);
      return success(res, { message: 'Role updated.', user }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/admin/orders
  getOrders(req, res, next) {
    try {
      const orders = adminService.getAllOrders();
      return success(res, { orders }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // ── Menu Management ───────────────────────

  // GET /v1/admin/menu
  getMenuItems(req, res, next) {
    try {
      const items = menuService.getAll();
      return success(res, { items }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/admin/menu
  createMenuItem(req, res, next) {
    try {
      const { name, category, price } = req.body;
      if (!name || !category || price === undefined) {
        return badRequest(res, 'Name, category, and price are required.', req);
      }
      const item = menuService.create(req.body);
      return created(res, { message: 'Menu item created.', item }, req);
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /v1/admin/menu/:id
  updateMenuItem(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const item = menuService.update(id, req.body);
      return success(res, { message: 'Menu item updated.', item }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // DELETE /v1/admin/menu/:id
  deleteMenuItem(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      menuService.delete(id);
      return success(res, { message: 'Menu item deleted.' }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/admin/analytics
  getAnalytics(req, res, next) {
    try {
      const days = parseInt(req.query.days, 10) || 30;
      const analytics = adminService.getAnalytics(days);
      return success(res, { analytics }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/admin/menu/:id/image
  uploadMenuImage(req, res, next) {
    try {
      if (!req.file) {
        return badRequest(res, 'No image file uploaded.', req);
      }
      const id = parseInt(req.params.id, 10);
      const imagePath = 'Images/menu/' + req.file.filename;
      const item = menuService.updateImage(id, imagePath);
      return success(res, { message: 'Image uploaded.', item }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = adminController;
