// ─────────────────────────────────────────────
// Navbar Component (Vanilla JS)
//
// Handles mobile drawer toggle, hamburger
// animation, body scroll lock, and keyboard
// accessibility for the top navigation bar.
// ─────────────────────────────────────────────

function initNavbar() {
  var hamburger = document.querySelector('.navHamburger');
  var drawer = document.querySelector('.navDrawer');

  if (!hamburger || !drawer) return;

  function openDrawer() {
    hamburger.classList.add('active');
    drawer.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    hamburger.classList.remove('active');
    drawer.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleDrawer() {
    if (drawer.classList.contains('open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  // Hamburger click
  hamburger.addEventListener('click', toggleDrawer);

  // Close drawer when a mobile link is clicked
  var drawerLinks = drawer.querySelectorAll('a');
  for (var i = 0; i < drawerLinks.length; i++) {
    drawerLinks[i].addEventListener('click', closeDrawer);
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Close if window resizes past mobile breakpoint (debounced)
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth >= 1024 && drawer.classList.contains('open')) {
        closeDrawer();
      }
    }, 150);
  });
}

document.addEventListener('DOMContentLoaded', initNavbar);
