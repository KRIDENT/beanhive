// ─────────────────────────────────────────────
// ADMIN SERVICE ROUTES
// All routes require authentication + admin role.
//
// User management:
//   GET    /v1/admin/stats
//   GET    /v1/admin/users
//   PATCH  /v1/admin/users/:id/role
//   GET    /v1/admin/orders
//
// Menu management:
//   GET    /v1/admin/menu
//   POST   /v1/admin/menu
//   PATCH  /v1/admin/menu/:id
//   DELETE /v1/admin/menu/:id
//   POST   /v1/admin/menu/:id/image
// ─────────────────────────────────────────────
const express = require('express');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../../shared/middleware/requireAuth');
const requireAdmin = require('../../shared/middleware/requireAdmin');
const adminController = require('./controllers/adminController');

const router = express.Router();

// ── Multer config for menu image uploads ─────
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', '..', 'Images', 'menu'),
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = 'item-' + req.params.id + '-' + Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg, and .webp files are allowed.'));
    }
  }
});

// ── Analytics ────────────────────────────────
router.get('/analytics', requireAuth, requireAdmin, adminController.getAnalytics);

// ── User & Order routes ──────────────────────
router.get('/stats', requireAuth, requireAdmin, adminController.getStats);
router.get('/users', requireAuth, requireAdmin, adminController.getUsers);
router.patch('/users/:id/role', requireAuth, requireAdmin, adminController.updateUserRole);
router.get('/orders', requireAuth, requireAdmin, adminController.getOrders);

// ── Menu CRUD routes ─────────────────────────
router.get('/menu', requireAuth, requireAdmin, adminController.getMenuItems);
router.post('/menu', requireAuth, requireAdmin, adminController.createMenuItem);
router.patch('/menu/:id', requireAuth, requireAdmin, adminController.updateMenuItem);
router.delete('/menu/:id', requireAuth, requireAdmin, adminController.deleteMenuItem);
router.post('/menu/:id/image', requireAuth, requireAdmin, upload.single('image'), adminController.uploadMenuImage);

module.exports = router;
