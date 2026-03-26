/**
 * VidSrc.to Provider
 * Fetches stream sources from vidsrc.to using their embed API.
 *
 * VidSrc.to exposes an embed URL of the form:
 *   https://vidsrc.to/embed/movie/<tmdbId>
 *   https://vidsrc.to/embed/tv/<tmdbId>/<season>/<episode>
 *
 * This provider scrapes the sources list from their API endpoint
 * and returns playable stream URLs to the Nuvio app.
 */

var BASE = 'https://vidsrc.to';
var API  = 'https://vidsrc.to/embed';

/**
 * Resolve an individual source item to a playable URL.
 * VidSrc wraps each source in a light obfuscation layer –
 * we hit their /ajax/embed/source/<hash> endpoint to decode it.
 */
function resolveSource(hash) {
  return fetch(BASE + '/ajax/embed/source/' + hash, {
    headers: { 'Referer': BASE + '/', 'X-Requested-With': 'XMLHttpRequest' }
  })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var url = data && data.result && data.result.url;
      return url || null;
    })
    .catch(function () { return null; });
}

/**
 * Fetch the list of available sources for a given embed URL.
 */
function fetchSources(embedPath) {
  // 1. Hit the embed page to grab the data-id attribute
  return fetch(API + embedPath, {
    headers: {
      'Referer': BASE + '/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  })
    .then(function (r) { return r.text(); })
    .then(function (html) {
      // Extract the media ID used by their AJAX source endpoint
      var match = html.match(/data-id="([^"]+)"/);
      if (!match) return [];
      var mediaId = match[1];

      return fetch(BASE + '/ajax/embed/episode/' + mediaId + '/sources', {
        headers: { 'Referer': BASE + '/', 'X-Requested-With': 'XMLHttpRequest' }
      });
    })
    .then(function (r) {
      if (!r || typeof r.json !== 'function') return [];
      return r.json();
    })
    .then(function (data) {
      if (!data || !data.result) return [];
      return data.result; // array of { title, hash }
    })
    .catch(function (err) {
      console.error('[VidSrc.to] fetchSources error:', err.message);
      return [];
    });
}

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[VidSrc.to] Fetching', mediaType, tmdbId);

  var embedPath = mediaType === 'tv'
    ? '/tv/' + tmdbId + '/' + season + '/' + episode
    : '/movie/' + tmdbId;

  return fetchSources(embedPath)
    .then(function (sources) {
      if (!sources.length) return [];

      // Resolve each source hash to a real URL in parallel
      return Promise.all(
        sources.map(function (src) {
          return resolveSource(src.hash).then(function (url) {
            if (!url) return null;
            return {
              name: 'VidSrc.to',
              title: (src.title || 'Stream') + ' · VidSrc',
              url: url,
              quality: src.title || 'Unknown',
              headers: {
                'Referer': BASE + '/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
              }
            };
          });
        })
      );
    })
    .then(function (streams) {
      return streams.filter(Boolean);
    })
    .catch(function (err) {
      console.error('[VidSrc.to] Error:', err.message);
      return [];
    });
}

module.exports = { getStreams };
