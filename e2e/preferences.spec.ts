import { expect, test } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

test.describe('favorites and preferences persist', () => {
  test('favorite an item, find it in Favorites after a reload, remove and undo', async ({ page }) => {
    // A fresh account: favorites belong to the account, so this test can't
    // collide with others that use the shared demo account.
    await page.goto('/signup');
    await page.getByLabel('Name').fill('Fav Tester');
    await page.getByLabel('Email').fill(`fav-${Date.now()}-${Math.round(Math.random() * 1e6)}@example.com`);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/settings$/, { timeout: 20_000 });
    await page.goto('/dashboard');
    await waitForFeed(page);
    const title = (await page.getByTestId('content-card').first().locator('h2').textContent())!;
    await page.getByRole('button', { name: `Save “${title}” to favorites` }).click();
    await expect(page.getByText('Saved to favorites')).toBeVisible();

    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: /Favorites/ }).click();
    await expect(page).toHaveURL(/\/favorites$/);
    await page.waitForTimeout(400); // let the debounced save land
    await page.reload();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText('1 saved item')).toBeVisible();

    await page.getByRole('button', { name: `Remove “${title}” from favorites` }).click();
    await expect(page.getByRole('heading', { name: 'No favorites yet' })).toBeVisible();
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });

  test('dark mode applies instantly and survives a reload without flashing', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    const html = page.locator('html');
    const startedDark = (await html.getAttribute('class'))?.includes('dark') ?? false;
    await page.getByTestId('theme-toggle').click();
    await expect(html).toHaveClass(startedDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
    await page.waitForTimeout(400);

    // Check the class is already right in the very first paint after reload.
    await page.reload({ waitUntil: 'commit' });
    await page.waitForSelector('html', { state: 'attached' });
    const darkOnLoad = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(darkOnLoad).toBe(!startedDark);
  });

  test('language switch translates the UI and persists', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    await page.getByRole('combobox', { name: 'Language' }).selectOption('es');
    await expect(page.getByRole('heading', { level: 1, name: 'Tu resumen' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Tu resumen' })).toBeVisible();
  });

  test('profile changes show up in the header', async ({ page }) => {
    await signInAsDemo(page, '/profile');
    const name = page.getByLabel('Display name');
    await name.fill('Morning Reader');
    await page.getByRole('radio', { name: 'Emerald' }).check({ force: true });
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile saved')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Morning Reader\s?, account menu$/ })).toBeVisible();
  });
});
