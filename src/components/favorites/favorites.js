// ─────────────────────────────────────────────
// FAVORITES CLIENT
// Adds heart buttons to drink cards and the
// drink detail page. Syncs with /v1/favorites.
// ─────────────────────────────────────────────
(function () {
  'use strict';

  var API = window.location.origin + '/v1/favorites';
  var cachedFavorites = null; // { drinkId: true, ... }

  // ── SVG heart icon ─────────────────────────
  var HEART_SVG =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
      '<path class="favHeart" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 ' +
      '2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 ' +
      '19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>' +
    '</svg>';

  // ── API helpers ────────────────────────────
  function fetchJSON(url, opts) {
    opts = opts || {};
    opts.credentials = 'include';
    opts.headers = opts.headers || {};
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    return fetch(url, opts).then(function (res) {
      return res.json().then(function (json) {
        var payload = json.data || json;
        if (!res.ok && json.error) {
          payload = { error: json.error.message || json.error };
        }
        return { ok: res.ok, status: res.status, data: payload };
      });
    });
  }

  // ── Load user's favorites ──────────────────
  function loadFavorites() {
    return fetchJSON(API).then(function (res) {
      if (res.ok) {
        cachedFavorites = {};
        res.data.favorites.forEach(function (f) {
          cachedFavorites[f.drinkId] = true;
        });
        return cachedFavorites;
      }
      return null; // Not signed in or error
    }).catch(function () {
      return null;
    });
  }

  // ── Toggle favorite ────────────────────────
  function toggleFavorite(drinkId, drinkName, btn) {
    var isFav = btn.classList.contains('favorited');

    // Optimistic UI update
    btn.classList.toggle('favorited');
    btn.classList.add('favAnimate');
    setTimeout(function () { btn.classList.remove('favAnimate'); }, 400);

    if (isFav) {
      // Remove
      fetchJSON(API + '/' + encodeURIComponent(drinkId), { method: 'DELETE' })
        .then(function (res) {
          if (res.ok) {
            if (cachedFavorites) delete cachedFavorites[drinkId];
            if (window.Toast) Toast.info('Removed', drinkName + ' removed from favorites.');
          } else if (res.status === 401) {
            btn.classList.add('favorited'); // revert
            if (window.Toast) Toast.info('Sign in required', 'Sign in to save favorites.');
          } else {
            btn.classList.add('favorited'); // revert
          }
        }).catch(function () {
          btn.classList.add('favorited'); // revert
        });
    } else {
      // Add
      fetchJSON(API, {
        method: 'POST',
        body: JSON.stringify({ drinkId: drinkId, drinkName: drinkName })
      }).then(function (res) {
        if (res.ok) {
          if (cachedFavorites) cachedFavorites[drinkId] = true;
          if (window.Toast) Toast.success('Favorited!', drinkName + ' added to favorites.');
        } else if (res.status === 401) {
          btn.classList.remove('favorited'); // revert
          if (window.Toast) Toast.info('Sign in required', 'Sign in to save favorites.');
        } else if (res.status === 409) {
          // Already favorited, keep it
          btn.classList.add('favorited');
        } else {
          btn.classList.remove('favorited'); // revert
        }
      }).catch(function () {
        btn.classList.remove('favorited'); // revert
      });
    }
  }

  // ── Inject heart buttons on cards ──────────
  function injectHeartButtons() {
    // Find all product/menu cards that have images
    var cards = document.querySelectorAll(
      '.productCard, .menuCard, .catDetailItem'
    );

    cards.forEach(function (card) {
      // Skip if already has a fav button
      if (card.querySelector('.favBtn')) return;

      // Find the image wrapper to position the heart over
      var imgWrap = card.querySelector(
        '.productCardImageWrapper, .menuCardImageWrapper, .catDetailItemThumb'
      );
      if (!imgWrap) return;

      // Get drink name and id
      var nameEl = card.querySelector(
        '.productCardName, .menuCardName, .catDetailItemName'
      );
      if (!nameEl) return;

      var drinkName = nameEl.textContent.trim();
      var drinkId = drinkName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Create button
      var btn = document.createElement('button');
      btn.className = 'favBtn';
      btn.setAttribute('aria-label', 'Add ' + drinkName + ' to favorites');
      btn.innerHTML = HEART_SVG;

      // Check if favorited
      if (cachedFavorites && cachedFavorites[drinkId]) {
        btn.classList.add('favorited');
      }

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(drinkId, drinkName, btn);
      });

      // Make the image wrapper relative if not already
      imgWrap.style.position = 'relative';
      imgWrap.appendChild(btn);
    });
  }

  // ── Inject heart on drink detail page ──────
  function injectDetailHeart() {
    var nameEl = document.querySelector('.ddName');
    if (!nameEl) return;
    if (document.querySelector('.ddFavBtn')) return;

    var drinkName = nameEl.textContent.trim();
    var drinkId = drinkName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Create row with heart + label
    var row = document.createElement('div');
    row.className = 'ddFavRow';

    var btn = document.createElement('button');
    btn.className = 'favBtn ddFavBtn';
    btn.setAttribute('aria-label', 'Add ' + drinkName + ' to favorites');
    btn.innerHTML = HEART_SVG;

    var label = document.createElement('span');
    label.className = 'ddFavLabel';
    label.textContent = 'Save to favorites';

    if (cachedFavorites && cachedFavorites[drinkId]) {
      btn.classList.add('favorited');
      label.textContent = 'Saved to favorites';
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      toggleFavorite(drinkId, drinkName, btn);
      label.textContent = btn.classList.contains('favorited')
        ? 'Saved to favorites'
        : 'Save to favorites';
    });

    row.appendChild(btn);
    row.appendChild(label);

    // Insert after the drink name
    var caloriesEl = document.querySelector('.ddCalories');
    var insertAfter = caloriesEl || nameEl;
    insertAfter.parentNode.insertBefore(row, insertAfter.nextSibling);
  }

  // ── Init ───────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    loadFavorites().then(function () {
      injectHeartButtons();
      injectDetailHeart();

      // Re-inject hearts when category detail views load (MutationObserver)
      var mainContent = document.querySelector('.menuMain, .menuContent, main');
      if (mainContent) {
        var observer = new MutationObserver(function () {
          setTimeout(injectHeartButtons, 100);
        });
        observer.observe(mainContent, { childList: true, subtree: true });
      }
    });
  });

  // ── Expose globally ────────────────────────
  window.BeanhiveFavorites = {
    load: loadFavorites,
    toggle: toggleFavorite,
    inject: injectHeartButtons
  };

})();
