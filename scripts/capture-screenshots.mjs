#!/usr/bin/env node
/**
 * Captures real product screenshots for the landing page and README.
 * Usage: start the app (e.g. `npx next start -p 3200`), then
 *   node scripts/capture-screenshots.mjs http://localhost:3200
 * Writes public/screenshots/dashboard-{light,dark}.png (1440×900, @2x).
 */
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.argv[2] ?? 'http://localhost:3200';
const outDir = new URL('../public/screenshots/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
try {
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: scheme,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    await page.goto(`${base}/login`);
    await page.getByRole('button', { name: 'Continue with demo account' }).click();
    await page.waitForURL(/\/dashboard$/, { timeout: 30_000 });
    await page.getByTestId('content-card').first().waitFor();
    // Let images, the ticker and the trending rail settle.
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(1500);
    const path = new URL(`dashboard-${scheme}.png`, outDir);
    await page.screenshot({ path: path.pathname.replace(/^\/([A-Za-z]:)/, '$1') });
    console.log(`saved ${path.pathname}`);
    await context.close();
  }
} finally {
  await browser.close();
}
