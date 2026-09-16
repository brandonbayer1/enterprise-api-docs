/**
 * Smoke-test the static dist/ output before deploy.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = process.env.VALIDATE_BASE_URL || 'http://127.0.0.1:4173';

const paths = [
  '/',
  '/getting-started/',
  '/authentication/',
  '/api/',
  '/api/sales/',
  '/favicon/favicon.svg',
  '/search-index.json',
  '/docs/api-reference/sales.json',
];

function assertDistExists() {
  for (const file of ['index.html', 'api/index.html', 'api/sales/index.html', 'search-index.json']) {
    const p = join(DIST, file);
    if (!existsSync(p)) throw new Error(`Missing dist/${file}`);
  }
}

function startServer() {
  if (process.env.VALIDATE_BASE_URL) return null;
  const proc = spawnSync('npx', ['--yes', 'serve', DIST, '-l', '4173'], {
    stdio: 'ignore',
    detached: true,
  });
  if (proc.error) throw proc.error;
  // detached serve continues in background; give it a moment
  spawnSync('sleep', ['2']);
  return proc;
}

async function checkPaths() {
  let failed = 0;
  for (const path of paths) {
    const url = `${BASE}${path}`;
    try {
      const resp = await fetch(url);
      const ok = resp.status >= 200 && resp.status < 400;
      console.log(`${ok ? '✓' : '✗'} ${resp.status} ${path}`);
      if (!ok) failed += 1;
      if (path.endsWith('.json') && ok) {
        JSON.parse(await resp.text());
      }
      if (path === '/' && ok) {
        const html = await resp.text();
        if (!html.includes('API Guide') || !html.includes('page-content')) {
          console.log('✗ / missing expected guide markup');
          failed += 1;
        }
      }
    } catch (error) {
      console.log(`✗ ${path} ${error.message}`);
      failed += 1;
    }
  }
  if (failed) process.exit(1);
}

assertDistExists();
await checkPaths();
console.log('[validate-dist] All checks passed');
