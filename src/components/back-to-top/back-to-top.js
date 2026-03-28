// ── Back to Top Button ──────────────────────
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.backToTop');
    if (!btn) return;

    var progressBar = btn.querySelector('.bttProgressBar');
    var circumference = 138; // 2 * PI * 22
    var ticking = false;

    function update() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

      // Show/hide button after 400px scroll
      if (scrollTop > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }

      // Update progress ring
      if (progressBar) {
        var offset = circumference - (scrollPercent * circumference);
        progressBar.style.strokeDashoffset = offset;
      }

      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    });

    // Smooth scroll to top on click
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initial state
    update();
  });
})();
