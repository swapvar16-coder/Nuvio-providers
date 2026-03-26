/**
 * StreameX Provider (streamex.sh)
 * ─────────────────────────────────────────────────────────────────
 * StreameX is a free movie/TV/anime streaming site. It does not
 * expose TMDB IDs directly in its URLs; instead it uses its own
 * slug-based content system.
 *
 * This provider:
 *   1. Searches StreameX by TMDB ID via their search endpoint
 *   2. Resolves the internal slug/ID
 *   3. Hits the stream API to get playable source URLs
 *
 * Supported: Movies, TV Shows (with season/episode), Anime
 * ─────────────────────────────────────────────────────────────────
 */

var BASE = 'https://streamex.sh';

function buildHeaders(referer) {
  return {
    'Referer': referer || BASE + '/',
    'Origin': BASE,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest'
  };
}

/**
 * Search StreameX for a title matching the given TMDB ID.
 * Returns the internal ID/slug object, or null if not found.
 */
function findTitle(tmdbId, mediaType) {
  var searchUrl = BASE + '/api/search?tmdb_id=' + tmdbId + '&type=' + mediaType;

  return fetch(searchUrl, { headers: buildHeaders() })
    .then(function (res) {
      if (!res.ok) throw new Error('Search HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var results = data.results || data.data || (Array.isArray(data) ? data : []);
      if (!results.length) return null;

      // Prefer an exact TMDB ID match
      var match = null;
      for (var i = 0; i < results.length; i++) {
        if (String(results[i].tmdb_id) === String(tmdbId) ||
            String(results[i].tmdbId) === String(tmdbId)) {
          match = results[i];
          break;
        }
      }
      return match || results[0];
    })
    .catch(function (err) {
      console.error('[StreameX] findTitle error:', err.message);
      return null;
    });
}

/**
 * Fetch available stream sources for a StreameX content entry.
 */
function fetchSources(contentId, mediaType, season, episode) {
  var apiUrl;

  if (mediaType === 'tv') {
    apiUrl = BASE + '/api/stream/' + contentId
      + '?season=' + season + '&episode=' + episode;
  } else {
    apiUrl = BASE + '/api/stream/' + contentId;
  }

  return fetch(apiUrl, { headers: buildHeaders(BASE + '/' + mediaType + '/' + contentId) })
    .then(function (res) {
      if (!res.ok) throw new Error('Stream API HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var sources = data.sources || data.streams || data.links || [];
      return Array.isArray(sources) ? sources : [];
    })
    .catch(function (err) {
      console.error('[StreameX] fetchSources error:', err.message);
      return [];
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[StreameX] Fetching', mediaType, tmdbId);

  return findTitle(tmdbId, mediaType)
    .then(function (item) {
      if (!item) {
        console.warn('[StreameX] Title not found for TMDB ID:', tmdbId);
        return [];
      }

      var contentId = item.id || item.slug || item.content_id;
      if (!contentId) {
        console.warn('[StreameX] No usable ID on result:', JSON.stringify(item));
        return [];
      }

      return fetchSources(contentId, mediaType, season, episode);
    })
    .then(function (sources) {
      return sources
        .filter(function (s) { return s && s.url; })
        .map(function (s) {
          return {
            name: 'StreameX',
            title: (s.quality || s.label || s.server || 'Stream') + ' · StreameX',
            url: s.url,
            quality: s.quality || s.label || 'Unknown',
            size: s.size || '',
            headers: buildHeaders(BASE + '/')
          };
        });
    })
    .catch(function (err) {
      console.error('[StreameX] Error:', err.message);
      return [];
    });
}

module.exports = { getStreams };
