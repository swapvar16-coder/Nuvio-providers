# Nuvio Providers

A collection of streaming providers for the [Nuvio Android TV app](https://github.com/NuvioMedia/NuvioTV).  
Providers are JavaScript modules that discover and fetch stream URLs from various video websites.

---

## Quick Start

### Add to Nuvio App

1. Open **Nuvio** → **Settings** → **Plugins**
2. Add this repository URL:
   ```
   https://raw.githubusercontent.com/<your-username>/nuvio-providers/main/manifest.json
   ```
3. Refresh and enable the providers you want.

### Test Locally

```bash
npm install
npm start
```

Then in the Nuvio app go to **Settings → Developer → Plugin Tester** and enter:
```
http://<your-local-ip>:3000/manifest.json
```

> ⚠️ You must use the **development build** of Nuvio (`npx expo run:android` or `npx expo run:ios`) for local testing.

---

## Included Providers

| Provider | Types | Status |
|---|---|---|
| VidSrc.to | Movie, TV | ✅ Enabled |
| SuperStream | Movie, TV | ✅ Enabled |
| HDEpic | Movie, TV | ✅ Enabled |
| CineHD | Movie, TV | ✅ Enabled |
| StreameX | Movie, TV | ✅ Enabled |
| Template | Movie, TV | 🚫 Disabled (starter) |

---

## Project Structure

```
nuvio-providers/
├── providers/          # Ready-to-use bundled JS files (loaded by app)
│   ├── vidsrcto.js
│   ├── superstream.js
│   └── template.js
│
├── src/                # Multi-file source providers (build with build.js)
│   └── _template/
│       ├── index.js    # Entry point
│       ├── http.js     # HTTP helpers
│       └── extractor.js
│
├── manifest.json       # Provider registry
├── build.js            # Build & transpile script
├── server.js           # Local dev server
└── package.json
```

---

## Creating a Provider

### Option 1 – Single File (Simple)

Create `providers/myprovider.js` using Promise chains (required for Hermes JS engine):

```js
function getStreams(tmdbId, mediaType, season, episode) {
  var url = mediaType === 'tv'
    ? 'https://example.com/tv/' + tmdbId + '/' + season + '/' + episode
    : 'https://example.com/movie/' + tmdbId;

  return fetch(url)
    .then(function(res) { return res.json(); })
    .then(function(data) {
      return (data.streams || []).map(function(s) {
        return {
          name: 'MyProvider',
          title: s.quality,
          url: s.url,
          quality: s.quality,
          headers: { 'Referer': 'https://example.com/' }
        };
      });
    })
    .catch(function(err) {
      console.error('[MyProvider]', err.message);
      return [];
    });
}

module.exports = { getStreams };
```

Then register it in `manifest.json`:

```json
{
  "id": "myprovider",
  "name": "My Provider",
  "filename": "providers/myprovider.js",
  "supportedTypes": ["movie", "tv"],
  "enabled": true
}
```

### Option 2 – Multi-File (Recommended for complex providers)

1. Create `src/myprovider/index.js` (async/await is fully supported here).
2. Add helper files like `http.js`, `extractor.js`.
3. Build: `node build.js myprovider`

This generates `providers/myprovider.js` with async/await transpiled automatically.

---

## Building

```bash
# Build all src/ providers
node build.js

# Build a specific provider
node build.js vidsrcto

# Transpile a single-file provider for Hermes compatibility
node build.js --transpile myprovider.js

# Watch mode (auto-rebuilds on file changes)
npm run build:watch
```

---

## Stream Object Format

`getStreams()` must return a Promise resolving to an array of:

```js
{
  name:    "Provider Name",     // shown in app
  title:   "1080p · 2.1 GB",   // stream description
  url:     "https://...",       // direct .m3u8 / .mp4 / .mkv URL
  quality: "1080p",
  size:    "2.1 GB",            // optional
  headers: {                    // optional playback headers
    "Referer": "https://source.com",
    "User-Agent": "Mozilla/5.0..."
  }
}
```

---

## Available Modules

Inside provider code you can `require()`:

| Module | Purpose |
|---|---|
| `axios` | HTTP requests |
| `crypto-js` | Encryption / decryption |
| `cheerio-without-node-native` | HTML parsing |

Native `fetch` and `console` are also available globally.

---

## Manifest Fields

| Field | Required | Description |
|---|---|---|
| `id` | ✅ | Unique identifier |
| `name` | ✅ | Display name |
| `filename` | ✅ | Relative path to JS file |
| `supportedTypes` | ✅ | `["movie"]`, `["tv"]`, or both |
| `enabled` | ✅ | Whether enabled by default |
| `version` | | Semver string |
| `author` | | Author name |
| `description` | | Short description |
| `logo` | | URL to provider logo |
| `contentLanguage` | | Array of language codes |
| `formats` | | `["mp4", "mkv", "m3u8"]` |
| `limited` | | Marks provider as limited |
| `disabledPlatforms` | | `["ios"]` etc. |
| `supportsExternalPlayer` | | Boolean |

---

## Contributing

1. Fork this repository
2. Create a branch: `git checkout -b add-myprovider`
3. Develop and test your provider
4. Build: `node build.js myprovider`
5. Add an entry to `manifest.json`
6. Commit: `git commit -m "Add MyProvider"`
7. Open a Pull Request

---

## License

[GPL-3.0](./LICENSE)

---

## Disclaimer

This repository does not host, store, or distribute any media content.  
Providers interface with publicly accessible third-party websites.  
Users are solely responsible for ensuring compliance with their local laws.  
For DMCA concerns please contact the content hosts directly.
