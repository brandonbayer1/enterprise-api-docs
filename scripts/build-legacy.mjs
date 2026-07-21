/**
 * Legacy Scalar Docs SPA production build (pre-static architecture).
 * Produces ~29k JS chunks — kept for rollback only.
 */

import { cpSync, copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const ISOLATE = join(homedir(), '.scalar/isolate');
const BUILD_DIR = join(ISOLATE, 'dist/build');
const OVERRIDE = join(ISOLATE, 'vite.build.override.mjs');

function ensureScalarBuildDir() {
  if (!existsSync(BUILD_DIR)) {
    console.error(
      '[build-legacy] Missing Scalar build dir. Run `npm run preview` once, wait for it to finish compiling, then retry.',
    );
    process.exit(1);
  }
}

function patchDetailsJson() {
  const detailsPath = join(BUILD_DIR, 'src/details.json');
  if (!existsSync(detailsPath)) return;
  const details = JSON.parse(readFileSync(detailsPath, 'utf8'));
  details.mode = 'production';
  details.typesenseConfig = {
    host: 'developers.enterprisecrm.com',
    collectionName: 'enterprise-api',
    keyValue: 'public',
    protocol: 'https',
    keyId: 0,
    port: 443,
  };
  writeFileSync(detailsPath, JSON.stringify(details));
}

function runViteBuild() {
  if (!existsSync(OVERRIDE)) {
    console.error('[build-legacy] Missing vite.build.override.mjs in Scalar isolate.');
    process.exit(1);
  }
  const result = spawnSync(
    process.execPath,
    [
      join(ISOLATE, 'node_modules/vite/bin/vite.js'),
      'build',
      'dist/build',
      '--config',
      OVERRIDE,
    ],
    {
      cwd: ISOLATE,
      env: { ...process.env, VITE_OUT_DIR: DIST },
      stdio: 'inherit',
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function copySearchIndex() {
  const src = join(BUILD_DIR, 'search-entries.jsonl');
  if (existsSync(src)) copyFileSync(src, join(DIST, 'search-entries.jsonl'));
}

function main() {
  console.log('[build-legacy] Building legacy Scalar SPA…');
  ensureScalarBuildDir();
  patchDetailsJson();
  runViteBuild();
  copySearchIndex();
  spawnSync(process.execPath, ['scripts/patch-dist-legacy.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log('[build-legacy] Done → dist/');
}

main();
