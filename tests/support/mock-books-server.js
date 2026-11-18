// Local SIMULATION of the Google Books API (documented behaviour only), used to prove the test logic
// runs end to end when the real API is not reachable or its shared quota is exhausted (HTTP 429).
// It is NOT a replacement for running the tests against the real API.
const http = require('http');

const VALID_KEY = 'mock-key';
const TOTAL = 500;
const MAX_RESULTS = 40;

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(body));
}
const error = (res, code, message) => send(res, code, { error: { code, message, errors: [{ message, domain: 'global', reason: 'x' }] } });
const volume = (i) => ({ kind: 'books#volume', id: `vol-${i}`, volumeInfo: { title: `Book number ${i}` } });

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const key = url.searchParams.get('key');
    if (key !== null && key !== VALID_KEY) return error(res, 400, 'API key not valid. Please pass a valid API key.');

    if (url.pathname === '/books/v1/volumes') {
      const q = url.searchParams.get('q');
      if (!q) return error(res, 400, 'Missing query.');
      const max = Number(url.searchParams.get('maxResults') || 10);
      const start = Number(url.searchParams.get('startIndex') || 0);
      if (max > MAX_RESULTS) return error(res, 400, 'Invalid value for maxResults.');
      if (q.startsWith('zzzqqq')) return send(res, 200, { kind: 'books#volumes', totalItems: 0 });
      const items = Array.from({ length: Math.min(max, TOTAL - start) }, (_, n) => volume(start + n));
      return send(res, 200, { kind: 'books#volumes', totalItems: TOTAL, items });
    }

    const match = url.pathname.match(/^\/books\/v1\/volumes\/(vol-\d+)$/);
    if (match) return send(res, 200, { ...volume(Number(match[1].slice(4))), id: match[1] });
    if (url.pathname.startsWith('/books/v1/volumes/')) return error(res, 404, 'The volume ID could not be found.');
    return error(res, 404, 'Not found');
  });
}

module.exports = { createServer, VALID_KEY };
