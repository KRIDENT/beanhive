// ─────────────────────────────────────────────
// USER SERVICE ROUTES
// Endpoints per architecture section 3.1:
//   POST   /v1/users/register
//   POST   /v1/users/login
//   POST   /v1/users/logout
//   GET    /v1/users/me
//   PATCH  /v1/users/profile
//   PUT    /v1/users/profile/password
//   DELETE /v1/users/profile
//   GET    /v1/users/profile/stats
//   POST   /v1/users/forgot-password
//   POST   /v1/users/reset-password
// ─────────────────────────────────────────────
const express = require('express');
const requireAuth = require('../../shared/middleware/requireAuth');
const userController = require('./controllers/userController');

const router = express.Router();

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification', userController.resendVerification);
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Authenticated routes
router.post('/logout', userController.logout);
router.get('/me', requireAuth, userController.me);
router.patch('/profile', requireAuth, userController.updateProfile);
router.put('/profile/password', requireAuth, userController.changePassword);
router.delete('/profile', requireAuth, userController.deleteAccount);
router.get('/profile/stats', requireAuth, userController.getStats);

module.exports = router;
