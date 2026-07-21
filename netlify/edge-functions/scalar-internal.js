/**
 * Handles all /_scalar/* internal endpoints in production.
 *
 * In the Scalar preview server these endpoints serve live data (health status,
 * search config, WebSocket upgrades, etc.).  In production they don't exist,
 * but Netlify's `_redirects` catch-all would serve index.html (text/html) for
 * any unknown path.  Scalar's client code then tries to JSON-parse that HTML
 * and throws a SyntaxError.
 *
 * Endpoint-specific strategy:
 *  /_scalar/health       → 404  (tells Scalar it is NOT in preview mode,
 *                                 preventing a WebSocket connection attempt)
 *  /_scalar/search-config → 200 {} (returning 200 suppresses the browser's
 *                                 native "Failed to load resource: 404" console
 *                                 error; an empty object tells Scalar search
 *                                 is not configured so it disables the UI)
 *  everything else       → 404 JSON
 */
export default async function handler(request) {
  const url = new URL(request.url);

  // OPTIONS pre-flight (search uses CORS)
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-typesense-api-key',
      },
    });
  }

  // Return 200 empty config so Scalar gracefully disables search without
  // the browser logging a "Failed to load resource: 404" console error.
  if (url.pathname === '/_scalar/search-config') {
    return new Response('{}', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // All other /_scalar/* → 404 so Scalar knows it is NOT in preview mode.
  return new Response(
    JSON.stringify({ error: 'Not available in production', path: url.pathname }),
    {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}

export const config = { path: '/_scalar/*' };
