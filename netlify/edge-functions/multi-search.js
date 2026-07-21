/**
 * Production Typesense-compatible multi_search endpoint.
 *
 * Scalar's client is configured with `host: developers.enterprisecrm.com`,
 * so all search queries come here.  This function fetches the pre-built
 * search-entries.jsonl (generated at build time), runs a case-insensitive
 * regex search over title + content, and returns the results in the format
 * the Typesense client expects.
 */

const ENTRIES_URL = '/search-entries.jsonl';

let cachedEntries = null;

async function loadEntries(siteOrigin) {
  if (cachedEntries) return cachedEntries;
  const resp = await fetch(siteOrigin + ENTRIES_URL);
  if (!resp.ok) throw new Error(`Failed to load search index: ${resp.status}`);
  const text = await resp.text();
  cachedEntries = text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return cachedEntries;
}

function buildResult(entries, query, perPage = 10) {
  const q = (query || '').trim();
  let hits = [];
  let totalFound = 0;

  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    // Title matches rank higher than content-only matches
    const allMatches = entries.filter((e) => re.test(e.title || '') || re.test(e.content || ''));
    allMatches.sort((a, b) => {
      const aTitle = re.test(a.title || '') ? 1 : 0;
      const bTitle = re.test(b.title || '') ? 1 : 0;
      return bTitle - aTitle;
    });
    totalFound = allMatches.length;
    hits = allMatches
      .slice(0, perPage)
      .map((doc, i) => ({
        document: { ...doc, id: String(i) },
        highlight: {
          title: {
            matched_tokens: [q],
            snippet: doc.title || '',
          },
        },
        highlights: [],
        text_match: 57873008,
        text_match_info: {
          best_field_score: '1108074561536',
          best_field_weight: 15,
          fields_matched: 1,
          score: '578730089005449337',
          tokens_matched: 1,
        },
      }));
  }

  return {
    facet_counts: [],
    found: totalFound,
    out_of: entries.length,
    page: 1,
    request_params: {
      collection_name: 'enterprise-api',
      per_page: perPage,
      q,
    },
    search_cutoff: false,
    search_time_ms: 1,
    hits,
  };
}

export default async function handler(request, context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-typesense-api-key',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const origin = url.origin;

    // Parse the query: Typesense sends POST /multi_search?q=... with a JSON body,
    // or GET /multi_search?q=...
    let q = url.searchParams.get('q') || '';
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        const firstSearch = body?.searches?.[0];
        if (firstSearch?.q) q = firstSearch.q;
      } catch {
        // fallback to URL param
      }
    }

    const entries = await loadEntries(origin);
    const result = buildResult(entries, q);

    return new Response(
      JSON.stringify({ results: [result] }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
}

export const config = { path: '/multi_search' };
