'use client';

import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetTrendingQuery } from '@/services/contentApi';
import { SOURCE_ICON, SOURCE_TEXT } from '@/components/content/SourceBadge';
import { cn } from '@/lib/cn';

/** Compact top-5 trending list for the dashboard rail. */
export function TrendingMini() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetTrendingQuery('all');
  const items = (data ?? []).slice(0, 5);

  return (
    <section aria-labelledby="trending-mini-title" className="brut bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="trending-mini-title" className="flex items-center gap-2 text-lg font-black text-fg">
          <Flame aria-hidden="true" className="h-5 w-5 text-danger" />
          {t('dashboard.trendingTop')}
        </h2>
        <Link href="/trending" className="inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase text-fg underline-offset-4 hover:underline">
          {t('dashboard.viewAll')}
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <ul aria-hidden="true" className="flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="skeleton h-10" />
          ))}
        </ul>
      ) : isError ? (
        <p className="text-sm text-fg-muted">{t('trending.errorTitle')}</p>
      ) : (
        <ol className="flex flex-col divide-y-2 divide-dashed divide-border">
          {items.map((item, index) => {
            const Icon = SOURCE_ICON[item.type];
            return (
              <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="w-7 shrink-0 font-mono text-xl font-bold leading-6 tabular-nums text-fg">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-sm font-bold leading-snug text-fg underline-offset-2 hover:underline"
                  >
                    <span className="sr-only">{t('trending.rank', { rank: index + 1 })}: </span>
                    {item.title}
                  </a>
                  <span className={cn('mt-0.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase', SOURCE_TEXT[item.type])}>
                    <Icon aria-hidden="true" className="h-3 w-3" />
                    {t(`sources.${item.type}`)} · {item.source}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
