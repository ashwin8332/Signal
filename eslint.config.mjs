import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Article and poster images come from arbitrary third-party hosts (NewsAPI
      // returns any publisher's CDN), so next/image's host allow-list does not fit.
      // ContentImage handles lazy loading, fixed aspect ratio and fallback itself.
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'playwright-report/**', 'test-results/**', 'next-env.d.ts']),
]);
