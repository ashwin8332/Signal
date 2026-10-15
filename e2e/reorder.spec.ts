import { expect, test } from '@playwright/test';
import { cardTitles, signInAsDemo, waitForFeed } from './helpers';

test.describe('drag-and-drop reordering', () => {
  test('dragging a card moves it, and the order survives a reload', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const before = await cardTitles(page);

    const cards = page.getByTestId('content-card');
    await cards.nth(0).hover();
    await cards.nth(0).getByTestId('drag-handle').dragTo(cards.nth(2), { targetPosition: { x: 260, y: 200 } });

    await expect.poll(() => cardTitles(page).then((titles) => titles.indexOf(before[0]!))).toBeGreaterThan(0);
    const after = await cardTitles(page);
    expect(after).not.toEqual(before);

    // Wait for the debounced save, then reload.
    await page.waitForTimeout(500);
    await page.reload();
    await waitForFeed(page);
    expect((await cardTitles(page)).slice(0, 3)).toEqual(after.slice(0, 3));

    await page.getByRole('button', { name: 'Reset order' }).click();
    await expect.poll(() => cardTitles(page).then((titles) => titles.slice(0, 3))).toEqual(before.slice(0, 3));
  });

  test('keyboard users can reorder with the move buttons', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const [first, second] = await cardTitles(page);

    const moveLater = page.getByRole('button', { name: `Move “${first}” later` });
    await moveLater.focus();
    await page.keyboard.press('Enter');

    await expect.poll(() => cardTitles(page).then((titles) => titles.slice(0, 2))).toEqual([second, first]);
    await expect(page.getByText('Moved to position 2 of 27')).toBeAttached();
    // Focus stays on the moved card's control so the user can keep going.
    await expect(page.getByRole('button', { name: `Move “${first}” later` })).toBeFocused();
  });
});
