// ── Dark Mode Toggle ─────────────────────────
// Sliding pill switch — all visual state is CSS-driven
// via [data-theme="dark"] on <html>.
(function () {
  var STORAGE_KEY = 'beanhive-theme';
  var root = document.documentElement;

  // 1) Apply saved theme ASAP (prevents flash)
  //    Default to light mode if no preference is saved
  var saved = localStorage.getItem(STORAGE_KEY);
  root.setAttribute('data-theme', saved || 'light');

  // 2) Wire up toggle buttons after DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    var toggles = document.querySelectorAll('.themeToggle');
    if (!toggles.length) return;

    function isDark() {
      return root.getAttribute('data-theme') === 'dark';
    }

    function updateLabels() {
      var label = isDark() ? 'Switch to light mode' : 'Switch to dark mode';
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-label', label);
      });
    }

    function toggle() {
      var newTheme = isDark() ? 'light' : 'dark';
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem(STORAGE_KEY, newTheme);
      updateLabels();
    }

    toggles.forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });

    updateLabels();
  });
})();
