/**
 * HDEpic Provider (hdepic.xyz)
 * ─────────────────────────────────────────────────────────────────
 * HDEpic is a movie/TV streaming site that uses its own internal
 * content IDs. This provider:
 *   1. Searches for a title via TMDB ID using HDEpic's search API
 *   2. Resolves the internal content ID
 *   3. Fetches stream sources from the watch endpoint
 *
 * Supported: Movies, TV Shows (with season/episode)
 * ─────────────────────────────────────────────────────────────────
 */

var BASE = 'https://hdepic.xyz';

function buildHeaders(referer) {
  return {
    'Referer': referer || BASE + '/',
    'Origin': BASE,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9'
  };
}

/**
 * Search HDEpic for a title by TMDB ID.
 * Returns the first matching internal content object, or null.
 */
function searchTitle(tmdbId, mediaType) {
  var searchUrl = BASE + '/api/search?tmdb=' + tmdbId + '&type=' + mediaType;

  return fetch(searchUrl, { headers: buildHeaders() })
    .then(function (res) {
      if (!res.ok) throw new Error('Search HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      // Response may be { results: [...] } or a direct array
      var results = Array.isArray(data) ? data : (data.results || data.data || []);
      if (!results.length) return null;
      return results[0]; // take the best match
    })
    .catch(function (err) {
      console.error('[HDEpic] searchTitle error:', err.message);
      return null;
    });
}

/**
 * Fetch stream sources for a given HDEpic content ID.
 * For TV shows, season and episode are appended as query params.
 */
function fetchStreams(contentId, mediaType, season, episode) {
  var streamUrl;

  if (mediaType === 'tv') {
    streamUrl = BASE + '/api/stream/' + contentId
      + '?season=' + season + '&episode=' + episode;
  } else {
    streamUrl = BASE + '/api/stream/' + contentId;
  }

  return fetch(streamUrl, { headers: buildHeaders(BASE + '/watch/' + contentId) })
    .then(function (res) {
      if (!res.ok) throw new Error('Stream HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      // Normalise: data may be { sources: [...] } or a flat array
      var sources = data.sources || data.streams || data.links || [];
      if (!Array.isArray(sources)) sources = [];
      return sources;
    })
    .catch(function (err) {
      console.error('[HDEpic] fetchStreams error:', err.message);
      return [];
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[HDEpic] Fetching', mediaType, tmdbId);

  return searchTitle(tmdbId, mediaType)
    .then(function (item) {
      if (!item || !item.id) {
        console.warn('[HDEpic] No match found for TMDB ID:', tmdbId);
        return [];
      }

      return fetchStreams(item.id, mediaType, season, episode);
    })
    .then(function (sources) {
      return sources
        .filter(function (s) { return s && s.url; })
        .map(function (s) {
          return {
            name: 'HDEpic',
            title: (s.quality || s.label || 'Stream') + ' · HDEpic',
            url: s.url,
            quality: s.quality || s.label || 'Unknown',
            size: s.size || '',
            headers: buildHeaders(BASE + '/')
          };
        });
    })
    .catch(function (err) {
      console.error('[HDEpic] Error:', err.message);
      return [];
    });
}

module.exports = { getStreams };
