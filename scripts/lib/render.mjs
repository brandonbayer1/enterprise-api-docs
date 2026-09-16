import { FAVICON_HEAD } from '../favicon-head.mjs';

const LOADING_SHELL = `
<style id="loading-shell">
  html { background: #fff; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { html { background: #111; } }
  body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, sans-serif; }
  .site-loading-shell {
    display: flex; flex-direction: column; min-height: 100vh;
  }
  .site-loading-header {
    display: flex; align-items: center; gap: 1rem;
    padding: 0.75rem 1.25rem; border-bottom: 1px solid #e5e7eb;
    background: #fff;
  }
  @media (prefers-color-scheme: dark) {
    .site-loading-header { background: #171717; border-color: #333; color: #f3f4f6; }
  }
  .site-loading-brand { font-weight: 600; font-size: 0.95rem; }
  .site-loading-body { flex: 1; padding: 2rem 1.25rem; max-width: 960px; }
  .site-loading-spinner {
    width: 28px; height: 28px; border: 3px solid #e5e7eb;
    border-top-color: #0f66d3; border-radius: 50%;
    animation: site-spin 0.8s linear infinite;
  }
  @media (prefers-color-scheme: dark) {
    .site-loading-spinner { border-color: #333; border-top-color: #60a5fa; }
  }
  @keyframes site-spin { to { transform: rotate(360deg); } }
  .site-loading-label { margin-top: 0.75rem; color: #6b7280; font-size: 0.875rem; }
</style>`;

/**
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.bodyHtml
 * @param {'guide' | 'api' | 'api-index'} opts.kind
 * @param {string} opts.activeTab
 * @param {string} opts.activePath
 * @param {string} opts.sidebarHtml
 * @param {string} [opts.apiSpecUrl]
 */
export function renderPage({
  title,
  bodyHtml,
  kind,
  activeTab,
  activePath,
  sidebarHtml,
  apiSpecUrl,
}) {
  const pageTitle = title === 'API Guide' ? title : `${title} — API Guide`;
  const pageClass = kind === 'api' ? ' class="page-api"' : '';
  const apiBody =
    kind === 'api' && apiSpecUrl
      ? `<div class="api-reference-root">
           <div class="site-loading-shell" aria-live="polite" aria-busy="true">
             <div class="site-loading-body">
               <div class="site-loading-spinner" role="status"></div>
               <p class="site-loading-label">Loading API reference…</p>
             </div>
           </div>
           <script id="api-reference" type="application/json">${JSON.stringify({
             url: apiSpecUrl,
             theme: 'default',
             authentication: { preferredSecurityScheme: 'bearerAuth' },
           })}</script>
           <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" defer></script>
         </div>`
      : '';

  const mainContent =
    kind === 'api'
      ? apiBody
      : `<main class="page-content guide-content">${bodyHtml}</main>`;

  return `<!doctype html>
<html lang="en"${pageClass}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageTitle)}</title>
    ${LOADING_SHELL}
    <link rel="stylesheet" href="/assets/site.css" />
    <link rel="stylesheet" href="/custom.css" />
    ${FAVICON_HEAD}
    <script src="/assets/theme.js" defer></script>
    <script src="/assets/search.js" defer></script>
    ${kind === 'api' ? '<script src="/assets/api-reference.js" defer></script>' : ''}
  </head>
  <body${pageClass}>
    ${renderHeader(activeTab, activePath)}
    <div class="site-layout">
      <aside class="site-sidebar">${sidebarHtml}</aside>
      <div class="site-main">
        ${mainContent}
      </div>
    </div>
  </body>
</html>
`;
}

/** @param {'/' | '/api'} activeTab @param {string} activePath */
function renderHeader(activeTab, activePath) {
  return `<header class="site-header">
    <div class="site-header-left">
      <a class="site-brand" href="/" aria-label="API Guide home">
        <img class="site-brand-logo" src="/assets/enterprise-logo.svg" alt="" width="115" height="24" decoding="async" />
        <span class="site-brand-text">API Guide</span>
      </a>
      <nav class="site-tabs" aria-label="Documentation sections">
        <a class="site-tab${activeTab === '/' ? ' active' : ''}" href="/">Guides</a>
        <a class="site-tab${activeTab === '/api' ? ' active' : ''}" href="/api/">API Reference</a>
      </nav>
    </div>
    <div class="site-header-right">
      <button type="button" class="site-search-btn" data-search-open aria-label="Search documentation">Search…</button>
      <a class="site-github" href="https://github.com/thefuturebegins/enterprise-api-docs" target="_blank" rel="noopener">GitHub</a>
    </div>
  </header>`;
}

/** @param {import('./parse-routes.mjs').Route[]} routes @param {string} activePath @param {string} basePath */
export function renderSidebar(routes, activePath, basePath) {
  return routes
    .map((route) => {
      const href = route.path === '/' ? '/' : `${route.path}/`;
      const active = normalizePath(activePath) === normalizePath(route.path) ? ' active' : '';
      return `<a class="site-sidebar-link${active}" href="${href}">${escapeHtml(route.title)}</a>`;
    })
    .join('\n');
}

/** @param {string} s */
function normalizePath(s) {
  if (s === '/') return '/';
  return s.replace(/\/$/, '');
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { escapeHtml };
