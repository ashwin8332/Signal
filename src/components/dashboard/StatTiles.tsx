'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bookmark, Layers, Radio, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/cn';

interface TileProps {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint: string;
  accent: string;
  href?: string;
}

function Tile({ icon, label, value, hint, accent, href }: TileProps) {
  const body = (
    <>
      <span aria-hidden="true" className={cn('brut-sm flex h-11 w-11 shrink-0 items-center justify-center text-[#121210]', accent)}>
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-fg-muted">{label}</span>
        <span className="font-mono text-3xl font-bold leading-none tabular-nums text-fg">{value}</span>
        <span className="mt-1 text-xs text-fg-muted">{hint}</span>
      </span>
    </>
  );
  // Icon stacks above the numbers on narrow phones so nothing truncates.
  const classes = 'brut flex flex-col items-start gap-3 bg-surface p-4 sm:flex-row sm:items-center';
  return href ? (
    <Link href={href} className={cn(classes, 'press')}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** Four at-a-glance numbers for the briefing, styled like an ops console. */
export function StatTiles({ itemCount, sourceCount }: { itemCount: number; sourceCount: number }) {
  const { t } = useTranslation();
  const saved = useAppSelector((state) => state.favorites.ids.length);
  const pending = useAppSelector((state) => state.feed.pending.length);
  const liveShown = useAppSelector((state) => state.feed.live.length);
  const interests = useAppSelector(
    (state) => state.preferences.categories.length + state.preferences.genres.length + state.preferences.hashtags.length,
  );

  return (
    <section aria-label={t('dashboard.overview')} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Tile
        icon={<Layers className="h-5 w-5" />}
        label={t('dashboard.statItems')}
        value={itemCount}
        hint={t('dashboard.statItemsHint', { count: sourceCount })}
        accent="bg-[#cde6ff]"
      />
      <Tile
        icon={<Bookmark className="h-5 w-5" />}
        label={t('dashboard.statSaved')}
        value={saved}
        hint={t('dashboard.statSavedHint')}
        accent="bg-[#e8a030]"
        href="/favorites"
      />
      <Tile
        icon={<Radio className="h-5 w-5" />}
        label={t('dashboard.statLive')}
        value={pending + liveShown}
        hint={t('dashboard.statLiveHint', { count: pending })}
        accent="bg-[#cfe8d6]"
      />
      <Tile
        icon={<SlidersHorizontal className="h-5 w-5" />}
        label={t('dashboard.statInterests')}
        value={interests}
        hint={t('dashboard.statInterestsHint')}
        accent="bg-[#ecd9ff]"
        href="/settings"
      />
    </section>
  );
}
