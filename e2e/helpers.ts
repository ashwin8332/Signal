import { expect, type Page } from '@playwright/test';

/** Signs in with the demo account and waits for the feed to render. */
export async function signInAsDemo(page: Page, path = '/') {
  await page.goto(path === '/' ? '/login' : `/login?next=${encodeURIComponent(path)}`);
  await page.getByRole('button', { name: 'Continue with demo account' }).click();
  // Sign-in sets the cookie, then the client navigates: allow for a cold server.
  await expect(page).toHaveURL(path === '/' ? /\/$/ : new RegExp(path.replace('?', '\\?')), { timeout: 20_000 });
}

export async function waitForFeed(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Your briefing' })).toBeVisible();
  await expect(page.getByTestId('content-card').first()).toBeVisible();
}

export function cardTitles(page: Page) {
  return page.getByTestId('content-card').locator('h2').allTextContents();
}
