// ── Site Search ──────────────────────────────
(function () {
  // Static entries that don't come from the menu API
  var staticSearchData = [
    { name: 'Home', meta: 'Page', url: 'index.html', category: 'Pages', img: '' },
    { name: 'Menu', meta: 'Page', url: 'menu.html', category: 'Pages', img: '' },
    { name: 'Rewards', meta: 'Page', url: 'rewards.html', category: 'Pages', img: '' },
    { name: 'Gift Cards', meta: 'Page', url: 'gift-cards.html', category: 'Pages', img: '' },
    { name: 'Sign In', meta: 'Page', url: 'signin.html', category: 'Pages', img: '' },
    { name: 'Join Now', meta: 'Page', url: 'join.html', category: 'Pages', img: '' },
    { name: 'Store Locator', meta: 'Page', url: 'store-locator.html', category: 'Pages', img: '' },
    { name: 'Beanhive Rewards', meta: 'Earn Stars for free drinks', url: 'rewards.html', category: 'Rewards', img: '' },
    { name: 'Gold Status', meta: 'Rewards tier', url: 'rewards.html', category: 'Rewards', img: '' },
    { name: 'Free Birthday Drink', meta: 'Rewards perk', url: 'rewards.html', category: 'Rewards', img: '' }
  ];

  // Search data — starts with static entries, enriched from API
  var searchData = staticSearchData.slice();
  var _apiCache = null;
  var _cacheTime = 0;
  var CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getSearchCategory(item) {
    if (item.isFood) return 'Food';
    var cat = (item.category || '').toLowerCase();
    if (cat.indexOf('whole bean') !== -1 || cat.indexOf('via instant') !== -1) return 'At Home Coffee';
    if (cat.indexOf('merchandise') !== -1) return 'Merchandise';
    return 'Drinks';
  }

  function transformMenuItem(item) {
    return {
      name: item.name,
      meta: item.category + ' · $' + Number(item.price).toFixed(2),
      url: 'drink-detail.html?drink=' + item.slug,
      category: getSearchCategory(item),
      img: item.image || ''
    };
  }

  function loadSearchData() {
    var now = Date.now();
    if (_apiCache && (now - _cacheTime) < CACHE_TTL) return;

    var apiBase = window.location.origin + '/v1';

    fetch(apiBase + '/menu')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        var items = (json.data && json.data.items) || [];
        var menuEntries = items.map(transformMenuItem);
        _apiCache = menuEntries;
        _cacheTime = Date.now();
        searchData = staticSearchData.concat(menuEntries);
      })
      .catch(function () {
        // API unreachable — keep whatever data we already have
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Pre-fetch menu data on page load
    loadSearchData();
    var overlay = document.querySelector('.searchOverlay');
    var input = document.querySelector('.searchInput');
    var resultsContainer = document.querySelector('.searchResults');
    var quickLinks = document.querySelector('.searchQuickLinks');
    var openBtns = document.querySelectorAll('.navSearchBtn');
    var closeBtn = document.querySelector('.searchCloseBtn');

    if (!overlay || !input) return;

    function openSearch() {
      loadSearchData(); // refresh if cache expired
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 100);
    }

    function closeSearch() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      input.value = '';
      renderDefault();
    }

    openBtns.forEach(function (btn) {
      btn.addEventListener('click', openSearch);
    });

    closeBtn.addEventListener('click', closeSearch);

    // Close on overlay background click
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeSearch();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeSearch();
      }
    });

    // Open on Ctrl+K / Cmd+K
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (overlay.classList.contains('open')) {
          closeSearch();
        } else {
          openSearch();
        }
      }
    });

    function renderDefault() {
      resultsContainer.innerHTML = '';
      quickLinks.style.display = '';
    }

    function renderResults(query) {
      if (!query.trim()) {
        renderDefault();
        return;
      }

      quickLinks.style.display = 'none';
      var q = query.toLowerCase();

      var matches = searchData.filter(function (item) {
        return item.name.toLowerCase().indexOf(q) !== -1 ||
               item.meta.toLowerCase().indexOf(q) !== -1 ||
               item.category.toLowerCase().indexOf(q) !== -1;
      });

      if (matches.length === 0) {
        resultsContainer.innerHTML =
          '<div class="searchEmpty">' +
            '<svg class="searchEmptyIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<p class="searchEmptyText">No results for "' + escapeHtml(query) + '"<br>Try searching for a drink, page, or category.</p>' +
          '</div>';
        return;
      }

      // Group by category
      var groups = {};
      matches.forEach(function (item) {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
      });

      var html = '';
      for (var cat in groups) {
        html += '<div class="searchResultGroup"><span class="searchResultGroupTitle">' + escapeHtml(cat) + '</span></div>';
        groups[cat].forEach(function (item) {
          var thumbHtml = item.img
            ? '<div class="searchResultThumb"><img src="' + item.img + '" alt="" loading="lazy" /></div>'
            : '<div class="searchResultThumb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:24px;height:24px;margin:10px;opacity:0.3"><circle cx="12" cy="12" r="10"/></svg></div>';

          html +=
            '<a href="' + item.url + '" class="searchResultItem">' +
              thumbHtml +
              '<div class="searchResultInfo">' +
                '<div class="searchResultName">' + highlightMatch(item.name, q) + '</div>' +
                '<div class="searchResultMeta">' + escapeHtml(item.meta) + '</div>' +
              '</div>' +
              '<svg class="searchResultArrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>' +
            '</a>';
        });
      }

      resultsContainer.innerHTML = html;
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function highlightMatch(text, query) {
      var idx = text.toLowerCase().indexOf(query);
      if (idx === -1) return escapeHtml(text);
      return escapeHtml(text.substring(0, idx)) +
        '<strong>' + escapeHtml(text.substring(idx, idx + query.length)) + '</strong>' +
        escapeHtml(text.substring(idx + query.length));
    }

    // Debounced search input (150ms)
    var searchTimer = null;
    input.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        renderResults(input.value);
      }, 150);
    });

    // Keyboard navigation
    var activeIndex = -1;

    input.addEventListener('keydown', function (e) {
      var items = resultsContainer.querySelectorAll('.searchResultItem');
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        updateActive(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        updateActive(items);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        items[activeIndex].click();
      }
    });

    function updateActive(items) {
      items.forEach(function (item, i) {
        item.classList.toggle('active', i === activeIndex);
        if (i === activeIndex) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    // Reset active index on new search
    input.addEventListener('input', function () {
      activeIndex = -1;
    });

    renderDefault();
  });
})();
