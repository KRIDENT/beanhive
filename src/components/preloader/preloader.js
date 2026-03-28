// ── Preloader: entry + page-transition ───────────────
(function () {
  var loader = document.querySelector('.preloader');
  if (!loader) return;

  // 1) Dismiss preloader after page loads
  window.addEventListener('load', function () {
    setTimeout(function () {
      loader.classList.add('loaded');
    }, 1200);
  });

  // 2) Show preloader on navigation to another page
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');

    // Skip anchors, javascript:, external links, and # links
    if (!href ||
        href.startsWith('#') ||
        href.startsWith('javascript:') ||
        href.startsWith('mailto:') ||
        link.target === '_blank') {
      return;
    }

    // Only intercept local page navigations (.html files or relative paths)
    if (href.endsWith('.html') || (!href.startsWith('http') && !href.startsWith('//'))) {
      e.preventDefault();
      loader.classList.remove('loaded');

      // Navigate after the preloader fades in
      setTimeout(function () {
        window.location.href = href;
      }, 600);
    }
  });
})();
