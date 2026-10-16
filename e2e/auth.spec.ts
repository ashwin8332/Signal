import { expect, test } from '@playwright/test';
import { signInAsDemo, waitForFeed } from './helpers';

test.describe('authentication', () => {
  test('protected pages redirect to login and come back after signing in', async ({ page }) => {
    await page.goto('/favorites');
    await expect(page).toHaveURL(/\/login\?next=%2Ffavorites/);
    await page.getByRole('button', { name: 'Continue with demo account' }).click();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Favorites' })).toBeVisible();
  });

  test('wrong credentials show one generic error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@signal.app');
    await page.getByLabel('Password', { exact: true }).fill('definitely-wrong');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // Scoped to the form: Next.js's route announcer is also role="alert".
    await expect(page.getByRole('main').getByRole('alert')).toHaveText('Email or password is incorrect.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('client-side validation runs before submitting', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByText('Enter a valid email address, like name@example.com.')).toBeVisible();
  });

  test('sign up lands in Settings, sign out returns to login', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    await page.goto('/signup');
    await page.getByLabel('Name').fill('E2E Reader');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/settings$/);

    await page.getByRole('button', { name: /^E2E Reader\s?, account menu$/ }).click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('a signed-in user is sent away from the login page', async ({ page }) => {
    await signInAsDemo(page);
    await waitForFeed(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('pages carry a nonce-based CSP and anti-framing headers', async ({ page }) => {
    const response = await page.goto('/login');
    const headers = response!.headers();
    expect(headers['content-security-policy']).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
  });
});
