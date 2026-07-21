/**
 * Watches Scalar's generated index.html and re-applies custom patches
 * (stylesheet, favicon) every time Scalar rebuilds and resets it.
 *
 * Run alongside `npx @scalar/cli project preview`:
 *   node patch-preview.mjs
 */

import { watch, readFileSync, writeFileSync, copyFileSync, cpSync, existsSync, rmSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { FAVICON_HEAD } from './scripts/favicon-head.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const INDEX_HTML = join(homedir(), '.scalar/isolate/dist/build/index.html');
const BUILD_PUBLIC = join(homedir(), '.scalar/isolate/dist/build/public');

const INJECT = `
    <link rel="stylesheet" href="/custom.css" />${FAVICON_HEAD}
    <script src="/title-prefix.js"></script>`;

/** Copy project assets into the Scalar build's public directory */
function syncAssets() {
  const files = [
    ['assets/custom.css', 'custom.css'],
    ['assets/title-prefix.js', 'title-prefix.js'],
  ];
  for (const [src, dest] of files) {
    const srcPath = join(__dir, src);
    const destPath = join(BUILD_PUBLIC, dest);
    if (existsSync(srcPath)) copyFileSync(srcPath, destPath);
  }

  const faviconDest = join(BUILD_PUBLIC, 'favicon');
  rmSync(faviconDest, { recursive: true, force: true });
  cpSync(join(__dir, 'assets/favicon'), faviconDest, { recursive: true });
}

/** Inject our <link> tags into index.html if not already present */
function patch() {
  try {
    if (!existsSync(INDEX_HTML)) return;
    const html = readFileSync(INDEX_HTML, 'utf8');
    if (html.includes('/favicon/favicon.svg')) return;
    syncAssets();
    const patched = html.replace('  </head>', INJECT + '\n  </head>');
    writeFileSync(INDEX_HTML, patched);
    console.log('[patch] index.html patched ✓');
  } catch (e) {
    console.error('[patch] Error:', e.message);
  }
}

// Apply immediately on start
patch();

// Re-apply whenever Scalar rebuilds index.html
watch(INDEX_HTML, () => setTimeout(patch, 300));

console.log('[patch] Watching for Scalar rebuilds…');
