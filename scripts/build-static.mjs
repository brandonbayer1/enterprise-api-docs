/**
 * Static production build for developers.enterprisecrm.com
 *
 * Guides are pre-rendered HTML (instant first paint).
 * API Reference pages lazy-load the Scalar API Reference widget per module.
 */

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { parseScalarRoutes, routeToOutFile } from './lib/parse-routes.mjs';
import { renderPage, renderSidebar, escapeHtml } from './lib/render.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ASSETS = join(ROOT, 'assets');

marked.setOptions({ gfm: true, breaks: false });

function main() {
  console.log('[build-static] Starting static build…');
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });

  const { guides, api } = parseScalarRoutes();

  copyStaticAssets();
  copyOpenApiSpecs();
  buildGuidePages(guides);
  buildApiPages(api);
  buildApiIndex(api);
  buildSearchIndex(guides, api);
  writeRedirects();

  console.log('[build-static] Done → dist/');
}

function copyStaticAssets() {
  cpSync(join(ASSETS, 'favicon'), join(DIST, 'favicon'), { recursive: true });
  for (const file of ['custom.css', 'site.css', 'theme.js', 'search.js', 'api-reference.js']) {
    cpSync(join(ASSETS, file), join(DIST, 'assets', file));
  }
}

function copyOpenApiSpecs() {
  const srcDir = join(ROOT, 'docs/api-reference');
  const destDir = join(DIST, 'docs/api-reference');
  mkdirSync(destDir, { recursive: true });
  for (const file of readdirSync(srcDir)) {
    if (file.endsWith('.json')) {
      cpSync(join(srcDir, file), join(destDir, file));
    }
  }
}

/** @param {import('./lib/parse-routes.mjs').Route[]} guides */
function buildGuidePages(guides) {
  const sidebar = renderSidebar(guides, '', '/');
  for (const route of guides) {
    const mdPath = join(ROOT, route.filepath);
    const md = readFileSync(mdPath, 'utf8');
    const bodyHtml = marked.parse(md);
    const html = renderPage({
      title: route.title,
      bodyHtml,
      kind: 'guide',
      activeTab: '/',
      activePath: route.path,
      sidebarHtml: sidebar,
    });
    writeDistHtml(routeToOutFile(route.path), html);
  }
}

/** @param {import('./lib/parse-routes.mjs').Route[]} apiRoutes */
function buildApiPages(apiRoutes) {
  const sidebar = renderSidebar(apiRoutes, '', '/api');
  for (const route of apiRoutes) {
    const specUrl = `/${route.filepath}`;
    const html = renderPage({
      title: route.title,
      bodyHtml: '',
      kind: 'api',
      activeTab: '/api',
      activePath: route.path,
      sidebarHtml: sidebar,
      apiSpecUrl: specUrl,
    });
    writeDistHtml(routeToOutFile(route.path), html);
  }
}

/** @param {import('./lib/parse-routes.mjs').Route[]} apiRoutes */
function buildApiIndex(apiRoutes) {
  const sidebar = renderSidebar(apiRoutes, '/api', '/api');
  const links = apiRoutes
    .map(
      (r) =>
        `<li><a href="${r.path}/">${escapeHtml(r.title)}</a></li>`,
    )
    .join('\n');
  const bodyHtml = `<h1>API Reference</h1>
<p>Select a module to explore its endpoints interactively.</p>
<ul class="api-module-list">${links}</ul>`;
  const html = renderPage({
    title: 'API Reference',
    bodyHtml,
    kind: 'api-index',
    activeTab: '/api',
    activePath: '/api',
    sidebarHtml: sidebar,
  });
  writeDistHtml('api/index.html', html);
}

/** @param {import('./lib/parse-routes.mjs').Route[]} guides @param {import('./lib/parse-routes.mjs').Route[]} apiRoutes */
function buildSearchIndex(guides, apiRoutes) {
  /** @type {{ title: string, url: string, content: string }[]} */
  const entries = [];

  for (const route of guides) {
    const md = readFileSync(join(ROOT, route.filepath), 'utf8');
    const plain = md.replace(/^#+\s+/gm, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    entries.push({
      title: route.title,
      url: route.path === '/' ? '/' : `${route.path}/`,
      content: plain.slice(0, 500),
    });
  }

  for (const route of apiRoutes) {
    entries.push({
      title: `${route.title} API`,
      url: `${route.path}/`,
      content: `OpenAPI reference for the ${route.title} module.`,
    });
  }

  writeFileSync(join(DIST, 'search-index.json'), JSON.stringify(entries));
}

function writeRedirects() {
  writeFileSync(
    join(DIST, '_redirects'),
    '/favicon.ico /favicon/favicon.svg 200\n',
  );
}

/** @param {string} relativePath @param {string} html */
function writeDistHtml(relativePath, html) {
  const outPath = join(DIST, relativePath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

main();
