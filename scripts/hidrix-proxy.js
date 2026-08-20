#!/usr/bin/env node
/**
 * Proxy local Hidrix: PWA (:8200) + API (:5080) en un solo puerto.
 * - /api/*  y /health  -> API
 * - resto              -> PWA
 */
const http = require('http');

const LISTEN = Number(process.env.PROXY_PORT || 8300);
const API = process.env.API_ORIGIN || 'http://127.0.0.1:5080';
const PWA = process.env.PWA_ORIGIN || 'http://127.0.0.1:8200';

function forward(req, res, target) {
  const url = new URL(req.url, target);
  const headers = { ...req.headers, host: url.host };
  const opts = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: req.method,
    headers,
  };

  const upstream = http.request(opts, (up) => {
    res.writeHead(up.statusCode || 502, up.headers);
    up.pipe(res);
  });

  upstream.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Bad gateway: ${err.message}`);
  });

  req.pipe(upstream);
}

const server = http.createServer((req, res) => {
  const path = req.url || '/';
  const toApi =
    path === '/health' ||
    path.startsWith('/health?') ||
    path.startsWith('/api/') ||
    path.startsWith('/swagger');
  forward(req, res, toApi ? API : PWA);
});

server.listen(LISTEN, '0.0.0.0', () => {
  console.log(`Hidrix proxy :${LISTEN}  PWA=${PWA}  API=${API}`);
});
