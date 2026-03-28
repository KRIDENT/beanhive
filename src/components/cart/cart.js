/* -------------------------------------------------
   CART / SHOPPING BAG SYSTEM
   Slide-out drawer with localStorage persistence.
   ------------------------------------------------- */

(function () {
  'use strict';

  var STORAGE_KEY = 'beanhive-cart';
  var TAX_RATE = 0.0825; // 8.25% estimated tax

  /* ── LocalStorage Helpers ──────────────────── */

  function getCart() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // silently fail if storage is full / blocked
    }
  }

  /* ── Cart Mutation Helpers ─────────────────── */

  function addToCart(item) {
    var cart = getCart();
    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) {
        existing = cart[i];
        break;
      }
    }
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        img: item.img,
        size: item.size || 'Grande',
        qty: 1
      });
    }
    saveCart(cart);
    renderCart();
    updateBadge();

    // Fire toast notification
    if (window.Toast) {
      Toast.cart({
        name: item.name,
        image: item.img || '',
        size: item.size || 'Grande',
        qty: existing ? existing.qty : 1
      });
    }
  }

  function removeFromCart(id) {
    var cart = getCart();
    var removed = null;
    var filtered = [];
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id && !removed) {
        removed = cart[i];
      } else {
        filtered.push(cart[i]);
      }
    }
    saveCart(filtered);
    renderCart();
    updateBadge();

    if (window.Toast && removed) {
      Toast.info('Removed from cart', removed.name + ' has been removed.');
    }
  }

  function updateQty(id, delta) {
    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === id) {
        cart[i].qty += delta;
        if (cart[i].qty <= 0) {
          cart.splice(i, 1);
        }
        break;
      }
    }
    saveCart(cart);
    renderCart();
    updateBadge();
  }

  function getTotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * cart[i].qty;
    }
    return total;
  }

  function getCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].qty;
    }
    return count;
  }

  /* ── DOM Injection: Cart Icon + Overlay ────── */

  function injectCartButton() {
    // Find the navActions container and insert cart button after search button
    var navActions = document.querySelector('.navActions');
    if (!navActions) return;

    // Don't inject twice
    if (navActions.querySelector('.navCartBtn')) return;

    var btn = document.createElement('button');
    btn.className = 'navCartBtn';
    btn.setAttribute('aria-label', 'Shopping bag');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
        '<line x1="3" y1="6" x2="21" y2="6"/>' +
        '<path d="M16 10a4 4 0 01-8 0"/>' +
      '</svg>' +
      '<span class="cartBadge" data-count="0">0</span>';

    // Insert after the search button
    var searchBtn = navActions.querySelector('.navSearchBtn');
    if (searchBtn && searchBtn.nextSibling) {
      navActions.insertBefore(btn, searchBtn.nextSibling);
    } else {
      // Fallback: insert at beginning of navActions
      navActions.insertBefore(btn, navActions.firstChild);
    }

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      openCart();
    });
  }

  function injectCartDrawer() {
    // Don't inject twice
    if (document.querySelector('.cartOverlay')) return;

    var overlay = document.createElement('div');
    overlay.className = 'cartOverlay';
    overlay.setAttribute('aria-label', 'Shopping cart');

    var drawer = document.createElement('div');
    drawer.className = 'cartDrawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');

    drawer.innerHTML =
      '<div class="cartHeader">' +
        '<div>' +
          '<span class="cartTitle">Your Order</span>' +
          '<span class="cartCount"></span>' +
        '</div>' +
        '<button class="cartCloseBtn" aria-label="Close cart">&times;</button>' +
      '</div>' +
      '<div class="cartItems"></div>' +
      '<div class="cartFooter"></div>';

    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // Close on overlay click (not on drawer)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeCart();
    });

    // Close button
    var closeBtn = overlay.querySelector('.cartCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeCart();
      });
    }
  }

  /* ── Open / Close ──────────────────────────── */

  function openCart() {
    var overlay = document.querySelector('.cartOverlay');
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCart() {
    var overlay = document.querySelector('.cartOverlay');
    if (overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  /* ── Render Cart Drawer ────────────────────── */

  function renderCart() {
    var cart = getCart();
    var itemsContainer = document.querySelector('.cartItems');
    var footerContainer = document.querySelector('.cartFooter');
    var countLabel = document.querySelector('.cartCount');

    if (!itemsContainer || !footerContainer) return;

    var count = getCount();

    // Update count label in header
    if (countLabel) {
      countLabel.textContent = count > 0 ? '(' + count + ' item' + (count !== 1 ? 's' : '') + ')' : '';
    }

    // Empty state
    if (cart.length === 0) {
      itemsContainer.innerHTML =
        '<div class="cartEmpty">' +
          '<svg class="cartEmptyIcon" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M20 58c0-2 4-4 12-4s12 2 12 4"/>' +
            '<path d="M18 18h28l-3 24H21L18 18z"/>' +
            '<path d="M26 14c0-4 2.7-8 6-8s6 4 6 8"/>' +
            '<line x1="28" y1="24" x2="28" y2="36"/>' +
            '<line x1="36" y1="24" x2="36" y2="36"/>' +
          '</svg>' +
          '<p class="cartEmptyText">Your bag is empty</p>' +
          '<a href="menu.html" class="cartEmptyLink">Start an order</a>' +
        '</div>';
      footerContainer.innerHTML = '';
      footerContainer.style.display = 'none';
      return;
    }

    // Build item list
    footerContainer.style.display = '';
    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var lineTotal = (item.price * item.qty).toFixed(2);
      html +=
        '<div class="cartItem" data-cart-id="' + item.id + '">' +
          '<div class="cartItemThumb">' +
            '<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.name) + '" />' +
          '</div>' +
          '<div class="cartItemInfo">' +
            '<p class="cartItemName">' + escapeHtml(item.name) + '</p>' +
            '<p class="cartItemSize">' + escapeHtml(item.size) + '</p>' +
            '<p class="cartItemPrice">$' + lineTotal + '</p>' +
            '<div class="cartItemQty">' +
              '<button class="cartItemQtyBtn" data-action="dec" data-id="' + item.id + '" aria-label="Decrease quantity">&minus;</button>' +
              '<span class="cartItemQtyCount">' + item.qty + '</span>' +
              '<button class="cartItemQtyBtn" data-action="inc" data-id="' + item.id + '" aria-label="Increase quantity">&plus;</button>' +
            '</div>' +
          '</div>' +
          '<button class="cartItemRemove" data-id="' + item.id + '" aria-label="Remove ' + escapeHtml(item.name) + '">&times;</button>' +
        '</div>';
    }
    itemsContainer.innerHTML = html;

    // Build footer
    var subtotal = getTotal();
    var tax = subtotal * TAX_RATE;
    var total = subtotal + tax;

    footerContainer.innerHTML =
      '<div class="cartFooterRow"><span>Subtotal</span><span>$' + subtotal.toFixed(2) + '</span></div>' +
      '<div class="cartFooterRow"><span>Estimated Tax</span><span>$' + tax.toFixed(2) + '</span></div>' +
      '<div class="cartFooterTotal"><span>Total</span><span>$' + total.toFixed(2) + '</span></div>' +
      '<button class="cartCheckoutBtn">Checkout</button>';

    // Wire qty buttons via delegation
    itemsContainer.onclick = function (e) {
      var target = e.target;
      if (target.classList.contains('cartItemQtyBtn')) {
        var id = target.getAttribute('data-id');
        var action = target.getAttribute('data-action');
        if (action === 'inc') updateQty(id, 1);
        else if (action === 'dec') updateQty(id, -1);
      }
      if (target.classList.contains('cartItemRemove')) {
        var removeId = target.getAttribute('data-id');
        removeFromCart(removeId);
      }
    };
  }

  /* ── Update Badge ──────────────────────────── */

  function updateBadge() {
    var badge = document.querySelector('.cartBadge');
    if (!badge) return;
    var count = getCount();
    badge.textContent = count;
    badge.setAttribute('data-count', count.toString());
  }

  /* ── Wire "Add to Order" Buttons (Event Delegation) ── */

  function wireAddButtons() {
    // Use event delegation on document so dynamically created buttons work too
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.productCardCta, .menuCardCta, .catDetailAddBtn, .ftCardBtn');
      if (!btn) return;
      e.preventDefault();

      // Find the parent card/item
      var card = btn.closest('.productCard') || btn.closest('.menuCard') || btn.closest('.catDetailItem') || btn.closest('.ftCard');
      if (!card) return;

      // Extract data
      var nameEl = card.querySelector('.productCardName') || card.querySelector('.menuCardName') || card.querySelector('.catDetailItemName') || card.querySelector('.ftCardTitle');
      var priceEl = card.querySelector('.productCardPrice') || card.querySelector('.menuCardPrice') || card.querySelector('.catDetailItemPrice');
      var imgEl = card.querySelector('.productCardImage') || card.querySelector('.menuCardImage') || card.querySelector('.catDetailItemThumb img') || card.querySelector('.ftCardImage img') || card.querySelector('img');

      if (!nameEl) return;

      var name = nameEl.textContent.trim();
      var price = 5.25; // default price
      if (priceEl) {
        var priceText = priceEl.textContent.trim().replace(/[^0-9.]/g, '');
        var parsed = parseFloat(priceText);
        if (!isNaN(parsed)) price = parsed;
      }

      // Check for data-price attribute
      if (btn.dataset && btn.dataset.price) {
        var dp = parseFloat(btn.dataset.price);
        if (!isNaN(dp)) price = dp;
      }

      var img = imgEl ? imgEl.getAttribute('src') : '';
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      addToCart({
        id: id,
        name: name,
        price: price,
        img: img,
        size: 'Grande'
      });

      // "Added!" feedback
      var originalText = btn.textContent;
      btn.textContent = 'Added!';
      btn.classList.add('cartAdded');

      setTimeout(function () {
        btn.textContent = originalText;
        btn.classList.remove('cartAdded');
      }, 1500);
    });
  }

  /* ── Escape HTML Helper ────────────────────── */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  /* ── Keyboard: Escape closes cart ──────────── */

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var overlay = document.querySelector('.cartOverlay');
      if (overlay && overlay.classList.contains('open')) {
        closeCart();
      }
    }
  });

  /* ── Checkout: Submit order to API ──────────── */

  function checkout() {
    var cart = getCart();
    if (cart.length === 0) {
      if (window.Toast) Toast.warning('Cart is empty', 'Add some drinks first!');
      return;
    }

    var checkoutBtn = document.querySelector('.cartCheckoutBtn');
    if (checkoutBtn) {
      checkoutBtn.textContent = 'Placing order...';
      checkoutBtn.disabled = true;
    }

    fetch(window.location.origin + '/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ items: cart })
    })
    .then(function (res) {
      return res.json().then(function (json) {
        var payload = json.data || json;
        if (!res.ok && json.error) {
          payload = { error: json.error.message || json.error };
        }
        return { ok: res.ok, status: res.status, data: payload };
      });
    })
    .then(function (res) {
      if (res.ok) {
        // Clear cart
        saveCart([]);
        renderCart();
        updateBadge();
        closeCart();

        // Show success toast with stars earned
        if (window.Toast) {
          Toast.success(
            'Order confirmed!',
            'Order #' + res.data.order.id + ' — $' + res.data.order.total.toFixed(2) +
            '. You earned ' + res.data.order.starsEarned + ' Stars!'
          );
        }
      } else if (res.status === 401) {
        // Not signed in — redirect to signin
        if (checkoutBtn) {
          checkoutBtn.textContent = 'Checkout';
          checkoutBtn.disabled = false;
        }
        if (window.Toast) {
          Toast.info('Sign in required', 'Please sign in to place an order.');
        }
        setTimeout(function () {
          window.location.href = 'signin.html';
        }, 1500);
      } else {
        if (checkoutBtn) {
          checkoutBtn.textContent = 'Checkout';
          checkoutBtn.disabled = false;
        }
        if (window.Toast) {
          Toast.error('Order failed', res.data.error || 'Something went wrong.');
        }
      }
    })
    .catch(function () {
      if (checkoutBtn) {
        checkoutBtn.textContent = 'Checkout';
        checkoutBtn.disabled = false;
      }
      if (window.Toast) {
        Toast.error('Connection error', 'Could not reach the server. Is it running?');
      }
    });
  }

  // Wire checkout button via delegation on the cart drawer
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('cartCheckoutBtn')) {
      e.preventDefault();
      checkout();
    }
  });

  /* ── Init on DOMContentLoaded ──────────────── */

  document.addEventListener('DOMContentLoaded', function () {
    injectCartButton();
    injectCartDrawer();
    wireAddButtons();
    renderCart();
    updateBadge();
  });

})();
