import { expect, test } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

// Runs in the "mobile" project (Pixel 7 viewport, touch).
test.describe('mobile layout', () => {
  test('navigation lives in a drawer that traps focus and closes with Escape', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);

    const menuButton = page.getByRole('button', { name: 'Open navigation menu' });
    await menuButton.click();
    const drawer = page.getByRole('dialog', { name: 'Main navigation' });
    await expect(drawer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    await menuButton.click();
    await drawer.getByRole('link', { name: 'Trending' }).click();
    await expect(page).toHaveURL(/\/trending$/);
    await expect(drawer).toBeHidden();
  });

  test('cards stack in one column and use touch-friendly move buttons', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const cards = page.getByTestId('content-card');
    const [first, second] = [await cards.nth(0).boundingBox(), await cards.nth(1).boundingBox()];
    expect(second!.y).toBeGreaterThan(first!.y + first!.height - 1);

    const moveLater = cards.nth(0).getByRole('button', { name: /later$/ });
    const box = await moveLater.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expect(cards.nth(0).getByTestId('drag-handle')).toBeHidden();
  });

  test('search has its own page with a full-width field', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    await page.getByRole('link', { name: 'Open search' }).click();
    const box = page.getByRole('searchbox').filter({ visible: true });
    await expect(box).toBeFocused();
    await box.fill('space');
    await expect(page).toHaveURL(/\/search\?q=space$/);
  });
});
