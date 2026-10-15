'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSession } from '@/features/auth/authSlice';

/**
 * Loads the signed-in user into the store, and sends the reader back to
 * /login if the session ends (expired cookie, or an API call returned 401).
 * proxy.ts already blocks unauthenticated page loads; this covers the time
 * after the page has loaded.
 */
export function SessionGuard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((state) => state.auth.status);
  const expired = useAppSelector((state) => state.auth.sessionExpired);

  useEffect(() => {
    if (status === 'idle') void dispatch(fetchSession());
  }, [status, dispatch]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    const params = new URLSearchParams();
    params.set('next', pathname);
    if (expired) params.set('expired', '1');
    const query = params.toString();
    router.replace(query ? `/login?${query}` : '/login');
  }, [status, expired, pathname, router]);

  return null;
}
