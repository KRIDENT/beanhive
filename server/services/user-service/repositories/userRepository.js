// ─────────────────────────────────────────────
// USER REPOSITORY — Data access layer
// Owns: users table, password_reset_tokens table
// All database queries for user data live here.
// ─────────────────────────────────────────────
const db = require('../../../shared/db');

const userRepository = {
  findById(id) {
    return db.prepare(
      'SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = ?'
    ).get(id);
  },

  findByIdWithPassword(id) {
    return db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).get(id);
  },

  findByEmail(email) {
    return db.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).get(email);
  },

  create({ firstName, lastName, email, phone, password }) {
    const result = db.prepare(
      'INSERT INTO users (first_name, last_name, email, phone, password) VALUES (?, ?, ?, ?, ?)'
    ).run(firstName, lastName, email, phone || '', password);
    return result.lastInsertRowid;
  },

  update(id, { firstName, lastName, phone }) {
    db.prepare(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?'
    ).run(firstName, lastName, phone || '', id);
  },

  updatePassword(id, hashedPassword) {
    db.prepare(
      'UPDATE users SET password = ? WHERE id = ?'
    ).run(hashedPassword, id);
  },

  hardDelete(id) {
    db.prepare('DELETE FROM favorites WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM rewards_transactions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM orders WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM rewards WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  // ── OAuth ────────────────────────────────────

  findByGoogleId(googleId) {
    return db.prepare('SELECT * FROM users WHERE google_id = ?').get(googleId);
  },

  linkGoogleId(userId, googleId) {
    db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(googleId, userId);
  },

  createOAuthUser({ firstName, lastName, email, googleId }) {
    const result = db.prepare(
      'INSERT INTO users (first_name, last_name, email, phone, password, google_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(firstName, lastName, email, '', 'OAUTH_NO_PASSWORD', googleId);
    return result.lastInsertRowid;
  },

  // Password reset tokens
  findResetToken(token) {
    return db.prepare(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0'
    ).get(token);
  },

  invalidateUserTokens(userId) {
    db.prepare(
      'UPDATE password_reset_tokens SET used = 1 WHERE user_id = ? AND used = 0'
    ).run(userId);
  },

  createResetToken(userId, token, expiresAt) {
    db.prepare(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(userId, token, expiresAt);
  },

  markTokenUsed(tokenId) {
    db.prepare(
      'UPDATE password_reset_tokens SET used = 1 WHERE id = ?'
    ).run(tokenId);
  },

  // ── Email verification tokens ────────────────

  createVerificationToken(userId, token, expiresAt) {
    db.prepare(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
    ).run(userId, token, expiresAt);
  },

  findVerificationToken(token) {
    return db.prepare(
      'SELECT * FROM email_verification_tokens WHERE token = ? AND used = 0'
    ).get(token);
  },

  markVerificationTokenUsed(tokenId) {
    db.prepare(
      'UPDATE email_verification_tokens SET used = 1 WHERE id = ?'
    ).run(tokenId);
  },

  invalidateVerificationTokens(userId) {
    db.prepare(
      'UPDATE email_verification_tokens SET used = 1 WHERE user_id = ? AND used = 0'
    ).run(userId);
  },

  setEmailVerified(userId) {
    db.prepare('UPDATE users SET email_verified = 1 WHERE id = ?').run(userId);
  }
};

module.exports = userRepository;
