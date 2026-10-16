import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E runs against a production build (`next build && next start`) so it
 * exercises the same code users get. No API keys are passed, so every source
 * serves deterministic mock data.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Each worker launches a browser against one Next server; a few is plenty.
  workers: 2,
  expect: { timeout: 10_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      AUTH_SECRET: 'e2e-only-secret-not-used-anywhere-else-0123456789',
      NEWS_API_KEY: '',
      TMDB_API_READ_TOKEN: '',
      TMDB_API_KEY: '',
      // Never let test sign-ups and favorites reach the real database.
      SUPABASE_URL: '',
      SUPABASE_SECRET_KEY: '',
      LIVE_FEED_INTERVAL_MS: '3000',
    },
  },
});
