import { expect, type Page } from '@playwright/test';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Signs in with the demo account and waits until it lands on `path` (the dashboard by default). */
export async function signInAsDemo(page: Page, path = '/dashboard') {
  await page.goto(path === '/dashboard' ? '/login' : `/login?next=${encodeURIComponent(path)}`);
  await page.getByRole('button', { name: 'Continue with demo account' }).click();
  // Sign-in sets the cookie, then the client navigates: allow for a cold server.
  await expect(page).toHaveURL(new RegExp(`${escapeRegExp(path)}$`), { timeout: 20_000 });
}

export async function waitForFeed(page: Page) {
  await expect(page.getByRole('heading', { level: 1, name: 'Your briefing' })).toBeVisible();
  await expect(page.getByTestId('content-card').first()).toBeVisible();
}

export function cardTitles(page: Page) {
  return page.getByTestId('content-card').locator('h2').allTextContents();
}

/** Waits until no CSS/Web Animations are mid-flight (e.g. before an axe contrast scan). */
export async function waitForAnimationsToSettle(page: Page) {
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running' || animation.effect?.getTiming().iterations === Infinity));
}
