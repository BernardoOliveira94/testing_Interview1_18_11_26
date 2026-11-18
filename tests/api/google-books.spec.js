// =====================================================================================================
// tests/api/google-books.spec.js  -  EXERCISE 3: automated tests for the Google Books REST API
// =====================================================================================================
// WHAT IS TESTED: the endpoint GET /volumes (search books) and GET /volumes/{id} (get one book).
// HOW: Playwright's built-in HTTP client (`request`) sends the calls and `expect` checks the answers.
//      No browser is opened, so these tests are fast.
// HOW TO EXPLAIN IT IN ONE SENTENCE:
//      "Each test sends one request, then checks the status code, the JSON structure and the rules of the API,
//       not the exact books, because the catalogue changes over time."
// FILE MAP:  1) imports and helpers  ->  2) search tests GB-01..GB-07  ->  3) volume tests GB-08..GB-09
// =====================================================================================================

// `test` defines a test; `expect` is the assertion tool ("I expect X to be Y"). Both come from Playwright.
const { test, expect } = require('@playwright/test');

// Read the API key that was loaded from the .env file (see playwright.config.js). Can be undefined if not set.
const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

// -----------------------------------------------------------------------------------------------------
// HELPER 1: call()  -  one place that sends every GET request, so the tests stay short and consistent.
// -----------------------------------------------------------------------------------------------------
// `async` + `await` = "wait for the answer before moving on". Network calls take time, so we must wait.
// Parameters: request (Playwright HTTP client), path ('volumes'), params (the ?q=...&maxResults=... part).
// `params = {}` means "if nobody passes params, use an empty object".
async function call(request, path, params = {}) {
  const query = { ...params };                       // copy the params (the `...` spreads an object's content)
  // Add our API key unless the test already chose its own key (GB-07 sends a deliberately wrong one).
  if (API_KEY && query.key === undefined) query.key = API_KEY;

  const res = await request.get(path, { params: query }); // send GET <baseURL>/<path>?<query>

  // SAFETY NET: 429 = "quota exceeded". Without this, a 429 could be mistaken for a valid "4xx error" in the
  // negative tests and make them pass for the wrong reason. Here we make it fail loudly with a clear message.
  if (res.status() === 429) {
    throw new Error(
      'Google Books returned 429 (quota exceeded). Calls without your own API key share a quota that is already used up. ' +
      'Set GOOGLE_BOOKS_API_KEY in .env (see README).'
    );
  }
  return res; // give the response back to the test
}

// -----------------------------------------------------------------------------------------------------
// HELPER 2: expectErrorShape()  -  checks that an error answer has the standard Google error format:
//   { "error": { "code": 400, "message": "..." } }
// -----------------------------------------------------------------------------------------------------
function expectErrorShape(body, status) {
  expect(body).toHaveProperty('error');                    // there is an "error" object
  expect(body.error).toHaveProperty('code', status);       // its "code" equals the HTTP status
  expect(body.error).toHaveProperty('message');            // and it explains what went wrong
}

