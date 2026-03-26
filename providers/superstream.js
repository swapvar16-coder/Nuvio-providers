/**
 * SuperStream Provider
 * Fetches stream sources from superstream (streamed.su / similar mirrors).
 *
 * The provider uses the public /api/search and /api/stream endpoints
 * to locate a title by TMDB ID and return direct video URLs.
 */

var BASE_URL = 'https://streamed.su';

function buildHeaders() {
  return {
    'Referer': BASE_URL + '/',
    'Origin': BASE_URL,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  };
}

/**
 * Search for a title by TMDB ID.
 * Returns the internal ID used by the site, or null if not found.
 */
function findTitleId(tmdbId, mediaType) {
  var endpoint = BASE_URL + '/api/search?tmdb=' + tmdbId + '&type=' + mediaType;

  return fetch(endpoint, { headers: buildHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.id) return null;
      return data.id;
    })
    .catch(function (err) {
      console.error('[SuperStream] findTitleId error:', err.message);
      return null;
    });
}

/**
 * Fetch stream sources for a title.
 */
function fetchStreamSources(titleId, mediaType, season, episode) {
  var endpoint;

  if (mediaType === 'tv') {
    endpoint = BASE_URL + '/api/stream/tv/' + titleId + '/' + season + '/' + episode;
  } else {
    endpoint = BASE_URL + '/api/stream/movie/' + titleId;
  }

  return fetch(endpoint, { headers: buildHeaders() })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || !data.streams) return [];
      return data.streams;
    })
    .catch(function (err) {
      console.error('[SuperStream] fetchStreamSources error:', err.message);
      return [];
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[SuperStream] Fetching', mediaType, tmdbId);

  return findTitleId(tmdbId, mediaType)
    .then(function (titleId) {
      if (!titleId) {
        console.warn('[SuperStream] Title not found for TMDB ID:', tmdbId);
        return [];
      }
      return fetchStreamSources(titleId, mediaType, season, episode);
    })
    .then(function (sources) {
      return sources
        .filter(function (s) { return s && s.url; })
        .map(function (s) {
          return {
            name: 'SuperStream',
            title: (s.quality || 'Stream') + ' · SuperStream' + (s.size ? ' · ' + s.size : ''),
            url: s.url,
            quality: s.quality || 'Unknown',
            size: s.size || '',
            headers: buildHeaders()
          };
        });
    })
    .catch(function (err) {
      console.error('[SuperStream] Error:', err.message);
      return [];
    });
}

module.exports = { getStreams };
