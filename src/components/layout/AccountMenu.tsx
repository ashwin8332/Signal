'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/authSlice';
import { selectDisplayName } from '@/features/feed/selectors';
import { contentApi } from '@/services/contentApi';
import { Avatar } from '@/components/ui/Avatar';

/**
 * Account disclosure menu: profile, settings, sign out. Closes on Esc (focus
 * returns to the button), on outside click, and after choosing an item.
 */
export function AccountMenu() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const name = useAppSelector(selectDisplayName);
  const email = useAppSelector((state) => state.auth.user?.email ?? '');
  const color = useAppSelector((state) => state.profile.avatarColor);
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const signOut = async () => {
    setOpen(false);
    await dispatch(logout());
    dispatch(contentApi.util.resetApiState());
    router.replace('/login');
  };

  const itemClass =
    'flex h-10 w-full items-center gap-2.5 px-3 text-left text-sm font-semibold text-fg hover:bg-surface-3 focus-visible:bg-surface-3';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2 border-2 border-transparent px-1.5 hover:border-ink hover:bg-surface-3"
      >
        <Avatar name={name || '?'} color={color} size="sm" />
        {/* The accessible name is built from the visible name (WCAG 2.5.3 label in name). */}
        <span className="sr-only max-w-32 truncate text-sm font-medium text-fg xl:not-sr-only">{name}</span>
        <span className="sr-only">{t('header.accountSuffix')}</span>
        <ChevronDown aria-hidden="true" className="hidden h-4 w-4 text-fg-muted xl:block" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={menuId}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }}
            transition={{ duration: 0.16 }}
            className="brut-lg absolute right-0 top-full z-50 mt-2 w-64 origin-top-right bg-surface p-1.5"
          >
            <div className="flex items-center gap-3 border-b-2 border-ink px-3 pb-3 pt-2">
              <Avatar name={name || '?'} color={color} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{name}</p>
                <p className="truncate text-xs text-fg-muted">{email}</p>
              </div>
            </div>
            <ul className="pt-1.5">
              <li>
                <Link href="/profile" className={itemClass} onClick={() => setOpen(false)}>
                  <UserRound aria-hidden="true" className="h-4 w-4 text-fg-muted" />
                  {t('nav.profile')}
                </Link>
              </li>
              <li>
                <Link href="/settings" className={itemClass} onClick={() => setOpen(false)}>
                  <Settings aria-hidden="true" className="h-4 w-4 text-fg-muted" />
                  {t('nav.settings')}
                </Link>
              </li>
              <li>
                <button type="button" className={itemClass} onClick={() => void signOut()}>
                  <LogOut aria-hidden="true" className="h-4 w-4 text-fg-muted" />
                  {t('header.signOut')}
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
