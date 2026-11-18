// =====================================================================================================
// tests/portal/portal.spec.js  -  EXERCISE 2 (automation): tests for the MB WAY web portal
// =====================================================================================================
// WHAT IS TESTED: part 1 = public pages (works on any website); part 2 = login flows (disabled until a test
//                 account and the real page locators exist).
// HOW: Playwright opens a real Chromium browser, clicks and reads the page like a user would.
// HOW TO EXPLAIN IT: "I automated what is safe and reachable without credentials, and I prepared the login
//                     tests but left them disabled (fixme) because they need a test account."
// =====================================================================================================

// `page`  = one browser tab we control.  `request` = HTTP client.  `expect` = assertions.  `test` = defines a test.
const { test, expect } = require('@playwright/test');

// If PORTAL_URL is empty in .env, skip ALL tests in this file and print the reason instead of failing.
test.skip(!process.env.PORTAL_URL, 'Set PORTAL_URL in .env to run the portal tests');

// =====================================================================================================
// PART 1 - public pages ("smoke tests": quick checks that the basics are alive)
// =====================================================================================================
test.describe('Portal - public pages (smoke)', () => {

  // PORTAL-01: the home page opens and has a title.
  test('PORTAL-01 home page loads with a title', async ({ page }) => {
    const response = await page.goto('/');          // '/' + baseURL (PORTAL_URL) = the home page
    expect(response.status()).toBeLessThan(400);    // below 400 = success or redirect, not an error page
    await expect(page).toHaveTitle(/.+/);           // /.+/ is a regular expression meaning "at least 1 character"
  });

  // PORTAL-02: there is a visible heading and at least one link.
  test('PORTAL-02 home page shows a main heading and navigation links', async ({ page }) => {
    await page.goto('/');
    // getByRole finds elements the way a user/screen reader sees them (heading, link, button...).
    // `await expect(...).toBeVisible()` automatically WAITS until the element appears (no fixed sleeps needed).
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(await page.getByRole('link').count()).toBeGreaterThan(0);
  });

  // PORTAL-03: links that stay on the same site must not be broken (404/500).
  test('PORTAL-03 internal links respond without errors', async ({ page, request }) => {
    await page.goto('/');
    const origin = new URL(page.url()).origin;      // e.g. "https://example.com"
    // Run code INSIDE the page to collect the address of every <a href="..."> link.
    const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.href));
    const internal = [...new Set(                   // Set removes duplicates, [...] turns it back into a list
      hrefs.filter((h) => h.startsWith(origin))     // keep only links of the same site
           .map((h) => h.split('#')[0])             // ignore the "#section" part of the address
    )].slice(0, 15);                                // test at most 15 links to keep it fast
    expect(internal.length, 'internal links found').toBeGreaterThan(0);
    for (const url of internal) {
      const res = await request.get(url);           // plain HTTP call, no browser needed
      expect.soft(res.status(), url).toBeLessThan(400); // soft = report every broken link, not only the first
    }
  });

  // PORTAL-04: accessibility - every image should have an `alt` attribute (text for screen readers).
  test('PORTAL-04 images have alternative text (accessibility)', async ({ page }) => {
    await page.goto('/');
    const images = await page.$$eval('img', (imgs) => imgs.map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt') })));
    for (const img of images) {
      expect.soft(img.alt, `alt attribute missing on ${img.src}`).not.toBeNull();
    }
  });

  // A nested group that runs its tests with a phone-sized screen (375 x 812 pixels).
  test.describe('on a mobile viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    // PORTAL-05: on a phone the page must not need sideways scrolling.
    test('PORTAL-05 page does not scroll horizontally', async ({ page }) => {
      await page.goto('/');
      // content width minus screen width; <= 1 allows for rounding by one pixel
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
});

// =====================================================================================================
// PART 2 - login tests. DISABLED with test.fixme: they need (a) a test account, (b) the real locators.
// To enable: record the real locators with `npx playwright codegen <PORTAL_URL>`, replace the three helpers
// below, set PORTAL_USER / PORTAL_PASS in .env, and change `test.fixme` to `test`.
// =====================================================================================================
test.describe('Portal - login (enable when a test account and the real locators are known)', () => {
  // Small helper functions = one place to change if the page changes (this idea is called "page object").
  // Regular expressions like /login|entrar/i mean "login OR entrar", case-insensitive (works in EN and PT).
  const loginButton = (page) => page.getByRole('button', { name: /login|entrar|iniciar/i });
  const phoneField = (page) => page.getByLabel(/phone|telem|n[uú]mero/i);
  const pinField = (page) => page.getByLabel(/pin|password|c[oó]digo/i);

  // PORTAL-10: submit an empty form -> validation messages must appear.
  test.fixme('PORTAL-10 empty login form shows validation messages', async ({ page }) => {
    await page.goto('/');
    await loginButton(page).click();
    await expect(page.getByText(/required|obrigat/i).first()).toBeVisible();
  });

  // PORTAL-11: wrong credentials -> an error is shown and there is no access.
  test.fixme('PORTAL-11 invalid credentials show an error and no access', async ({ page }) => {
    await page.goto('/');
    await phoneField(page).fill('900000000');       // .fill() types into the field
    await pinField(page).fill('0000');
    await loginButton(page).click();                // .click() presses the button
    await expect(page.getByRole('alert')).toBeVisible();
  });

  // PORTAL-12: valid test account -> reaches the logged-in area.
  test.fixme('PORTAL-12 valid test account reaches the logged-in area and can log out', async ({ page }) => {
    await page.goto('/');
    await phoneField(page).fill(process.env.PORTAL_USER);  // credentials come from .env, never from the code
    await pinField(page).fill(process.env.PORTAL_PASS);
    await loginButton(page).click();
    await expect(page).not.toHaveURL(/login/i);
  });
});
