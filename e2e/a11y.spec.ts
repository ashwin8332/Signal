import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

async function expectNoSeriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const serious = results.violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');
  expect(
    serious.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).slice(0, 3).join(', ')})`),
  ).toEqual([]);
}

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  test('login page', async ({ page }) => {
    await page.goto('/login');
    await expectNoSeriousViolations(page);
  });

  for (const dark of [false, true]) {
    test(`feed in ${dark ? 'dark' : 'light'} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' });
      await signInAsDemo(page);
      await waitForFeed(page);
      await expectNoSeriousViolations(page);
    });
  }

  for (const path of ['/trending', '/favorites', '/settings', '/profile', '/search?q=ai']) {
    test(`${path} page`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await signInAsDemo(page, path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle').catch(() => {});
      await expectNoSeriousViolations(page);
    });
  }

  test('skip link moves focus to the main content', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });
});
