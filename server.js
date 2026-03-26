#!/usr/bin/env node
/**
 * server.js – Local development server for testing providers.
 *
 * Run:  npm start   (or  node server.js)
 *
 * Then in the Nuvio app:
 *   Settings → Developer → Plugin Tester
 *   Enter: http://<your-local-ip>:3000/manifest.json
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

// ── MIME types ─────────────────────────────────────────────────────
const MIME = {
  '.json': 'application/json',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.txt':  'text/plain',
};

function serveFile(res, filePath) {
  const ext  = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + filePath);
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  // Sanitise path to prevent directory traversal
  const urlPath = req.url.split('?')[0];
  const safe    = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT, safe);

  // Security: only serve files inside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  console.log(`[server] ${req.method} ${urlPath}`);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404); res.end('Not Found'); return;
  }

  serveFile(res, filePath);
});

server.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  let ip = 'localhost';
  Object.values(ifaces).flat().forEach(i => {
    if (i.family === 'IPv4' && !i.internal) ip = i.address;
  });

  console.log('\n🚀  Nuvio provider dev server running');
  console.log(`   Local:   http://localhost:${PORT}/manifest.json`);
  console.log(`   Network: http://${ip}:${PORT}/manifest.json`);
  console.log('\nUse the Network URL in the Nuvio app → Settings → Developer → Plugin Tester\n');
});
