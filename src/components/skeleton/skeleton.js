// ── Skeleton Loading States ──────────────────
// Adds shimmer placeholders behind images,
// fading them in once loaded.
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    // Find all images that should get skeleton loading
    var images = document.querySelectorAll(
      '.productCardImage, .menuCardImage, .heroRealImage, ' +
      '.menuCatImage, .ddMainImage, .ddSuggestionImg, ' +
      '.featuredPromoImage img, .rewardsHeroImg'
    );

    images.forEach(function (img) {
      // Skip if already loaded (cached)
      if (img.complete && img.naturalWidth > 0) {
        img.classList.add('loaded');
        return;
      }

      // Mark for skeleton treatment
      img.setAttribute('data-skeleton', '');

      // Create skeleton placeholder behind the image
      var wrapper = img.parentElement;
      if (!wrapper) return;

      // Only add skeleton if wrapper doesn't already have one
      if (wrapper.querySelector('.skeleton')) return;

      var skel = document.createElement('div');
      skel.className = 'skeleton skeleton--img';

      // Match the wrapper's shape
      if (wrapper.classList.contains('menuCatImageWrapper') ||
          wrapper.classList.contains('ddSuggestionImgWrap')) {
        skel.classList.add('skeleton--circle');
      }

      // Position skeleton absolutely behind the image
      skel.style.position = 'absolute';
      skel.style.inset = '0';
      skel.style.zIndex = '0';

      // Ensure wrapper is positioned
      var wrapperPos = window.getComputedStyle(wrapper).position;
      if (wrapperPos === 'static') {
        wrapper.style.position = 'relative';
      }

      // Ensure image is above skeleton
      img.style.position = 'relative';
      img.style.zIndex = '1';

      wrapper.insertBefore(skel, img);

      // Fade in image and remove skeleton when loaded
      img.addEventListener('load', function () {
        img.classList.add('loaded');

        // Remove skeleton after fade-in completes
        setTimeout(function () {
          if (skel.parentNode) {
            skel.parentNode.removeChild(skel);
          }
          img.removeAttribute('data-skeleton');
          img.style.position = '';
          img.style.zIndex = '';
        }, 500);
      });

      // Handle error — remove skeleton, show broken state
      img.addEventListener('error', function () {
        img.classList.add('loaded');
        if (skel.parentNode) {
          skel.parentNode.removeChild(skel);
        }
      });
    });

    // ── Skeleton for product card grids ──────
    // Show skeleton cards until real cards render
    var grids = document.querySelectorAll('.productGrid, .menuGrid');
    grids.forEach(function (grid) {
      var cards = grid.querySelectorAll('.productCard, .menuCard');
      cards.forEach(function (card) {
        var img = card.querySelector('img');
        if (!img) return;

        // If image hasn't loaded yet, add skeleton overlay to the card
        if (!img.complete || img.naturalWidth === 0) {
          card.classList.add('card--loading');

          img.addEventListener('load', function () {
            card.classList.remove('card--loading');
          });

          img.addEventListener('error', function () {
            card.classList.remove('card--loading');
          });
        }
      });
    });
  });
})();
