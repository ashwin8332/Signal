'use client';

import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import type { StreamStatus } from '@/features/feed/feedSlice';
import { cn } from '@/lib/cn';

function subscribeToSeconds(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

/**
 * Local time, ticking. The server snapshot is null and renders a placeholder,
 * so the server never renders a time that won't match the browser's.
 */
function LiveClock() {
  const { t, i18n } = useTranslation();
  const now = useSyncExternalStore(
    subscribeToSeconds,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
  const text = now === null ? '--:--:--' : new Intl.DateTimeFormat(i18n.language, { timeStyle: 'medium' }).format(now * 1000);
  return (
    <span className="tabular-nums">
      <span className="sr-only">{t('dashboard.localTime')}: </span>
      <time suppressHydrationWarning>{text}</time>
    </span>
  );
}

const DOT: Record<StreamStatus, string> = {
  live: 'bg-accent',
  connecting: 'bg-amber',
  reconnecting: 'bg-amber',
  paused: 'bg-bar-fg/50',
  off: 'bg-bar-fg/30',
};

export function StreamStatusBadge({ className }: { className?: string }) {
  const { t } = useTranslation();
  const status = useAppSelector((state) => state.feed.streamStatus);
  return (
    <span className={cn('inline-flex items-center gap-2', className)} data-testid="stream-status" data-status={status}>
      <span aria-hidden="true" className="relative flex h-2.5 w-2.5">
        {status === 'live' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />}
        <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', DOT[status])} />
      </span>
      {t(`dashboard.stream_${status}`)}
    </span>
  );
}

/**
 * Thin black control strip above the header, as in an operations console:
 * product mark, live-stream status and a running clock.
 */
export function ControlBar() {
  const { t } = useTranslation();
  return (
    <div className="flex h-9 items-center justify-between gap-4 bg-bar px-4 font-mono text-[11px] font-bold uppercase tracking-wider text-bar-fg md:px-6 lg:px-8">
      <span className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center bg-amber text-[11px] text-[#121210]">
          S
        </span>
        <span className="truncate">{t('dashboard.suite')}</span>
      </span>
      <span className="flex shrink-0 items-center gap-4">
        <StreamStatusBadge />
        <span aria-hidden="true" className="hidden opacity-40 sm:inline">
          |
        </span>
        <span className="hidden sm:inline">
          <LiveClock />
        </span>
      </span>
    </div>
  );
}