// =====================================================================================================
// GROUP 1 - SEARCH:  GET /volumes?q=...
// `test.describe` only groups tests under one title in the report.
// =====================================================================================================
test.describe('Google Books API - search (GET /volumes)', () => {

  // ---- GB-01: the "happy path" using the exact example call from the exercise -----------------------
  // `{ request }` = Playwright hands us its HTTP client (this is called a "fixture").
  test('GB-01 basic search returns a well-formed result (example call)', async ({ request }) => {
    const started = Date.now();                                            // stopwatch start (milliseconds)
    const res = await call(request, 'volumes', { q: 'ios', maxResults: 20, startIndex: 0 });
    const elapsed = Date.now() - started;                                  // stopwatch stop

    // 1) HTTP level: status 200 = OK, and the answer is JSON.
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');

    // 2) Body level: `await res.json()` converts the text answer into a JavaScript object we can inspect.
    const body = await res.json();
    expect(body.kind).toBe('books#volumes');               // Google labels a list of books like this
    expect(body.totalItems).toBeGreaterThan(0);            // the search found something
    expect(Array.isArray(body.items)).toBe(true);          // `items` is a list...
    expect(body.items.length).toBeGreaterThan(0);          // ...that is not empty
    expect(body.items.length).toBeLessThanOrEqual(20);     // ...and respects maxResults=20

    // 3) Every book in the list must have the main fields. `for...of` visits each item one by one.
    for (const item of body.items) {
      expect(item.kind).toBe('books#volume');              // a single book is labelled like this
      expect(item).toHaveProperty('id');                   // unique book id
      expect(item.volumeInfo).toHaveProperty('title');     // volumeInfo holds title, authors, etc.
    }

    // 4) No duplicates: a Set keeps only unique values, so its size must equal the list length.
    const ids = body.items.map((i) => i.id);               // .map() builds a new list with just the ids
    expect(new Set(ids).size).toBe(ids.length);

    // 5) Performance (a "soft" check: if it fails, the test is marked failed but keeps running).
    expect.soft(elapsed, 'response time (ms)').toBeLessThan(2000);
  });

  // ---- GB-02: maxResults is respected (boundary values 1, 5 and 40) ---------------------------------
  // A normal `for` loop creating 3 tests from one template ("data-driven" testing).
  // 40 is the documented maximum, 1 is the minimum, 5 is a normal value.
  for (const size of [1, 5, 40]) {
    // `${size}` inside backticks is "template string": it inserts the value into the test title.
    test(`GB-02 maxResults=${size} is respected`, async ({ request }) => {
      const res = await call(request, 'volumes', { q: 'javascript', maxResults: size });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.items.length).toBeGreaterThan(0);        // got results
      expect(body.items.length).toBeLessThanOrEqual(size); // never more than requested
    });
  }

  // ---- GB-03: pagination (startIndex moves to the next "page") --------------------------------------
  // REAL FINDING from running against the live API: neighbouring pages can share an item (one id appeared on
  // both pages). So the first version of this test ("no repeated ids") failed for a good reason, and the
  // assertion was changed to what the API really guarantees: page 2 is a different set of results.
  test('GB-03 pagination: page 2 returns different results than page 1', async ({ request }) => {
    // Two calls: first 5 results, then 5 results starting at position 5.
    const page1 = await (await call(request, 'volumes', { q: 'testing', maxResults: 5, startIndex: 0 })).json();
    const page2 = await (await call(request, 'volumes', { q: 'testing', maxResults: 5, startIndex: 5 })).json();

    expect(page1.items.length).toBeGreaterThan(0);
    expect(page2.items.length).toBeGreaterThan(0);

    const ids1 = page1.items.map((i) => i.id);
    const ids2 = page2.items.map((i) => i.id);
    // The two pages must not be identical...
    expect(ids2.join(',')).not.toBe(ids1.join(','));
    // ...and page 2 must contain at least one book that is not on page 1 (.some = "at least one matches").
    expect(ids2.some((id) => !ids1.includes(id))).toBe(true);
  });

  // ---- GB-04: negative case - a search that matches nothing -----------------------------------------
  test('GB-04 query without matches returns totalItems = 0 and no items', async ({ request }) => {
    const res = await call(request, 'volumes', { q: 'zzzqqqxxx987654321' }); // nonsense word
    expect(res.status()).toBe(200);                         // not an error: an empty result is valid
    const body = await res.json();
    expect(body.totalItems).toBe(0);
    // Google omits the `items` field when there are no results, so accept "missing" or "empty list".
    expect(body.items === undefined || body.items.length === 0).toBe(true);
  });

  // ---- GB-05: negative case - the required parameter `q` is missing ---------------------------------
  test('GB-05 missing q parameter is rejected with 400', async ({ request }) => {
    const res = await call(request, 'volumes');             // no params at all
    expect(res.status()).toBe(400);                         // 400 = Bad Request
    expectErrorShape(await res.json(), 400);               // and the error has the standard format
  });

  // ---- GB-06: boundary - maxResults above the documented limit of 40 --------------------------------
  // The documentation does not say exactly what happens, so we accept the two reasonable behaviours.
  test('GB-06 maxResults above the documented limit (40) is rejected or capped', async ({ request }) => {
    const res = await call(request, 'volumes', { q: 'ios', maxResults: 50 });
    if (res.status() === 400) {
      expectErrorShape(await res.json(), 400);              // behaviour A: rejected with a clear error
    } else {
      expect(res.status()).toBe(200);                       // behaviour B: accepted but limited to 40
      expect((await res.json()).items.length).toBeLessThanOrEqual(40);
    }
  });

  // ---- GB-07: security/negative - an invalid API key ------------------------------------------------
  test('GB-07 invalid API key is rejected with a 4xx error', async ({ request }) => {
    // We pass `key` ourselves, so call() will NOT replace it with the real key.
    const res = await call(request, 'volumes', { q: 'ios', key: 'invalid-key-for-testing' });
    expect(res.status()).toBeGreaterThanOrEqual(400);       // any client error...
    expect(res.status()).toBeLessThanOrEqual(403);          // ...between 400 and 403 (429 is excluded on purpose)
    expectErrorShape(await res.json(), res.status());
  });
});

// =====================================================================================================
// GROUP 2 - SINGLE VOLUME:  GET /volumes/{id}
// =====================================================================================================
test.describe('Google Books API - volume (GET /volumes/{id})', () => {

  // ---- GB-08: chained requests - search first, then use a real id from the answer -------------------
  // Each test is independent (it does its own search), so it can run alone or in any order.
  test('GB-08 get one volume by id (id taken from a search)', async ({ request }) => {
    const search = await (await call(request, 'volumes', { q: 'ios', maxResults: 1 })).json();
    const id = search.items[0].id;                          // first book of the search result

    const res = await call(request, `volumes/${id}`);       // GET /volumes/<that id>
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe('books#volume');
    expect(body.id).toBe(id);                               // we got exactly the book we asked for
    expect(body.volumeInfo).toHaveProperty('title');
  });

  // ---- GB-09: negative case - an id that does not exist ---------------------------------------------
  test('GB-09 unknown volume id is not a success and returns an error object', async ({ request }) => {
    const res = await call(request, 'volumes/doesnotexist123');
    expect(res.status()).toBeGreaterThanOrEqual(400);       // must not be a success (Google may answer 4xx or 5xx)
    expect(await res.json()).toHaveProperty('error');       // and it explains the error
  });
});
