// ─────────────────────────────────────────────
// USER CONTROLLER — HTTP request handlers
// Thin layer: validates input, delegates to
// service, formats response.
// ─────────────────────────────────────────────
const userService = require('../services/userService');
const rewardsService = require('../../rewards-service/services/rewardsService');
const { success, created, badRequest, serverError } = require('../../../shared/utils/response');

const userController = {
  // POST /v1/users/register
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      if (!firstName || !lastName || !email || !password) {
        return badRequest(res, 'First name, last name, email, and password are required.', req);
      }
      if (password.length < 8) {
        return badRequest(res, 'Password must be at least 8 characters.', req);
      }

      const user = await userService.register({ firstName, lastName, email, phone, password });

      // Auto-login after registration (email verification paused)
      req.session.userId = user.id;
      req.session.userName = user.firstName;

      return created(res, {
        message: 'Account created successfully!',
        user
      }, req);
    } catch (err) {
      if (err.statusCode) return next(err);
      return next(err);
    }
  },

  // POST /v1/users/login
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return badRequest(res, 'Email and password are required.', req);
      }

      const user = await userService.login(email, password);

      // Set session
      req.session.userId = user.id;
      req.session.userName = user.firstName;
      req.session.userRole = user.role;

      // Get rewards data
      const rewards = rewardsService.getBalance(user.id);

      return success(res, {
        message: 'Signed in successfully!',
        user: {
          ...user,
          stars: rewards.stars,
          tier: rewards.tier
        }
      }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/users/logout
  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Could not sign out.' },
          meta: { requestId: req.correlationId, timestamp: new Date().toISOString() }
        });
      }
      res.clearCookie('beanhive.sid');
      return success(res, { message: 'Signed out successfully.' }, 200, req);
    });
  },

  // GET /v1/users/verify-email?token=...
  verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return res.redirect('/signin.html?verified=error&reason=missing-token');
      }

      const user = userService.verifyEmail(token);

      // Auto-login after verification
      req.session.userId = user.id;
      req.session.userName = user.first_name;
      req.session.userRole = user.role;

      req.session.save(function () {
        res.redirect('/signin.html?verified=success');
      });
    } catch (err) {
      const reason = err.errorCode === 'TOKEN_EXPIRED' ? 'expired' : 'invalid';
      res.redirect('/signin.html?verified=error&reason=' + reason);
    }
  },

  // POST /v1/users/resend-verification
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return badRequest(res, 'Email is required.', req);
      }
      await userService.resendVerification(email);
      return success(res, { message: 'Verification email sent. Please check your inbox.' }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // GET /v1/users/me
  me(req, res, next) {
    try {
      const user = userService.getProfile(req.session.userId);
      const rewards = rewardsService.getBalance(req.session.userId);

      return success(res, {
        user: {
          ...user,
          stars: rewards.stars,
          tier: rewards.tier
        }
      }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // PATCH /v1/users/profile
  updateProfile(req, res, next) {
    try {
      const { firstName, lastName, phone } = req.body;
      userService.updateProfile(req.session.userId, { firstName, lastName, phone });
      return success(res, { message: 'Profile updated.' }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // PUT /v1/users/profile/password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 8) {
        return badRequest(res, 'New password must be at least 8 characters.', req);
      }

      await userService.changePassword(req.session.userId, currentPassword, newPassword);
      return success(res, { message: 'Password changed successfully.' }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // DELETE /v1/users/profile
  deleteAccount(req, res) {
    userService.deleteAccount(req.session.userId);
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Account deleted but could not clear session.' },
          meta: { requestId: req.correlationId, timestamp: new Date().toISOString() }
        });
      }
      res.clearCookie('beanhive.sid');
      return success(res, { message: 'Account deleted.' }, 200, req);
    });
  },

  // GET /v1/users/profile/stats
  getStats(req, res, next) {
    try {
      const rewards = rewardsService.getBalance(req.session.userId);
      const stats = rewardsService.getUserStats(req.session.userId);

      return success(res, {
        stars: rewards.stars,
        tier: rewards.tier,
        orderCount: stats.orderCount,
        favoritesCount: stats.favoritesCount
      }, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/users/forgot-password
  forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) {
        return badRequest(res, 'Email is required.', req);
      }

      const token = userService.generateResetToken(email);
      const responseData = {
        message: 'If an account with that email exists, a reset link has been generated.'
      };

      // Demo only — in production, NEVER return the token
      if (token) {
        responseData._demo_token = token;
        responseData._demo_reset_url = '/reset-password.html?token=' + token;
      }

      return success(res, responseData, 200, req);
    } catch (err) {
      return next(err);
    }
  },

  // POST /v1/users/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return badRequest(res, 'Token and new password are required.', req);
      }
      if (password.length < 8) {
        return badRequest(res, 'Password must be at least 8 characters.', req);
      }

      await userService.resetPassword(token, password);
      return success(res, {
        message: 'Password reset successfully! You can now sign in with your new password.'
      }, 200, req);
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = userController;
