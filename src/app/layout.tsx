import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import { Providers } from '@/components/providers/Providers';
import { themeScript } from '@/components/providers/themeScript';
import './globals.css';

// Fonts are vendored from npm (@fontsource) and served by next/font/local, so the
// build never depends on reaching Google Fonts (CI, offline machines, Vercel).
const display = localFont({
  src: [{ path: '../../node_modules/@fontsource/archivo/files/archivo-latin-700-normal.woff2', weight: '700', style: 'normal' }, { path: '../../node_modules/@fontsource/archivo/files/archivo-latin-800-normal.woff2', weight: '800', style: 'normal' }, { path: '../../node_modules/@fontsource/archivo/files/archivo-latin-900-normal.woff2', weight: '900', style: 'normal' }],
  display: 'swap',
  variable: '--ff-display',
});
const body = localFont({
  src: [{ path: '../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' }, { path: '../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' }, { path: '../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' }, { path: '../../node_modules/@fontsource/hanken-grotesk/files/hanken-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' }],
  display: 'swap',
  variable: '--ff-body',
});
const mono = localFont({
  src: [{ path: '../../node_modules/@fontsource/space-mono/files/space-mono-latin-400-normal.woff2', weight: '400', style: 'normal' }, { path: '../../node_modules/@fontsource/space-mono/files/space-mono-latin-700-normal.woff2', weight: '700', style: 'normal' }],
  display: 'swap',
  variable: '--ff-mono',
});

export const metadata: Metadata = {
  title: { default: 'Signal: your personalized briefing', template: '%s · Signal' },
  description: 'News, film recommendations and social posts in one personalized, customizable dashboard.',
  applicationName: 'Signal',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#cfe8d6' },
    { media: '(prefers-color-scheme: dark)', color: '#0e1310' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Per-request CSP nonce set by src/proxy.ts.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    // The pre-paint script may change class/lang before hydration.
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Extensions such as Grammarly add attributes to <body> before hydration; this only silences <body>'s own attributes. */}
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
