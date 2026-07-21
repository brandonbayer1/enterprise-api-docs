import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** @typedef {{ path: string, title: string, filepath?: string, type: 'page' | 'openapi' }} Route */

/**
 * @param {string} configPath
 * @returns {{ guides: Route[], api: Route[], tabs: { title: string, path: string }[] }}
 */
export function parseScalarRoutes(configPath = join(ROOT, 'scalar.config.json')) {
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const routes = config.navigation?.routes ?? {};
  const tabs = config.navigation?.tabs ?? [];

  /** @type {Route[]} */
  const guides = [];
  /** @type {Route[]} */
  const api = [];

  for (const [groupPath, group] of Object.entries(routes)) {
    if (group.type !== 'group' || !group.children) continue;
    const target = groupPath === '/api' ? api : guides;
    for (const [childPath, child] of Object.entries(group.children)) {
      if (child.type === 'page') {
        target.push({
          path: joinPaths(groupPath, childPath),
          title: child.title,
          filepath: child.filepath,
          type: 'page',
        });
      } else if (child.type === 'openapi') {
        target.push({
          path: joinPaths(groupPath, childPath),
          title: child.title,
          filepath: child.filepath,
          type: 'openapi',
        });
      }
    }
  }

  return { guides, api, tabs };
}

/** @param {string} base @param {string} segment */
function joinPaths(base, segment) {
  if (segment === '/') return base === '/' ? '/' : base;
  const b = base === '/' ? '' : base;
  return `${b}${segment}`;
}

export function routeToOutFile(routePath) {
  if (routePath === '/') return 'index.html';
  const trimmed = routePath.replace(/^\//, '');
  return join(trimmed, 'index.html');
}
