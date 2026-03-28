// ─────────────────────────────────────────────
// USER SERVICE — Business logic layer
// Responsibility: Account lifecycle, preferences,
// profile data (architecture section 3.1).
// ─────────────────────────────────────────────
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { eventBus, Topics } = require('../../../shared/events/eventBus');
const emailService = require('../../../shared/email');

const SALT_ROUNDS = 12;
const VERIFICATION_EXPIRY_HOURS = 24;

const userService = {
  async register({ firstName, lastName, email, phone, password }) {
    // Check for existing user
    const existing = userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      err.errorCode = 'CONFLICT';
      throw err;
    }

    // Hash password
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user (email_verified defaults to 0)
    const userId = userRepository.create({
      firstName, lastName, email, phone, password: hashedPassword
    });

    // Publish event for rewards service to create entry
    eventBus.publish(Topics.USER_REGISTERED, { userId, firstName, email });

    // Generate verification token and send email
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    userRepository.createVerificationToken(userId, token, expiresAt);

    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/v1/users/verify-email?token=${token}`;
    emailService.sendVerificationEmail(email, firstName, verificationUrl);

    return { id: userId, firstName, lastName, email, needsVerification: true };
  },

  async resendVerification(email) {
    const user = userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('No account found with this email.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
    if (user.email_verified) {
      const err = new Error('This email is already verified.');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    // Invalidate old tokens and create new one
    userRepository.invalidateVerificationTokens(user.id);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    userRepository.createVerificationToken(user.id, token, expiresAt);

    const baseUrl = process.env.APP_URL || 'http://localhost:3001';
    const verificationUrl = `${baseUrl}/v1/users/verify-email?token=${token}`;
    await emailService.sendVerificationEmail(email, user.first_name, verificationUrl);
  },

  verifyEmail(token) {
    const record = userRepository.findVerificationToken(token);
    if (!record) {
      const err = new Error('Invalid or expired verification link.');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }
    if (new Date(record.expires_at) < new Date()) {
      const err = new Error('This verification link has expired. Please request a new one.');
      err.statusCode = 400;
      err.errorCode = 'TOKEN_EXPIRED';
      throw err;
    }

    userRepository.markVerificationTokenUsed(record.id);
    userRepository.setEmailVerified(record.user_id);

    return userRepository.findById(record.user_id);
  },

  async login(email, password) {
    const user = userRepository.findByEmail(email);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.errorCode = 'INVALID_CREDENTIALS';
      throw err;
    }

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role || 'customer',
      emailVerified: !!user.email_verified
    };
  },

  getProfile(userId) {
    const user = userRepository.findById(userId);
    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      role: user.role || 'customer',
      createdAt: user.created_at
    };
  },

  updateProfile(userId, { firstName, lastName, phone }) {
    userRepository.update(userId, { firstName, lastName, phone });
    eventBus.publish(Topics.USER_PROFILE_UPDATED, { userId, firstName, lastName });
  },

  async changePassword(userId, currentPassword, newPassword) {
    const user = userRepository.findByIdWithPassword(userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      const err = new Error('Current password is incorrect.');
      err.statusCode = 400;
      err.errorCode = 'BAD_REQUEST';
      throw err;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(newPassword, salt);
    userRepository.updatePassword(userId, hash);
  },

  deleteAccount(userId) {
    userRepository.hardDelete(userId);
    eventBus.publish(Topics.USER_DELETED, { userId });
  },

  generateResetToken(email) {
    const user = userRepository.findByEmail(email);
    if (!user) return null; // Don't leak whether email exists

    // Invalidate existing tokens
    userRepository.invalidateUserTokens(user.id);

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    userRepository.createResetToken(user.id, token, expiresAt);
    return token;
  },

  async resetPassword(token, newPassword) {
    const resetToken = userRepository.findResetToken(token);
    if (!resetToken) {
      const err = new Error('Invalid or expired reset link. Please request a new one.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_TOKEN';
      throw err;
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      userRepository.markTokenUsed(resetToken.id);
      const err = new Error('This reset link has expired. Please request a new one.');
      err.statusCode = 400;
      err.errorCode = 'TOKEN_EXPIRED';
      throw err;
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    userRepository.updatePassword(resetToken.user_id, hashedPassword);
    userRepository.markTokenUsed(resetToken.id);
  },

  // ── Google OAuth ─────────────────────────────
  findOrCreateGoogleUser({ googleId, email, firstName, lastName }) {
    // 1. Existing user with this google_id
    let user = userRepository.findByGoogleId(googleId);
    if (user) {
      // Ensure Google users are always verified
      if (!user.email_verified) userRepository.setEmailVerified(user.id);
      return { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role || 'customer' };
    }

    // 2. Account linking — existing email, attach google_id
    user = userRepository.findByEmail(email);
    if (user) {
      userRepository.linkGoogleId(user.id, googleId);
      // Google verified the email, so mark as verified
      if (!user.email_verified) userRepository.setEmailVerified(user.id);
      return { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role || 'customer' };
    }

    // 3. Brand new user — create account without password
    const userId = userRepository.createOAuthUser({ firstName, lastName, email, googleId });
    // Google users are pre-verified
    userRepository.setEmailVerified(userId);
    eventBus.publish(Topics.USER_REGISTERED, { userId, firstName, lastName, email });
    return { id: userId, firstName, lastName, email, role: 'customer' };
  }
};

module.exports = userService;
