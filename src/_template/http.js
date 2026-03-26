/**
 * http.js – URL builder helpers for _template provider.
 * Replace BASE_URL and the path logic with your target site.
 */

const BASE_URL = 'https://api.example.com';

export function buildUrl(tmdbId, mediaType, season, episode) {
  if (mediaType === 'tv') {
    return `${BASE_URL}/tv/${tmdbId}/${season}/${episode}`;
  }
  return `${BASE_URL}/movie/${tmdbId}`;
}

export async function httpGet(url, headers = {}) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': BASE_URL + '/',
      ...headers
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}
