// ── Scroll Cup Indicator + Back to Top ───────
// A coffee cup fixed to the bottom-right that
// fills with coffee as the user scrolls down.
// Click to smooth-scroll back to top.
(function () {
  document.addEventListener('DOMContentLoaded', function () {

    // Don't show on very short pages
    if (document.body.scrollHeight <= window.innerHeight + 200) return;

    // Inject the cup HTML
    var cup = document.createElement('div');
    cup.className = 'scrollCup';
    cup.setAttribute('role', 'button');
    cup.setAttribute('aria-label', 'Scroll to top');
    cup.setAttribute('tabindex', '0');
    cup.innerHTML =
      '<svg class="scrollCupSvg" viewBox="0 0 54 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +

        // Up arrow (shows when hovering/near top intent)
        '<g class="scrollCupArrow" opacity="0">' +
          '<path d="M24 42 L24 26" stroke="#f5f0e8" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M19 31 L24 26 L29 31" stroke="#f5f0e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</g>' +

        // Steam lines (animated)
        '<g class="scrollCupSteam" opacity="0">' +
          '<path d="M17 14 Q18 8 16 3" stroke="#b0a898" stroke-width="1.5" stroke-linecap="round" fill="none"><animate attributeName="d" values="M17 14 Q18 8 16 3;M17 14 Q15 8 17 3;M17 14 Q18 8 16 3" dur="2.5s" repeatCount="indefinite"/></path>' +
          '<path d="M24 12 Q25 6 23 1" stroke="#b0a898" stroke-width="1.5" stroke-linecap="round" fill="none"><animate attributeName="d" values="M24 12 Q25 6 23 1;M24 12 Q22 6 24 1;M24 12 Q25 6 23 1" dur="3s" repeatCount="indefinite"/></path>' +
          '<path d="M31 14 Q32 8 30 3" stroke="#b0a898" stroke-width="1.5" stroke-linecap="round" fill="none"><animate attributeName="d" values="M31 14 Q32 8 30 3;M31 14 Q29 8 31 3;M31 14 Q32 8 30 3" dur="2.8s" repeatCount="indefinite"/></path>' +
        '</g>' +

        // Cup body (outline)
        '<path d="M6 18 L9 52 Q10 58 16 58 L32 58 Q38 58 39 52 L42 18 Z" fill="#f5f0e8" stroke="#c4bfb5" stroke-width="2" stroke-linejoin="round"/>' +

        // Coffee fill — clipPath controlled by JS
        '<defs><clipPath id="cupClip"><rect x="7" y="18" width="34" height="40" id="cupFillRect" /></clipPath></defs>' +
        '<path d="M6 18 L9 52 Q10 58 16 58 L32 58 Q38 58 39 52 L42 18 Z" clip-path="url(#cupClip)" fill="url(#coffeeGrad)"/>' +

        // Coffee gradient
        '<defs>' +
          '<linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#d4a76a"/>' +
            '<stop offset="15%" stop-color="#8b5e3c"/>' +
            '<stop offset="50%" stop-color="#5a3520"/>' +
            '<stop offset="100%" stop-color="#3d2212"/>' +
          '</linearGradient>' +
        '</defs>' +

        // Cup rim highlight
        '<path d="M6 18 Q24 14 42 18" stroke="#c4bfb5" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +

        // Handle
        '<path d="M42 24 Q50 26 50 34 Q50 42 42 40" stroke="#c4bfb5" stroke-width="2" stroke-linecap="round" fill="none"/>' +

        // Saucer
        '<ellipse cx="24" cy="60" rx="22" ry="4" fill="none" stroke="#c4bfb5" stroke-width="2"/>' +

      '</svg>' +
      '<span class="scrollCupPercent">0%</span>';

    document.body.appendChild(cup);

    var fillRect = document.getElementById('cupFillRect');
    var steamGroup = cup.querySelector('.scrollCupSteam');
    var arrowGroup = cup.querySelector('.scrollCupArrow');
    var percentEl = cup.querySelector('.scrollCupPercent');
    if (!fillRect) return;

    // Full cup interior: y goes from 18 (top) to 58 (bottom) = 40px
    var CUP_TOP = 18;
    var CUP_HEIGHT = 40;

    function updateCup() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;

      // Show cup after scrolling a bit
      if (scrollTop > 100) {
        cup.classList.add('visible');
      } else {
        cup.classList.remove('visible');
      }

      // Fill from bottom up
      var fillHeight = progress * CUP_HEIGHT;
      var fillY = CUP_TOP + (CUP_HEIGHT - fillHeight);

      fillRect.setAttribute('y', fillY);
      fillRect.setAttribute('height', fillHeight);

      // Update percent text
      if (percentEl) {
        percentEl.textContent = Math.round(progress * 100) + '%';
      }

      // Show steam when cup is mostly full (>70%)
      if (progress > 0.7) {
        steamGroup.setAttribute('opacity', Math.min((progress - 0.7) / 0.3, 1));
      } else {
        steamGroup.setAttribute('opacity', '0');
      }

      // Show arrow inside the cup when fill > 30%
      if (progress > 0.3) {
        arrowGroup.setAttribute('opacity', '0.8');
      } else {
        arrowGroup.setAttribute('opacity', '0');
      }
    }

    // Throttled scroll handler via requestAnimationFrame
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateCup();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Click → scroll to top
    cup.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Keyboard support (Enter/Space)
    cup.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    updateCup(); // initial state
  });
})();
