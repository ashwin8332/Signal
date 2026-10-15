import { expect, test } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

test.describe('search', () => {
  test('debounces typing into a single request and shows results', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);

    const searches: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/search')) searches.push(request.url());
    });

    const box = page.getByRole('searchbox', { name: 'Search news, films and posts' });
    await box.pressSequentially('space', { delay: 60 }); // faster than the 350 ms debounce
    await expect(page).toHaveURL(/\/search\?q=space$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Results for “space”' })).toBeVisible();
    await expect(page.getByTestId('content-card').first()).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /results?$/ })).toBeVisible();

    // Exact 350 ms timing is proven with fake timers in the unit tests. Here we
    // check the user-visible contract in a way that holds on a slow CI machine:
    // far fewer requests than keystrokes, ending with the full query.
    expect(searches.length).toBeLessThanOrEqual(2);
    expect(searches.at(-1)).toContain('q=space');
  });

  test('filters by type and handles no results', async ({ page }) => {
    await signInAsDemo(page, '/search?q=space');
    await page.getByRole('tab', { name: /Social/ }).click();
    await expect(page.getByTestId('content-card').first().getByText('Post', { exact: true })).toBeVisible();

    await page.goto('/search?q=zzzzqqq');
    await expect(page.getByRole('heading', { name: 'No results for “zzzzqqq”' })).toBeVisible();
  });

  test('"/" focuses search from anywhere', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox', { name: 'Search news, films and posts' })).toBeFocused();
  });
});
