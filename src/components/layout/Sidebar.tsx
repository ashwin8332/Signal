'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';
import { PRIMARY_NAV, SECONDARY_NAV } from './navigation';

/**
 * Persistent navigation: a 240 px sidebar at ≥1024 px and a 72 px icon rail
 * from 768 px. Below 768 px it is replaced by the MobileNav drawer.
 */
export function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r-[3px] border-ink bg-surface md:flex md:w-[76px] lg:w-60">
      <div className="flex h-[103px] items-center border-b-[3px] border-ink bg-bar px-4 text-bar-fg lg:px-5">
        <Link href="/dashboard" className="rounded-control">
          <span className="lg:hidden">
            <Logo compact />
          </span>
          <span className="hidden lg:inline">
            <Logo />
          </span>
        </Link>
      </div>
      <nav aria-label={t('nav.primary')} className="flex flex-1 flex-col justify-between gap-6 overflow-y-auto px-3 pb-4 pt-2">
        <div className="hidden lg:block">
          <NavLinks items={PRIMARY_NAV} variant="full" />
        </div>
        <div className="lg:hidden">
          <NavLinks items={PRIMARY_NAV} variant="rail" />
        </div>
        <div className="border-t-2 border-dashed border-border pt-4">
          <div className="hidden lg:block">
            <NavLinks items={SECONDARY_NAV} variant="full" />
          </div>
          <div className="lg:hidden">
            <NavLinks items={SECONDARY_NAV} variant="rail" />
          </div>
        </div>
      </nav>
    </aside>
  );
}
