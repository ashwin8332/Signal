import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { waitForAnimationsToSettle } from './helpers';

test.describe('landing page', () => {
  test('is public and explains the product, with working calls to action', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The whole world.');
    await expect(page.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/signup');
    await expect(page.getByRole('heading', { name: /Everything you follow/ })).toBeVisible();
    await expect(page.getByText(/not endorsed or certified by TMDB/)).toBeVisible();
  });

  test('the showcase screenshot actually loads for signed-out visitors', async ({ page }) => {
    await page.goto('/');
    const shot = page.getByRole('img', { name: /Screenshot of the Signal dashboard/ }).filter({ visible: true }).first();
    await shot.scrollIntoViewIfNeeded();
    // naturalWidth is 0 for a broken image (e.g. if /public files were sent to /login).
    await expect.poll(() => shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBeGreaterThan(0);
  });

  test('"Try the live demo" signs in and opens the dashboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Try the live demo' }).first().click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1, name: 'Your briefing' })).toBeVisible();
    // Signed-in visitors see "Open dashboard" on the landing page.
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Open dashboard' }).first()).toBeVisible();
  });

  test('switching to Hindi translates the page', async ({ page }) => {
    await page.goto('/');
    await page.locator('html[data-hydrated="true"]').waitFor({ state: 'attached' });
    await page.getByRole('combobox', { name: 'Language' }).selectOption('hi');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('पूरी दुनिया।');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await waitForAnimationsToSettle(page);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`)).toEqual([]);
  });
});
