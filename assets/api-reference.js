/** Hide the loading shell once Scalar renders the API reference UI. */
(function () {
  const config = document.getElementById('api-reference');
  if (!config) return;

  const hideShell = () => document.querySelector('.site-loading-shell')?.remove();

  const observer = new MutationObserver(() => {
    const scalarUi = document.querySelector('.scalar-app, [class*="scalar"], .references-classic');
    if (scalarUi) hideShell();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('load', () => window.setTimeout(hideShell, 12000));
})();
