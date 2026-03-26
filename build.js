#!/usr/bin/env node
/**
 * build.js
 * ─────────────────────────────────────────────────────────────────
 * Build script for nuvio-providers.
 *
 * Usage:
 *   node build.js                     # Build all src/ providers
 *   node build.js vidsrcto            # Build one specific provider
 *   node build.js vidsrcto superstream # Build multiple providers
 *   node build.js --transpile         # Transpile all providers/ files
 *   node build.js --transpile myprovider.js  # Transpile one file
 *   npm run build:watch               # Watch mode (rebuilds on change)
 * ─────────────────────────────────────────────────────────────────
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SRC_DIR       = path.join(__dirname, 'src');
const PROVIDERS_DIR = path.join(__dirname, 'providers');

// ── Helpers ────────────────────────────────────────────────────────

function log(msg)  { console.log('[build]', msg); }
function err(msg)  { console.error('[build] ERROR:', msg); }

function ensureProviderDir() {
  if (!fs.existsSync(PROVIDERS_DIR)) fs.mkdirSync(PROVIDERS_DIR);
}

// ── Bundle a src/<name>/ folder into providers/<name>.js ───────────

function bundleProvider(name) {
  const srcFolder = path.join(SRC_DIR, name);
  const entry     = path.join(srcFolder, 'index.js');
  const out       = path.join(PROVIDERS_DIR, name + '.js');

  if (!fs.existsSync(entry)) {
    err(`No entry found at ${entry}`);
    return false;
  }

  log(`Bundling: src/${name}/ → providers/${name}.js`);

  try {
    // Use esbuild if available, otherwise fall back to a simple concat.
    execSync(
      `npx esbuild "${entry}" --bundle --platform=node --target=es6 ` +
      `--outfile="${out}" --external:axios --external:crypto-js ` +
      `--external:cheerio-without-node-native`,
      { stdio: 'inherit' }
    );
    log(`Done: providers/${name}.js`);
    return true;
  } catch (e) {
    err(`esbuild failed for ${name}: ${e.message}`);
    return false;
  }
}

// ── Transpile a providers/*.js file for Hermes compatibility ───────
// (converts async/await to Promise chains via Babel)

function transpileFile(filename) {
  const target = path.join(PROVIDERS_DIR, filename);
  if (!fs.existsSync(target)) {
    err(`File not found: providers/${filename}`);
    return false;
  }

  log(`Transpiling providers/${filename}`);
  try {
    execSync(
      `npx babel "${target}" --presets @babel/preset-env ` +
      `--plugins @babel/plugin-transform-async-to-generator ` +
      `--out-file "${target}"`,
      { stdio: 'inherit' }
    );
    log(`Transpiled: providers/${filename}`);
    return true;
  } catch (e) {
    err(`Babel failed for ${filename}: ${e.message}`);
    return false;
  }
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
  ensureProviderDir();
  const args = process.argv.slice(2);

  // --transpile mode
  if (args[0] === '--transpile') {
    const targets = args.slice(1);
    if (targets.length === 0) {
      // Transpile all providers
      fs.readdirSync(PROVIDERS_DIR)
        .filter(f => f.endsWith('.js'))
        .forEach(f => transpileFile(f));
    } else {
      targets.forEach(f => transpileFile(f.endsWith('.js') ? f : f + '.js'));
    }
    return;
  }

  // Build mode
  const names = args.length
    ? args
    : fs.readdirSync(SRC_DIR).filter(n => {
        return fs.statSync(path.join(SRC_DIR, n)).isDirectory();
      });

  if (names.length === 0) {
    log('No providers found in src/. Nothing to build.');
    return;
  }

  let ok = 0, fail = 0;
  names.forEach(n => { bundleProvider(n) ? ok++ : fail++; });
  log(`Build complete: ${ok} succeeded, ${fail} failed.`);
}

main();
