'use client';

import { useTranslation } from 'react-i18next';
import type { ContentType } from '@/types/content';
import { SOURCE_BAR, SOURCE_ICON, SOURCE_TEXT } from '@/components/content/SourceBadge';
import { cn } from '@/lib/cn';

export type ProviderStatus = 'live' | 'mock' | 'down' | 'off';

const TYPES: ContentType[] = ['news', 'movie', 'social'];

const STAMP: Record<ProviderStatus, string> = {
  live: 'text-success',
  mock: 'text-warning-fg',
  down: 'text-danger',
  off: 'text-fg-muted',
};

/**
 * Share of loaded items per source as one stacked bar, plus a stamp for
 * where each source's data comes from (real API, demo data, down or off).
 * This makes API-key problems visible instead of silently hidden.
 */
export function SourceMix({ counts, status }: { counts: Record<ContentType, number>; status: Record<ContentType, ProviderStatus> }) {
  const { t } = useTranslation();
  const total = counts.news + counts.movie + counts.social;
  const pct = (type: ContentType) => (total === 0 ? 0 : Math.round((counts[type] / total) * 100));

  return (
    <section aria-labelledby="source-mix-title" className="brut bg-surface p-4">
      <h2 id="source-mix-title" className="text-lg font-black text-fg">
        {t('dashboard.sourceMix')}
      </h2>
      <p className="mb-3 text-xs text-fg-muted">{t('dashboard.sourceMixHint')}</p>

      {/* Visual bar; the list below carries the same numbers as text. */}
      <div aria-hidden="true" className="flex h-5 w-full overflow-hidden border-2 border-ink bg-surface-2">
        {TYPES.map((type) =>
          counts[type] > 0 ? (
            <span key={type} className={cn('h-full border-r-2 border-ink last:border-r-0', SOURCE_BAR[type])} style={{ width: `${pct(type)}%` }} />
          ) : null,
        )}
      </div>

      <ul className="mt-3 flex flex-col gap-2.5">
        {TYPES.map((type) => {
          const Icon = SOURCE_ICON[type];
          return (
            <li key={type} className="flex items-center gap-2 text-sm">
              <Icon aria-hidden="true" className={cn('h-4 w-4 shrink-0', SOURCE_TEXT[type])} />
              <span className="font-semibold text-fg">{t(`sources.${type}Plural`)}</span>
              <span className="font-mono text-xs tabular-nums text-fg-muted">
                {counts[type]} · {pct(type)}%
              </span>
              <span className={cn('stamp ml-auto', STAMP[status[type]])} data-testid={`provider-${type}`} data-status={status[type]}>
                {t(`dashboard.status_${status[type]}`)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
