// Exercise 3 - Automated tests for the Google Books API (REST, JSON)
// Docs: https://developers.google.com/books/docs/v1/getting_started
//
// Rules used in all tests:
//  - check structure and rules, never exact content (the catalogue changes over time)
//  - a 429 (quota exceeded) is never accepted as a valid result, so it can not hide as a passing negative test
const { test, expect } = require('@playwright/test');

const API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

async function call(request, path, params = {}) {
  const query = { ...params };
  if (API_KEY && query.key === undefined) query.key = API_KEY;
  const res = await request.get(path, { params: query });
  if (res.status() === 429) {
    throw new Error(
      'Google Books returned 429 (quota exceeded). Calls without your own API key share a quota that is already used up. ' +
      'Set GOOGLE_BOOKS_API_KEY in .env (see README).'
    );
  }
  return res;
}

function expectErrorShape(body, status) {
  expect(body).toHaveProperty('error');
  expect(body.error).toHaveProperty('code', status);
  expect(body.error).toHaveProperty('message');
}

test.describe('Google Books API - search (GET /volumes)', () => {
  test('GB-01 basic search returns a well-formed result (example call)', async ({ request }) => {
    const started = Date.now();
    const res = await call(request, 'volumes', { q: 'ios', maxResults: 20, startIndex: 0 });
    const elapsed = Date.now() - started;

    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/json');

    const body = await res.json();
    expect(body.kind).toBe('books#volumes');
    expect(body.totalItems).toBeGreaterThan(0);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(20);

    for (const item of body.items) {
      expect(item.kind).toBe('books#volume');
      expect(item).toHaveProperty('id');
      expect(item.volumeInfo).toHaveProperty('title');
    }
    const ids = body.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    expect.soft(elapsed, 'response time (ms)').toBeLessThan(2000);
  });

  for (const size of [1, 5, 40]) {
    test(`GB-02 maxResults=${size} is respected`, async ({ request }) => {
      const res = await call(request, 'volumes', { q: 'javascript', maxResults: size });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.items.length).toBeGreaterThan(0);
      expect(body.items.length).toBeLessThanOrEqual(size);
    });
  }

  test('GB-03 pagination: page 2 does not repeat items of page 1', async ({ request }) => {
    const page1 = await (await call(request, 'volumes', { q: 'testing', maxResults: 5, startIndex: 0 })).json();
    const page2 = await (await call(request, 'volumes', { q: 'testing', maxResults: 5, startIndex: 5 })).json();

    expect(page1.items.length).toBeGreaterThan(0);
    expect(page2.items.length).toBeGreaterThan(0);
    const page1Ids = page1.items.map((i) => i.id);
    for (const item of page2.items) {
      expect(page1Ids).not.toContain(item.id);
    }
  });

  test('GB-04 query without matches returns totalItems = 0 and no items', async ({ request }) => {
    const res = await call(request, 'volumes', { q: 'zzzqqqxxx987654321' });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.totalItems).toBe(0);
    expect(body.items === undefined || body.items.length === 0).toBe(true);
  });

  test('GB-05 missing q parameter is rejected with 400', async ({ request }) => {
    const res = await call(request, 'volumes');
    expect(res.status()).toBe(400);
    expectErrorShape(await res.json(), 400);
  });

  test('GB-06 maxResults above the documented limit (40) is rejected or capped', async ({ request }) => {
    const res = await call(request, 'volumes', { q: 'ios', maxResults: 50 });
    if (res.status() === 400) {
      expectErrorShape(await res.json(), 400);
    } else {
      expect(res.status()).toBe(200);
      expect((await res.json()).items.length).toBeLessThanOrEqual(40);
    }
  });

  test('GB-07 invalid API key is rejected with a 4xx error', async ({ request }) => {
    const res = await call(request, 'volumes', { q: 'ios', key: 'invalid-key-for-testing' });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThanOrEqual(403);
    expectErrorShape(await res.json(), res.status());
  });
});

test.describe('Google Books API - volume (GET /volumes/{id})', () => {
  test('GB-08 get one volume by id (id taken from a search)', async ({ request }) => {
    const search = await (await call(request, 'volumes', { q: 'ios', maxResults: 1 })).json();
    const id = search.items[0].id;

    const res = await call(request, `volumes/${id}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.kind).toBe('books#volume');
    expect(body.id).toBe(id);
    expect(body.volumeInfo).toHaveProperty('title');
  });

  test('GB-09 unknown volume id is not a success and returns an error object', async ({ request }) => {
    const res = await call(request, 'volumes/doesnotexist123');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(await res.json()).toHaveProperty('error');
  });
});
