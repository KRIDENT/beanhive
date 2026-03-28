// ── Toast Notification System ────────────────
// Usage:
//   Toast.success('Added to cart!', 'Caramel Macchiato × 1');
//   Toast.info('Heads up', 'Your session will expire soon.');
//   Toast.warning('Low stock', 'Only 3 left in this size.');
//   Toast.error('Oops', 'Something went wrong.');
//   Toast.cart({ name, image, size, qty });

(function () {
  'use strict';

  var container = null;
  var MAX_TOASTS = 4;

  // SVG icons for each type
  var ICONS = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="20 6 9 17 4 12"/>' +
      '</svg>',
    info:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<line x1="12" y1="16" x2="12" y2="12"/>' +
        '<line x1="12" y1="8" x2="12.01" y2="8"/>' +
      '</svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>' +
        '<line x1="12" y1="9" x2="12" y2="13"/>' +
        '<line x1="12" y1="17" x2="12.01" y2="17"/>' +
      '</svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="10"/>' +
        '<line x1="15" y1="9" x2="9" y2="15"/>' +
        '<line x1="9" y1="9" x2="15" y2="15"/>' +
      '</svg>',
    cart:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="9" cy="21" r="1"/>' +
        '<circle cx="20" cy="21" r="1"/>' +
        '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' +
      '</svg>'
  };

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toastContainer';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(container);
    }
    return container;
  }

  function dismissToast(el) {
    if (el._dismissed) return;
    el._dismissed = true;
    el.classList.add('dismissing');
    el.addEventListener('animationend', function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function createToast(type, title, message, options) {
    options = options || {};
    var duration = options.duration || 4000;
    var c = ensureContainer();

    // Limit max toasts — remove oldest
    while (c.children.length >= MAX_TOASTS) {
      dismissToast(c.children[c.children.length - 1]);
    }

    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.style.setProperty('--toast-duration', duration + 'ms');

    var html = '';

    // Product thumbnail (for cart toasts)
    if (options.image) {
      html += '<img class="toastThumb" src="' + options.image + '" alt="" />';
    } else {
      html += '<span class="toastIcon">' + (ICONS[type] || ICONS.info) + '</span>';
    }

    // Content
    html += '<div class="toastContent">';
    html += '<p class="toastTitle">' + title + '</p>';
    if (message) {
      html += '<p class="toastMessage">' + message + '</p>';
    }
    html += '</div>';

    // Close button
    html += '<button class="toastClose" aria-label="Dismiss notification">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
        '<line x1="18" y1="6" x2="6" y2="18"/>' +
        '<line x1="6" y1="6" x2="18" y2="18"/>' +
      '</svg>' +
    '</button>';

    // Progress bar
    html += '<div class="toastProgress"></div>';

    el.innerHTML = html;

    // Close button click
    el.querySelector('.toastClose').addEventListener('click', function () {
      dismissToast(el);
    });

    // Pause on hover
    var timer = null;
    var remaining = duration;
    var startTime = Date.now();

    function startTimer() {
      startTime = Date.now();
      timer = setTimeout(function () {
        dismissToast(el);
      }, remaining);
    }

    el.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      remaining -= (Date.now() - startTime);
    });

    el.addEventListener('mouseleave', function () {
      startTimer();
    });

    // Insert at top (newest first)
    c.insertBefore(el, c.firstChild);
    startTimer();

    return el;
  }

  // Public API
  window.Toast = {
    success: function (title, message, options) {
      return createToast('success', title, message, options);
    },
    info: function (title, message, options) {
      return createToast('info', title, message, options);
    },
    warning: function (title, message, options) {
      return createToast('warning', title, message, options);
    },
    error: function (title, message, options) {
      return createToast('error', title, message, options);
    },
    cart: function (item) {
      var title = 'Added to cart';
      var msg = item.name;
      if (item.size) msg += ' &middot; ' + item.size;
      if (item.qty) msg += ' &times; ' + item.qty;
      return createToast('success', title, msg, {
        image: item.image,
        duration: item.duration || 3500
      });
    }
  };
})();
