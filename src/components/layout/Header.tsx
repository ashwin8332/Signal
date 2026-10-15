'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { setMobileNavOpen } from '@/features/ui/uiSlice';
import { IconButton } from '@/components/ui/IconButton';
import { Logo } from './Logo';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelect } from './LanguageSelect';
import { AccountMenu } from './AccountMenu';
import { ControlBar } from '@/components/dashboard/ControlBar';

/** Sticky top bar: search (primary), then theme, language and account. */
export function Header() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  return (
    <header className="sticky top-0 z-30 border-b-[3px] border-ink bg-surface">
      <ControlBar />
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-4 md:px-6 lg:px-8">
        <IconButton
          label={t('nav.openMenu')}
          icon={<Menu className="h-5 w-5" />}
          className="md:hidden"
          tooltip={false}
          onClick={() => dispatch(setMobileNavOpen(true))}
        />
        <Link href="/dashboard" className="rounded-control md:hidden">
          <Logo compact />
        </Link>

        <div className="hidden flex-1 sm:block sm:max-w-xl">
          <Suspense fallback={<div className="h-10 w-full rounded-control bg-surface-2" />}>
            <SearchBar />
          </Suspense>
        </div>
        <span className="flex-1 sm:hidden" />

        <div className="flex items-center gap-1 sm:ml-auto">
          {/* Small screens: search lives on its own page with a full-width field. */}
          <Link
            href="/search"
            aria-label={t('header.openSearch')}
            className="inline-flex h-11 w-11 items-center justify-center text-fg hover:bg-surface-3 sm:hidden"
          >
            <Search aria-hidden="true" className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <LanguageSelect className="hidden md:flex" />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
