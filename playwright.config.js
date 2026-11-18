// Playwright configuration - two projects: Google Books API tests and MB WAY portal tests
const { defineConfig } = require('@playwright/test');

// Load .env without extra dependencies (Node 20.12+). Ignored if the file does not exist.
try { process.loadEnvFile(); } catch { /* no .env file */ }

module.exports = defineConfig({
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'google-books-api',
      testDir: './tests/api',
      use: {
        // Trailing slash matters: request paths below are relative ('volumes')
        baseURL: process.env.BOOKS_BASE_URL || 'https://www.googleapis.com/books/v1/',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      name: 'portal',
      testDir: './tests/portal',
      use: {
        baseURL: process.env.PORTAL_URL,
        browserName: 'chromium',
      },
    },
  ],
});
