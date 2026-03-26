/**
 * Template Provider
 * ─────────────────────────────────────────────────────────────────
 * Copy this file to providers/<yourprovider>.js and customise it.
 *
 * getStreams() is called by the Nuvio app with:
 *   @param {string} tmdbId    - The TMDB ID of the title
 *   @param {string} mediaType - "movie" or "tv"
 *   @param {number} season    - Season number (TV only, else null)
 *   @param {number} episode   - Episode number (TV only, else null)
 *
 * Must return a Promise that resolves to an array of stream objects.
 *
 * Stream object shape:
 * {
 *   name:    string,   // Provider label shown in the app
 *   title:   string,   // Stream description (quality, size, etc.)
 *   url:     string,   // Direct playable URL (.m3u8, .mp4, .mkv …)
 *   quality: string,   // e.g. "1080p", "720p"
 *   size:    string,   // Optional – e.g. "2.1 GB"
 *   headers: object    // Optional – extra headers for the player
 * }
 * ─────────────────────────────────────────────────────────────────
 */

function getStreams(tmdbId, mediaType, season, episode) {
  console.log('[Template] Fetching', mediaType, tmdbId, season, episode);

  // Build the request URL for your target website.
  // Replace this with the real API / page endpoint.
  var url = mediaType === 'tv'
    ? 'https://api.example.com/tv/' + tmdbId + '/' + season + '/' + episode
    : 'https://api.example.com/movie/' + tmdbId;

  return fetch(url)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      // Map the site's response to Nuvio stream objects.
      return (data.streams || []).map(function (s) {
        return {
          name: 'Template',
          title: s.quality + ' – ' + (s.size || ''),
          url: s.url,
          quality: s.quality,
          headers: {
            'Referer': 'https://example.com/',
            'User-Agent': 'Mozilla/5.0'
          }
        };
      });
    })
    .catch(function (err) {
      console.error('[Template] Error:', err.message);
      return [];
    });
}

module.exports = { getStreams };
