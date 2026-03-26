/**
 * _template / index.js
 * ─────────────────────────────────────────────────────────────────
 * Multi-file provider entry point.
 *
 * Run `node build.js _template` to bundle this into
 * providers/template.js ready for the Nuvio app.
 * ─────────────────────────────────────────────────────────────────
 */

import { buildUrl } from './http.js';
import { extractStreams } from './extractor.js';

async function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[_template] Fetching', mediaType, tmdbId);

  try {
    const url = buildUrl(tmdbId, mediaType, season, episode);
    const streams = await extractStreams(url);
    return streams;
  } catch (err) {
    console.error('[_template] Error:', err.message);
    return [];
  }
}

module.exports = { getStreams };
