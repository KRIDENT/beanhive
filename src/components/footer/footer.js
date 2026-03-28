// ─────────────────────────────────────────────
// Footer Component (Vanilla JS)
//
// Handles mobile accordion toggle for footer
// link columns. On desktop the columns are
// always expanded.
// ─────────────────────────────────────────────

function initFooter() {
  const headings = document.querySelectorAll('.footerColumnHeading');

  headings.forEach((heading) => {
    heading.addEventListener('click', () => {
      // Only toggle on mobile/tablet
      if (window.innerWidth >= 1024) return;

      const links = heading.nextElementSibling;
      if (!links) return;

      const isOpen = links.classList.contains('open');

      // Close all other columns
      headings.forEach((h) => {
        h.classList.remove('active');
        const siblingLinks = h.nextElementSibling;
        if (siblingLinks) siblingLinks.classList.remove('open');
      });

      // Toggle the clicked column
      if (!isOpen) {
        heading.classList.add('active');
        links.classList.add('open');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', initFooter);
