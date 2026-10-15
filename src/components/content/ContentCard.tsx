'use client';

import { useId } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Eye, GripVertical, Star, ThumbsUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentItem } from '@/types/content';
import { formatCompactNumber, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ContentImage } from './ContentImage';
import { SourceBadge } from './SourceBadge';
import { ReasonChip } from './ReasonChip';
import { FavoriteButton } from './FavoriteButton';

const CTA_KEY = { news: 'card.readArticle', movie: 'card.viewFilm', social: 'card.openPost' } as const;
const METRIC_ICON = { rating: Star, likes: ThumbsUp, reads: Eye } as const;

export interface ReorderControls {
  position: number; // 1-based
  total: number;
  onMoveEarlier: () => void;
  onMoveLater: () => void;
}

interface ContentCardProps {
  item: ContentItem;
  headingLevel?: 'h2' | 'h3';
  reorder?: ReorderControls;
  /** Connects the drag handle (pointer devices). Keyboard and touch use the move buttons. */
  connectDragHandle?: (node: HTMLSpanElement | null) => void;
  /** Rank stamp for the Trending list. */
  rank?: number;
  /**
   * Spotlight layout for the top of the feed: spans two columns with image and
   * text side by side once its grid container is wide enough.
   */
  featured?: boolean;
  className?: string;
}

export function ContentCard({
  item,
  headingLevel: Heading = 'h2',
  reorder,
  connectDragHandle,
  rank,
  featured = false,
  className,
}: ContentCardProps) {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const locale = i18n.language;
  const MetricIcon = item.metrics ? METRIC_ICON[item.metrics.label] : null;
  const metricValue = item.metrics
    ? item.metrics.label === 'rating'
      ? item.metrics.value.toFixed(1)
      : formatCompactNumber(item.metrics.value, locale)
    : '';

  return (
    <article
      aria-labelledby={titleId}
      data-testid="content-card"
      data-item-id={item.id}
      data-featured={featured || undefined}
      className={cn(
        'brut group relative flex h-full flex-col overflow-hidden bg-surface',
        'transition-[transform,box-shadow] duration-200 ease-out-soft hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-lg',
        featured && '@xl:grid @xl:grid-cols-[1.15fr_1fr]',
        className,
      )}
    >
      <div className={cn('relative border-b-[3px] border-ink', featured && '@xl:border-b-0 @xl:border-r-[3px]')}>
        <ContentImage src={item.imageUrl} type={item.type} className={cn(featured && '@xl:aspect-auto @xl:h-full @xl:min-h-72')} />
        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          <SourceBadge type={item.type} />
          {featured && (
            <span className="tag bg-amber text-[#121210]">
              <Star aria-hidden="true" className="h-3 w-3" fill="currentColor" />
              {t('feed.spotlight')}
            </span>
          )}
        </div>
        {rank !== undefined && (
          <span className="brut-sm absolute bottom-3 left-3 inline-flex h-10 min-w-10 items-center justify-center bg-fg px-2 font-mono text-lg font-bold text-bg">
            <span className="sr-only">{t('trending.rank', { rank })}</span>
            <span aria-hidden="true">#{rank}</span>
          </span>
        )}
        {connectDragHandle && (
          <span
            ref={connectDragHandle}
            aria-hidden="true"
            title={t('feed.dragHandle')}
            data-testid="drag-handle"
            className="brut-sm absolute right-3 top-3 hidden cursor-grab items-center justify-center bg-surface p-1.5 text-fg opacity-0 transition-opacity duration-150 group-hover:opacity-100 active:cursor-grabbing pointer-fine:inline-flex"
          >
            <GripVertical className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className={cn('flex flex-1 flex-col gap-2.5 p-4', featured && '@xl:p-6')}>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-wide text-fg-muted">
          <span className="truncate">{item.source}</span>
          <span aria-hidden="true">/</span>
          <time dateTime={item.publishedAt}>{formatRelativeTime(item.publishedAt, locale)}</time>
        </div>

        <Heading
          id={titleId}
          title={item.title}
          className={cn(
            'line-clamp-2 text-lg font-extrabold leading-snug text-fg',
            featured && '@xl:line-clamp-3 @xl:text-3xl @xl:leading-tight',
          )}
        >
          {item.title}
        </Heading>

        {item.summary && item.summary !== item.title && (
          <p className={cn('line-clamp-3 text-sm leading-relaxed text-fg-muted', featured && '@xl:line-clamp-5 @xl:text-base')}>
            {item.summary}
          </p>
        )}

        <ReasonChip reason={item.reason} />

        <div className="mt-auto flex items-center gap-1 border-t-2 border-dashed border-border pt-3">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="brut-sm press inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap bg-fg px-3 font-mono text-[11px] font-bold uppercase tracking-wide text-bg"
          >
            {t(CTA_KEY[item.type])}
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="sr-only">
              : {item.title} {t('card.opensInNewTab')}
            </span>
          </a>

          {MetricIcon && item.metrics && (
            <span className="ml-1.5 inline-flex items-center gap-1 font-mono text-xs font-bold text-fg">
              <MetricIcon aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="sr-only">{t(`card.metric_${item.metrics.label}`, { value: metricValue })}</span>
              <span aria-hidden="true" className="tabular-nums">
                {metricValue}
              </span>
            </span>
          )}

          <span className="flex-1" />

          {reorder && (
            <>
              <MoveButton
                direction="earlier"
                label={t('feed.moveEarlier', { title: item.title })}
                disabled={reorder.position <= 1}
                onClick={reorder.onMoveEarlier}
                itemId={item.id}
              />
              <MoveButton
                direction="later"
                label={t('feed.moveLater', { title: item.title })}
                disabled={reorder.position >= reorder.total}
                onClick={reorder.onMoveLater}
                itemId={item.id}
              />
            </>
          )}
          <FavoriteButton item={item} />
        </div>
      </div>
    </article>
  );
}

function MoveButton({
  direction,
  label,
  disabled,
  onClick,
  itemId,
}: {
  direction: 'earlier' | 'later';
  label: string;
  disabled: boolean;
  onClick: () => void;
  itemId: string;
}) {
  // Arrows follow the grid flow: vertical in one column, horizontal in several.
  const [Narrow, Wide] = direction === 'earlier' ? [ArrowUp, ArrowLeft] : [ArrowDown, ArrowRight];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      data-move={`${itemId}:${direction}`}
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 border-transparent text-fg transition-colors hover:border-ink hover:bg-surface-3 disabled:opacity-30 pointer-fine:h-9 pointer-fine:w-9"
    >
      <Narrow aria-hidden="true" className="h-4 w-4 @xl:hidden" />
      <Wide aria-hidden="true" className="hidden h-4 w-4 @xl:block" />
    </button>
  );
}

export function ContentCardSkeleton() {
  return (
    <div aria-hidden="true" className="brut flex flex-col overflow-hidden bg-surface">
      <div className="skeleton aspect-video w-full border-b-[3px] border-ink" />
      <div className="flex flex-col gap-3 p-4">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-11/12" />
        <div className="skeleton h-5 w-3/4" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-5/6" />
        <div className="mt-2 flex justify-between">
          <div className="skeleton h-9 w-32" />
          <div className="skeleton h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
