import { expect, test } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

test.describe('personalized feed', () => {
  test('mixes news, films and posts, and loads more on scroll', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const cards = page.getByTestId('content-card');
    await expect(cards).toHaveCount(27); // 9 per source on page 1
    for (const label of ['News', 'Film', 'Post']) {
      await expect(cards.getByText(label, { exact: true }).first()).toBeVisible();
    }

    await page.getByText('Load more').scrollIntoViewIfNeeded();
    await expect.poll(() => cards.count()).toBeGreaterThan(27);
  });

  test('changing interests in Settings changes the feed', async ({ page }) => {
    await signInAsDemo(page, '/settings');
    // Turn off every film genre: the film source disappears from the feed.
    for (const genre of ['Science fiction', 'Drama', 'Comedy']) {
      await page.getByRole('button', { name: genre, exact: true }).click();
    }
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Your briefing' }).click();
    await waitForFeed(page);
    await expect(page.getByRole('tab', { name: /Films/ })).toContainText('0');
    await expect(page.getByTestId('content-card').getByText('Film', { exact: true })).toHaveCount(0);
  });

  test('a failing source degrades gracefully', async ({ page }) => {
    await page.route('**/api/recommendations**', (route) =>
      route.fulfill({ status: 502, json: { error: { code: 'UPSTREAM_ERROR', message: 'TMDB is unavailable right now.' } } }),
    );
    await signInAsDemo(page);
    await waitForFeed(page);
    await expect(page.getByText('Film picks couldn’t load right now.')).toBeVisible();
    await expect(page.getByTestId('content-card').getByText('News', { exact: true }).first()).toBeVisible();

    await page.unroute('**/api/recommendations**');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByText('Film picks couldn’t load right now.')).toBeHidden();
  });

  test('a total outage shows an error with retry', async ({ page }) => {
    await page.route(/\/api\/(news|recommendations|social)/, (route) => route.fulfill({ status: 500, json: { error: { code: 'X', message: 'x' } } }));
    await signInAsDemo(page);
    await expect(page.getByRole('alert').getByText('We couldn’t load your briefing')).toBeVisible();
    await page.unrouteAll();
    await page.getByRole('button', { name: 'Try again' }).click();
    await waitForFeed(page);
  });

  test('live posts wait behind a pill instead of shifting the feed', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const pill = page.getByRole('button', { name: /new posts?$/ });
    await expect(pill).toBeVisible({ timeout: 15_000 }); // stream interval is 3 s in E2E
    await pill.click();
    await expect(page.getByTestId('content-card').first().getByText('Just posted')).toBeVisible();
  });
});
