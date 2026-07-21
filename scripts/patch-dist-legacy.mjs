/**
 * Legacy dist patcher for the Scalar SPA build (Netlify rollback path).
 */

import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAVICON_HEAD } from './favicon-head.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ASSETS = join(ROOT, 'assets');

const LOADING_SHELL_STYLE = `
<style id="loading-shell">
  html { background: #fff; color-scheme: light dark; }
  @media (prefers-color-scheme: dark) { html { background: #111; } }
  body { margin: 0; }
  #app:empty::before {
    content: '';
    display: block;
    width: 28px; height: 28px; margin: 20vh auto 0;
    border: 3px solid #e5e7eb; border-top-color: #0f66d3;
    border-radius: 50%; animation: site-spin 0.8s linear infinite;
  }
  #app:empty::after {
    content: 'Loading documentation…';
    display: block; text-align: center; margin-top: 0.75rem;
    color: #6b7280; font: 0.875rem/1.4 Inter, system-ui, sans-serif;
  }
  @keyframes site-spin { to { transform: rotate(360deg); } }
</style>`;

const HEAD_INJECT = `
    ${LOADING_SHELL_STYLE}
    <link rel="stylesheet" href="/custom.css" />${FAVICON_HEAD}
    <script src="/title-prefix.js"></script>`;

function patchIndexHtml() {
  const indexPath = join(DIST, 'index.html');
  let html = readFileSync(indexPath, 'utf8');
  html = html.replace(/\n\s*<link rel="modulepreload"[^>]*>/g, '');
  html = html.replace(/\n\s*<link rel="stylesheet" href="\/custom\.css"[^>]*\/>/g, '');
  html = html.replace(/\n\s*<link rel="(?:icon|apple-touch-icon|manifest)"[^>]*\/>/g, '');
  html = html.replace(/\n\s*<meta name="theme-color"[^>]*\/>/g, '');
  html = html.replace(/\n\s*<script src="\/title-prefix\.js"><\/script>/g, '');
  html = html.replace(
    '<link\n      rel="preload"\n      href="https://fonts.scalar.com/inter-latin.woff2"',
    '<link rel="preload" href="/assets/inter-latin.woff2"',
  );
  if (!html.includes('loading-shell')) {
    html = html.replace('  </head>', `${HEAD_INJECT}\n  </head>`);
  }
  writeFileSync(indexPath, html);
}

function main() {
  mkdirSync(join(DIST, 'assets'), { recursive: true });
  for (const file of ['custom.css', 'inject-styles.js', 'spa-nav.js', 'title-prefix.js']) {
    copyFileSync(join(ASSETS, file), join(DIST, file));
  }
  cpSync(join(ASSETS, 'favicon'), join(DIST, 'favicon'), { recursive: true });
  patchIndexHtml();
  writeFileSync(
    join(DIST, '_redirects'),
    '/favicon.ico /favicon/favicon.svg 200\n/* /index.html 200\n',
  );
  console.log('[patch-dist-legacy] dist ready');
}

main();
