// ─────────────────────────────────────────────
// AUTH SERVICE ROUTES — Google OAuth 2.0
//
//   GET /v1/auth/google           → redirect to Google consent
//   GET /v1/auth/google/callback  → handle Google callback
// ─────────────────────────────────────────────
const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const userService = require('../user-service/services/userService');

const router = express.Router();

// ── Configure Google Strategy ────────────────
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/v1/auth/google/callback'
  },
  function (accessToken, refreshToken, profile, done) {
    // Extract profile data from Google
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    const firstName = profile.name && profile.name.givenName || profile.displayName || 'User';
    const lastName = profile.name && profile.name.familyName || '';
    const googleId = profile.id;

    if (!email) {
      return done(new Error('Google account did not provide an email address.'));
    }

    try {
      const user = userService.findOrCreateGoogleUser({ googleId, email, firstName, lastName });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Passport requires serialize/deserialize even when not using passport sessions
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ── Routes ───────────────────────────────────

// Step 1 — Redirect user to Google consent screen
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step 2 — Google redirects back here with ?code=...
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/signin.html?error=google' }),
  function (req, res) {
    const user = req.user;

    // Set our own session (not passport's)
    req.session.userId = user.id;
    req.session.userName = user.firstName;
    req.session.userRole = user.role;

    // Save session before redirecting
    req.session.save(function (err) {
      if (err) {
        console.error('[OAuth] Session save error:', err);
        return res.redirect('/signin.html?error=session');
      }
      const dest = user.role === 'admin' ? '/admin.html' : '/index.html';
      res.redirect(dest);
    });
  }
);

module.exports = router;
