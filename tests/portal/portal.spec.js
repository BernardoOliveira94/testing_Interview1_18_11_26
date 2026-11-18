// Exercise 2 - Automated tests for the MB WAY portal (Playwright + JavaScript)
//
// The portal URL comes from PORTAL_URL (.env). Part 1 only needs the public pages and uses no site-specific
// locators, so it runs on any portal. Part 2 (login flows) needs a test account and the real locators:
// it is marked fixme and must be enabled once those are known (use `npx playwright codegen <PORTAL_URL>`).
const { test, expect } = require('@playwright/test');

test.skip(!process.env.PORTAL_URL, 'Set PORTAL_URL in .env to run the portal tests');

test.describe('Portal - public pages (smoke)', () => {
  test('PORTAL-01 home page loads with a title', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBeLessThan(400);
    await expect(page).toHaveTitle(/.+/);
  });

  test('PORTAL-02 home page shows a main heading and navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading').first()).toBeVisible();
    expect(await page.getByRole('link').count()).toBeGreaterThan(0);
  });

  test('PORTAL-03 internal links respond without errors', async ({ page, request }) => {
    await page.goto('/');
    const origin = new URL(page.url()).origin;
    const hrefs = await page.$$eval('a[href]', (anchors) => anchors.map((a) => a.href));
    const internal = [...new Set(hrefs.filter((h) => h.startsWith(origin)).map((h) => h.split('#')[0]))].slice(0, 15);
    expect(internal.length, 'internal links found').toBeGreaterThan(0);
    for (const url of internal) {
      const res = await request.get(url);
      expect.soft(res.status(), url).toBeLessThan(400);
    }
  });

  test('PORTAL-04 images have alternative text (accessibility)', async ({ page }) => {
    await page.goto('/');
    const images = await page.$$eval('img', (imgs) => imgs.map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt') })));
    for (const img of images) {
      expect.soft(img.alt, `alt attribute missing on ${img.src}`).not.toBeNull();
    }
  });

  test.describe('on a mobile viewport', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test('PORTAL-05 page does not scroll horizontally', async ({ page }) => {
      await page.goto('/');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
});

test.describe('Portal - login (enable when a test account and the real locators are known)', () => {
  // TODO: replace the placeholder locators below with the real ones found with `npx playwright codegen`.
  const loginButton = (page) => page.getByRole('button', { name: /login|entrar|iniciar/i });
  const phoneField = (page) => page.getByLabel(/phone|telem|n[uú]mero/i);
  const pinField = (page) => page.getByLabel(/pin|password|c[oó]digo/i);

  test.fixme('PORTAL-10 empty login form shows validation messages', async ({ page }) => {
    await page.goto('/');
    await loginButton(page).click();
    await expect(page.getByText(/required|obrigat/i).first()).toBeVisible();
  });

  test.fixme('PORTAL-11 invalid credentials show an error and no access', async ({ page }) => {
    await page.goto('/');
    await phoneField(page).fill('900000000');
    await pinField(page).fill('0000');
    await loginButton(page).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test.fixme('PORTAL-12 valid test account reaches the logged-in area and can log out', async ({ page }) => {
    await page.goto('/');
    await phoneField(page).fill(process.env.PORTAL_USER);
    await pinField(page).fill(process.env.PORTAL_PASS);
    await loginButton(page).click();
    await expect(page).not.toHaveURL(/login/i);
  });
});
