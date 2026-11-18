// =====================================================================================================
// playwright.config.js  -  the "settings file" that Playwright reads before running any test.
// =====================================================================================================
// WHAT IT DOES: tells Playwright where the tests are, which URL to call, and what to record on failure.
// WHEN IT RUNS: automatically, every time you type `npx playwright test` (or click Run in VS Code / UI mode).
// YOU DO NOT NEED TO EDIT IT during the presentation. Just be able to explain the two "projects" below.
// =====================================================================================================

// Import the helper that turns a plain object into a valid Playwright configuration.
// `require` is the classic Node.js way of importing a library (like `import` in newer JavaScript).
const { defineConfig } = require('@playwright/test');

// Load the secrets/settings from the file called `.env` (GOOGLE_BOOKS_API_KEY, PORTAL_URL, ...).
// Why: so passwords and API keys are NOT written inside the code that goes to GitHub.
// `process.loadEnvFile()` is built into Node 20.12+. The try/catch means: "if there is no .env file, carry on".
try { process.loadEnvFile(); } catch { /* no .env file: that is fine */ }

// `module.exports` = "this is what this file gives to whoever imports it" (here: Playwright itself).
module.exports = defineConfig({
  // Number of automatic re-runs of a failed test. 0 on your laptop (you want to see failures),
  // 1 on a CI server (process.env.CI is set there) to absorb one-off network glitches.
  retries: process.env.CI ? 1 : 0,

  // Two reports: 'list' prints one line per test in the terminal; 'html' creates the playwright-report folder
  // that you open with `npm run report`. open:'never' = do not pop the browser automatically after each run.
  reporter: [['list'], ['html', { open: 'never' }]],

  // Defaults for ALL tests in ALL projects.
  use: {
    trace: 'retain-on-failure',      // record a step-by-step "film" (trace) and keep it only when a test fails
    screenshot: 'only-on-failure',   // take a screenshot only when a (browser) test fails
  },

  // A "project" is a named group of tests with its own settings. We have two:
  projects: [
    {
      // ---- Project 1: Exercise 3 - Google Books API tests (no browser needed, only HTTP calls) ----
      name: 'google-books-api',
      testDir: './tests/api',        // only the files inside this folder belong to this project
      use: {
        // Base address of the API. Tests call 'volumes' and Playwright glues it to this address.
        // The trailing slash "/" at the end matters, otherwise 'v1' would be dropped when joining the URL.
        // `||` means "use the left value if it exists, otherwise the right one": BOOKS_BASE_URL is only set
        // when we run against the local simulation (npm run test:api:mock).
        baseURL: process.env.BOOKS_BASE_URL || 'https://www.googleapis.com/books/v1/',
        // Header sent in every request: "I want JSON back".
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      // ---- Project 2: Exercise 2 - MB WAY portal tests (these DO open a real browser) ----
      name: 'portal',
      testDir: './tests/portal',
      use: {
        baseURL: process.env.PORTAL_URL, // the portal address comes from .env, so page.goto('/') opens it
        browserName: 'chromium',         // Chromium = the engine behind Chrome/Edge
      },
    },
  ],
});
