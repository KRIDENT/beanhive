// ─────────────────────────────────────────────
// AUTH CLIENT
// Handles registration, login, logout, and
// session state across all pages.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  // Use port 3001 for the API server (regardless of frontend port)
  var API_BASE = window.location.origin + '/v1/users';

  // ── API Helpers ──────────────────────────────
  // Unwrap standardized API response: { data: {...}, meta: {...} } or { error: { code, message }, meta: {...} }
  function unwrapResponse(res, json) {
    var payload = json.data || json;
    if (!res.ok && json.error) {
      payload = { error: json.error.message || json.error };
    }
    return { ok: res.ok, status: res.status, data: payload };
  }

  function postJSON(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    }).then(function (res) {
      return res.json().then(function (json) {
        return unwrapResponse(res, json);
      });
    });
  }

  function getJSON(url) {
    return fetch(url, {
      credentials: 'include'
    }).then(function (res) {
      return res.json().then(function (json) {
        return unwrapResponse(res, json);
      });
    });
  }

  // ── Update navbar based on auth state ────────
  function updateNavbar(user) {
    var signInLinks = document.querySelectorAll('.navSignIn');
    var joinBtns = document.querySelectorAll('.navBtnSecondary');
    var userGreetings = document.querySelectorAll('.navUserGreeting');

    if (user) {
      // User is signed in — hide sign in / join now, show greeting + sign out
      signInLinks.forEach(function (el) { el.style.display = 'none'; });
      joinBtns.forEach(function (el) {
        if (el.textContent.trim().toLowerCase() === 'join now') {
          el.textContent = 'Hi, ' + user.firstName + '!';
          el.href = 'profile.html';
          el.classList.remove('navBtnSecondary');
          el.classList.add('navUserGreeting');
          el.style.border = 'none';
          el.style.fontWeight = '600';
          el.style.color = 'var(--color-starbucks-green)';
          el.style.textAlign = 'center';

          // Add sign out link after the greeting (desktop)
          var signOutLink = document.createElement('a');
          signOutLink.href = '#';
          signOutLink.className = 'navSignOut';
          signOutLink.textContent = 'Sign out';
          signOutLink.addEventListener('click', function (e) {
            e.preventDefault();
            logout();
          });
          el.parentNode.insertBefore(signOutLink, el.nextSibling);
        }
      });

      // Add admin link if user is admin
      if (user.role === 'admin') {
        var navLinks = document.querySelector('.navLinks');
        if (navLinks && !navLinks.querySelector('.navAdminLink')) {
          var li = document.createElement('li');
          var adminLink = document.createElement('a');
          adminLink.href = 'admin.html';
          adminLink.className = 'navLink navAdminLink';
          adminLink.textContent = 'Admin';
          adminLink.style.color = 'var(--color-starbucks-green)';
          adminLink.style.fontWeight = '700';
          li.appendChild(adminLink);
          navLinks.appendChild(li);
        }

        // Add to mobile drawer too
        var drawer = document.querySelector('.navDrawer');
        if (drawer && !drawer.querySelector('.navAdminLink')) {
          var drawerDivider = drawer.querySelector('.navDrawerDivider');
          var adminDrawerLink = document.createElement('a');
          adminDrawerLink.href = 'admin.html';
          adminDrawerLink.className = 'navDrawerLink navAdminLink';
          adminDrawerLink.textContent = 'Admin Dashboard';
          adminDrawerLink.style.color = 'var(--color-starbucks-green)';
          adminDrawerLink.style.fontWeight = '700';
          if (drawerDivider) {
            drawer.insertBefore(adminDrawerLink, drawerDivider);
          } else {
            drawer.appendChild(adminDrawerLink);
          }
        }
      }

      // Update mobile drawer
      var drawer = document.querySelector('.navDrawer');
      if (drawer && !drawer.querySelector('.navDrawerProfile')) {
        // Create profile section at top of drawer
        var profileSection = document.createElement('div');
        profileSection.className = 'navDrawerProfile';

        var initials = (user.firstName.charAt(0) + (user.lastName ? user.lastName.charAt(0) : '')).toUpperCase();

        profileSection.innerHTML =
          '<a href="profile.html" class="navDrawerProfileLink">' +
            '<div class="navDrawerProfileAvatar">' + initials + '</div>' +
            '<div class="navDrawerProfileInfo">' +
              '<span class="navDrawerProfileName">Hi, ' + user.firstName + '!</span>' +
              '<span class="navDrawerProfileEmail">' + user.email + '</span>' +
            '</div>' +
          '</a>';

        drawer.insertBefore(profileSection, drawer.firstChild);
      }

      // Change bottom buttons to Sign out only
      var drawerActions = document.querySelector('.navDrawerActions');
      if (drawerActions) {
        drawerActions.innerHTML =
          '<a href="#" class="navBtnPrimary" id="drawerSignOut">Sign out</a>';
        document.getElementById('drawerSignOut').addEventListener('click', function (e) {
          e.preventDefault();
          logout();
        });
      }
    }
  }

  // ── Check session on page load ───────────────
  function checkSession() {
    getJSON(API_BASE + '/me').then(function (res) {
      if (res.ok && res.data.user) {
        updateNavbar(res.data.user);
        window.__beanhiveUser = res.data.user;
      }
    }).catch(function () {
      // Not signed in, that's fine
    });
  }

  // ── Register ─────────────────────────────────
  function register(data) {
    return postJSON(API_BASE + '/register', data);
  }

  // ── Login ────────────────────────────────────
  function login(data) {
    return postJSON(API_BASE + '/login', data);
  }

  // ── Logout ───────────────────────────────────
  function logout() {
    postJSON(API_BASE + '/logout', {}).then(function () {
      window.__beanhiveUser = null;
      window.location.href = 'index.html';
    });
  }

  // ── Wire up Join form ────────────────────────
  function initJoinForm() {
    var form = document.getElementById('joinForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Creating account...';
      btn.disabled = true;

      var formData = {
        firstName: form.querySelector('#firstName').value.trim(),
        lastName: form.querySelector('#lastName').value.trim(),
        email: form.querySelector('#email').value.trim(),
        phone: form.querySelector('#phone') ? form.querySelector('#phone').value.trim() : '',
        password: form.querySelector('#password').value
      };

      register(formData).then(function (res) {
        if (res.ok) {
          if (window.BeanhiveToast) {
            window.BeanhiveToast.success('Welcome to Beanhive!', 'Your account has been created. Redirecting...');
          }
          setTimeout(function () {
            window.location.href = 'index.html';
          }, 1500);
        } else {
          btn.textContent = originalText;
          btn.disabled = false;
          if (window.BeanhiveToast) {
            window.BeanhiveToast.error('Registration failed', res.data.error);
          } else {
            alert(res.data.error);
          }
        }
      }).catch(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Connection error', 'Could not reach the server. Make sure the server is running.');
        }
      });
    });
  }

  // ── Wire up Sign In form ─────────────────────
  function initSignInForm() {
    var form = document.getElementById('signinForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      var formData = {
        email: form.querySelector('#email').value.trim(),
        password: form.querySelector('#password').value
      };

      login(formData).then(function (res) {
        if (res.ok && res.data.user) {
          if (window.BeanhiveToast) {
            window.BeanhiveToast.success('Welcome back!', 'Hello, ' + res.data.user.firstName + '!');
          }
          var redirectTo = (res.data.user.role === 'admin') ? 'admin.html' : 'index.html';
          setTimeout(function () {
            window.location.href = redirectTo;
          }, 1500);
        } else if (res.data.needsVerification) {
          // User hasn't verified their email
          btn.textContent = originalText;
          btn.disabled = false;
          var verifyEmail = res.data.email || formData.email;
          if (window.BeanhiveToast) {
            window.BeanhiveToast.info('Email not verified', res.data.message || 'Please check your email for the verification link.');
          }
          // Show resend option
          var existingResend = document.getElementById('loginResendRow');
          if (!existingResend) {
            var resendRow = document.createElement('div');
            resendRow.id = 'loginResendRow';
            resendRow.style.cssText = 'text-align:center;margin-top:12px;font-size:14px;color:#555;';
            resendRow.innerHTML = 'Didn\'t get the email? <button id="loginResendBtn" style="background:none;border:none;color:#00754a;font-weight:600;cursor:pointer;text-decoration:underline;font-size:14px;">Resend verification</button>';
            form.parentNode.insertBefore(resendRow, form.nextSibling);
            document.getElementById('loginResendBtn').addEventListener('click', function () {
              this.textContent = 'Sending...';
              this.disabled = true;
              var self = this;
              postJSON(API_BASE + '/resend-verification', { email: verifyEmail }).then(function () {
                self.textContent = 'Email sent!';
              }).catch(function () {
                self.textContent = 'Resend verification';
                self.disabled = false;
              });
            });
          }
        } else {
          btn.textContent = originalText;
          btn.disabled = false;
          if (window.BeanhiveToast) {
            window.BeanhiveToast.error('Sign in failed', res.data.error);
          } else {
            alert(res.data.error);
          }
        }
      }).catch(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Connection error', 'Could not reach the server. Make sure the server is running.');
        }
      });
    });
  }

  // ── Forgot Password ─────────────────────────
  function forgotPassword(email) {
    return postJSON(API_BASE + '/forgot-password', { email: email });
  }

  // ── Reset Password ─────────────────────────
  function resetPassword(token, password) {
    return postJSON(API_BASE + '/reset-password', { token: token, password: password });
  }

  // ── Wire up Forgot Password form ───────────
  function initForgotPasswordForm() {
    var form = document.getElementById('forgotPasswordForm');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      var email = form.querySelector('#email').value.trim();

      forgotPassword(email).then(function (res) {
        if (res.ok) {
          // Show success state
          form.style.display = 'none';
          var successEl = document.getElementById('forgotPasswordSuccess');
          successEl.style.display = 'block';

          // If demo token is returned, show the reset link
          if (res.data._demo_token) {
            var demoEl = document.getElementById('demoResetLink');
            demoEl.style.display = 'block';
            demoEl.innerHTML = '<strong>Demo mode:</strong> Since this app doesn\'t send emails, here\'s your reset link:<br><a href="reset-password.html?token=' + res.data._demo_token + '">Click here to reset your password</a>';
          }
        } else {
          btn.textContent = originalText;
          btn.disabled = false;
          if (window.BeanhiveToast) {
            window.BeanhiveToast.error('Error', res.data.error);
          } else {
            alert(res.data.error);
          }
        }
      }).catch(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Connection error', 'Could not reach the server. Make sure the server is running.');
        }
      });
    });
  }

  // ── Wire up Reset Password form ────────────
  function initResetPasswordForm() {
    var form = document.getElementById('resetPasswordForm');
    if (!form) return;

    var formContainer = document.getElementById('resetFormContainer');
    var invalidEl = document.getElementById('resetTokenInvalid');
    var successEl = document.getElementById('resetPasswordSuccess');

    // Extract token from URL
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token');

    if (!token) {
      // No token — show invalid state
      formContainer.style.display = 'none';
      invalidEl.style.display = 'block';
      return;
    }

    // Set the token in the hidden field
    document.getElementById('resetToken').value = token;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var newPassword = form.querySelector('#newPassword').value;
      var confirmPassword = form.querySelector('#confirmPassword').value;

      if (newPassword.length < 8) {
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Too short', 'Password must be at least 8 characters.');
        } else {
          alert('Password must be at least 8 characters.');
        }
        return;
      }

      if (newPassword !== confirmPassword) {
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Mismatch', 'Passwords do not match.');
        } else {
          alert('Passwords do not match.');
        }
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var originalText = btn.textContent;
      btn.textContent = 'Resetting...';
      btn.disabled = true;

      resetPassword(token, newPassword).then(function (res) {
        if (res.ok) {
          // Show success state
          formContainer.style.display = 'none';
          successEl.style.display = 'block';

          if (window.BeanhiveToast) {
            window.BeanhiveToast.success('Success!', 'Your password has been reset.');
          }
        } else {
          btn.textContent = originalText;
          btn.disabled = false;

          // If token is invalid/expired, show invalid state
          if (res.status === 400 && res.data.error && res.data.error.indexOf('expired') !== -1) {
            formContainer.style.display = 'none';
            invalidEl.style.display = 'block';
          } else if (window.BeanhiveToast) {
            window.BeanhiveToast.error('Error', res.data.error);
          } else {
            alert(res.data.error);
          }
        }
      }).catch(function () {
        btn.textContent = originalText;
        btn.disabled = false;
        if (window.BeanhiveToast) {
          window.BeanhiveToast.error('Connection error', 'Could not reach the server. Make sure the server is running.');
        }
      });
    });
  }

  // ── Expose globally ──────────────────────────
  window.BeanhiveAuth = {
    register: register,
    login: login,
    logout: logout,
    checkSession: checkSession,
    forgotPassword: forgotPassword,
    resetPassword: resetPassword
  };

  // ── Handle verification callback on signin page ──
  function checkVerificationStatus() {
    var params = new URLSearchParams(window.location.search);
    var verified = params.get('verified');
    if (!verified) return;

    if (verified === 'success' && window.BeanhiveToast) {
      window.BeanhiveToast.success('Email verified!', 'Your account is now active. Please sign in.');
    } else if (verified === 'error') {
      var reason = params.get('reason') || 'unknown';
      var msg = reason === 'expired'
        ? 'Your verification link has expired. Please request a new one.'
        : 'Invalid verification link. Please try again.';
      if (window.BeanhiveToast) {
        window.BeanhiveToast.error('Verification failed', msg);
      }
    }
    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname);
  }

  // ── Auto-init ────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    checkSession();
    checkVerificationStatus();
    initJoinForm();
    initSignInForm();
    initForgotPasswordForm();
    initResetPasswordForm();
  });

})();
