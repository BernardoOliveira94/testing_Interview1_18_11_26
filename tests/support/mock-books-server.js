// =====================================================================================================
// tests/support/mock-books-server.js  -  a tiny FAKE Google Books API running on your own computer.
// =====================================================================================================
// WHY IT EXISTS: to prove that the test code works even when the real API is unreachable or over quota (429).
// IMPORTANT (say this if asked): it is a SIMULATION written from the documented behaviour. It does not replace
// running the tests against the real API.
// HOW IT WORKS: Node's built-in `http` module listens for requests and answers with JSON, like the real API.
// =====================================================================================================
const http = require('http');       // Node's built-in web-server library (nothing to install)

const VALID_KEY = 'mock-key';       // the only API key the fake server accepts
const TOTAL = 500;                  // pretend there are 500 books in total
const MAX_RESULTS = 40;             // same documented limit as the real API

// Helper: send a JSON answer with a status code (200, 400, 404...).
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=UTF-8' });
  res.end(JSON.stringify(body));    // JSON.stringify turns an object into JSON text
}
// Helper: send an error in the same format as Google ({ error: { code, message, errors } }).
const error = (res, code, message) => send(res, code, { error: { code, message, errors: [{ message, domain: 'global', reason: 'x' }] } });
// Helper: build one fake book. Example: volume(3) -> { id: 'vol-3', volumeInfo: { title: 'Book number 3' } }.
const volume = (i) => ({ kind: 'books#volume', id: `vol-${i}`, volumeInfo: { title: `Book number ${i}` } });

function createServer() {
  // This function runs once for every request that arrives.
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');   // split the address into path and query parameters
    const key = url.searchParams.get('key');            // value of ?key=... (null if absent)

    // A key was sent but it is not the valid one -> behave like Google does with a bad key.
    if (key !== null && key !== VALID_KEY) return error(res, 400, 'API key not valid. Please pass a valid API key.');

    // ---- Search: GET /books/v1/volumes?q=...
    if (url.pathname === '/books/v1/volumes') {
      const q = url.searchParams.get('q');
      if (!q) return error(res, 400, 'Missing query.');                    // q is mandatory
      const max = Number(url.searchParams.get('maxResults') || 10);       // default 10 results
      const start = Number(url.searchParams.get('startIndex') || 0);      // default first page
      if (max > MAX_RESULTS) return error(res, 400, 'Invalid value for maxResults.');
      if (q.startsWith('zzzqqq')) return send(res, 200, { kind: 'books#volumes', totalItems: 0 }); // nonsense word -> nothing
      // Build the list of fake books for the requested page.
      const items = Array.from({ length: Math.min(max, TOTAL - start) }, (_, n) => volume(start + n));
      return send(res, 200, { kind: 'books#volumes', totalItems: TOTAL, items });
    }

    // ---- One book: GET /books/v1/volumes/vol-7  (the regex matches ids like vol-<number>)
    const match = url.pathname.match(/^\/books\/v1\/volumes\/(vol-\d+)$/);
    if (match) return send(res, 200, { ...volume(Number(match[1].slice(4))), id: match[1] });
    // Any other id -> "not found"
    if (url.pathname.startsWith('/books/v1/volumes/')) return error(res, 404, 'The volume ID could not be found.');
    return error(res, 404, 'Not found');
  });
}

// Export so other files (run-with-mock.js) can start this server.
module.exports = { createServer, VALID_KEY };
