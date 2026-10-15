'use client';

import { ArrowUpDown, Bookmark, BookmarkMinus, Languages, ListRestart, Palette, Radio, ScrollText, SlidersHorizontal, Undo2, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import type { ActivityKind } from '@/features/activity/activitySlice';
import { formatRelativeTime } from '@/lib/format';

const ICON: Record<ActivityKind, LucideIcon> = {
  saved: Bookmark,
  removed: BookmarkMinus,
  restored: Undo2,
  reordered: ArrowUpDown,
  orderReset: ListRestart,
  interests: SlidersHorizontal,
  live: Radio,
  theme: Palette,
  language: Languages,
};

/** Audit-style log of what the reader changed this session, newest first. */
export function ActivityLog() {
  const { t, i18n } = useTranslation();
  const entries = useAppSelector((state) => state.activity.entries).slice(0, 8);

  return (
    <section aria-labelledby="activity-title" className="brut bg-surface p-4">
      <h2 id="activity-title" className="flex items-center gap-2 text-lg font-black text-fg">
        <ScrollText aria-hidden="true" className="h-5 w-5" />
        {t('dashboard.activity')}
      </h2>
      <p className="mb-3 text-xs text-fg-muted">{t('dashboard.activityHint')}</p>
      {entries.length === 0 ? (
        <p className="border-2 border-dashed border-border p-3 text-sm text-fg-muted">{t('dashboard.activityEmpty')}</p>
      ) : (
        <ol className="relative flex flex-col gap-3 border-l-[3px] border-ink pl-4" data-testid="activity-log">
          {entries.map((entry) => {
            const Icon = ICON[entry.kind];
            return (
              <li key={entry.id} className="relative">
                <span aria-hidden="true" className="absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center border-2 border-ink bg-surface">
                  <Icon className="h-3 w-3" />
                </span>
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg">{t(`dashboard.activity_${entry.kind}`, entry.values)}</p>
                <time dateTime={new Date(entry.at).toISOString()} className="font-mono text-[10px] font-bold uppercase text-fg-muted">
                  {formatRelativeTime(new Date(entry.at).toISOString(), i18n.language)}
                </time>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
