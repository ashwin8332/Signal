import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/constants';
import { verifySession } from '@/lib/server/session';

/** Reachable without signing in. The landing page is public for everyone. */
const PUBLIC_PAGES = new Set(['/', '/login', '/signup']);
/** Auth pages make no sense once signed in: send the user to their dashboard. */
const AUTH_PAGES = new Set(['/login', '/signup']);

export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    `default-src 'self'`,
    // Next.js reads the nonce from this header and applies it to its own scripts.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // React SSR and Framer Motion write inline style attributes (see docs/06-security.md).
    `style-src 'self' 'unsafe-inline'`,
    // Article and poster images come from many publisher CDNs, all over https.
    `img-src 'self' data: blob: https:`,
    `font-src 'self'`,
    `connect-src 'self'${isDev ? ' ws:' : ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

/**
 * Runs before every page request:
 *  1. Optimistic auth check: pages need a valid session cookie, otherwise
 *     redirect to /login?next=… (API handlers re-verify on their own).
 *  2. A fresh CSP nonce per request.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const isPublic = PUBLIC_PAGES.has(pathname);

  if (!user && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (user && AUTH_PAGES.has(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: skip API routes, static assets and prefetches.
      source: '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
