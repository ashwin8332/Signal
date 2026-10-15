'use client';

import type { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import { useLiveFeed } from '@/hooks/useLiveFeed';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { SessionGuard } from './SessionGuard';
import { PageTransition } from './PageTransition';

export function DashboardShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  useLiveFeed();

  return (
    <DndProvider backend={HTML5Backend}>
      <SessionGuard />
      <a
        href="#main-content"
        className="sr-only z-[70] border-2 border-ink bg-amber px-4 py-2 font-bold text-[#121210] focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t('nav.skipToContent')}
      </a>
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 outline-none md:px-6 md:py-8 lg:px-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <MobileNav />
    </DndProvider>
  );
}
