# MB WAY QA exercises - Bernardo M. Oliveira

Technical exercise for the SIBS / MB WAY QA position. Approach: risk-based, 80/20, keep it simple.

## What is in this repository

| Exercise | Folder | Tool | Status |
|---|---|---|---|
| Manual tests - MB WAY app (26 cases) | `manual-tests/` (sheet *App Tests*) | Excel | Done. Behaviour is **assumed** (no access to the real app) |
| Manual tests - MB WAY API (28 cases) | `manual-tests/` (sheet *API Tests*) | Excel | Done. Endpoints are **imagined**, as the exercise asks |
| Automation - Google Books API | `tests/api/` and `postman/` | Playwright + JavaScript, Postman | Done. Verified against a local simulation; needs your own API key for the real API |
| Automation - MB WAY portal | `tests/portal/` | Playwright + JavaScript | Public-page smoke tests done and verified on a sample site. Login tests are marked `fixme` until a test account and real locators exist |
| Automation - MB WAY app | `app-appium/` | Appium + WebdriverIO | Skeleton only. Needs a device, the app and a test account |

## Setup

```bash
npm install
cp .env.example .env      # then fill in the values (never commit .env)
```

### Google Books API key (the "create an account" part of exercise 3)
1. Sign in at https://console.cloud.google.com and create a project.
2. APIs & Services > Library > **Books API** > Enable.
3. APIs & Services > Credentials > Create credentials > **API key** (optionally restrict it to the Books API).
4. Put the key in `.env` as `GOOGLE_BOOKS_API_KEY`, and in the Postman environment as `apiKey`.

### Why the example call returns 429
`GET /volumes?q=ios&maxResults=20&startIndex=0` without a key is answered with `429 RESOURCE_EXHAUSTED` ("Queries per day", `defaultPerDayPerProject`, limit value 0). Requests without a key are counted against a project that is not yours, and its daily quota is already used up. With your own key the requests are counted against your own project. If the 429 still appears with a key, check that the Books API is enabled for that project.
The tests treat a 429 as a **failure with a clear message**, never as a valid negative result.

## Run

```bash
npm run test:api          # Google Books API tests against the real API (needs GOOGLE_BOOKS_API_KEY)
npm run test:api:mock     # same tests against a local simulation (works without a key or network)
npm run test:portal       # portal tests (needs PORTAL_URL)
npm run report            # open the HTML report
```
Postman: import both files from `postman/`, select the environment, set `apiKey`, run the collection in order.
Command line: `npx newman run postman/google-books.postman_collection.json -e postman/google-books.postman_environment.json --env-var "apiKey=YOUR_KEY"`

## Google Books test cases (same IDs in Playwright and Postman)

| ID | Checks |
|---|---|
| GB-01 | Example call: 200, JSON, `kind`, `totalItems`, items <= 20, `id` and `volumeInfo.title`, unique ids, response time < 2 s |
| GB-02 | `maxResults` respected (1, 5, 40) |
| GB-03 | Pagination: page 2 returns different results than page 1 (the live API may repeat one item between pages) |
| GB-04 | No matches: `totalItems = 0`, no items |
| GB-05 | Missing `q`: 400 + error object |
| GB-06 | `maxResults=50`: rejected (400) or capped at 40 |
| GB-07 | Invalid API key: 4xx + error object |
| GB-08 | Get one volume by id |
| GB-09 | Unknown volume id: error object, not a success |

Tests check structure and rules, not exact content, because the catalogue changes over time. On the first run with a real key, confirm the exact status codes of GB-04, GB-06, GB-07 and GB-09 and tighten the assertions if needed.

## Suggested demo (about 10 minutes)

1. **Approach (1 min):** risk first (money, security, data integrity), then negative, boundary and resilience cases. Say the assumptions out loud.
2. **Manual app + API (3 min):** open the Excel file, show the README sheet assumptions, 2-3 P1 cases per sheet (limit boundary, duplicate payment / Idempotency-Key, another user's account), and the Gherkin sheet.
3. **Google Books API (3 min):** show the 429 and explain it, then run `npm run test:api` with your key, open the report, run the Postman collection once.
4. **Portal (2 min):** run `npm run test:portal`, explain why login tests wait for a test account.
5. **App (1 min):** explain Appium and the constraints, and what you would ask SIBS for.

## Limits (be upfront about them)
- The real MB WAY app, portal and API were not available: all MB WAY behaviour is assumed and must be confirmed against requirements.
- Google Books tests were verified against a simulation based on the documented behaviour, not against the live API.
- The portal public-page tests use no site-specific locators on purpose; login tests need real locators and a test account.
