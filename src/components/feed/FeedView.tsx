'use client';

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Inbox, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentType } from '@/types/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGetFeedInfiniteQuery } from '@/services/contentApi';
import { selectDisplayName, selectFeedArgs } from '@/features/feed/selectors';
import { moveItem, resetOrder, setSourceFilter, type SourceFilter } from '@/features/feed/feedSlice';
import { showToast } from '@/features/ui/uiSlice';
import { applyOrder, countByType, uniqueById } from '@/lib/feed';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Button, buttonClasses } from '@/components/ui/Button';
import { ErrorState, InlineNotice, StateView } from '@/components/ui/StateViews';
import { Spinner } from '@/components/ui/Spinner';
import { ReorderableGrid, SkeletonGrid } from '@/components/content/ContentGrid';
import { SOURCE_ICON } from '@/components/content/SourceBadge';
import { StatTiles } from '@/components/dashboard/StatTiles';
import { SourceMix, type ProviderStatus } from '@/components/dashboard/SourceMix';
import { HeadlineTicker } from '@/components/dashboard/HeadlineTicker';
import { TrendingMini } from '@/components/dashboard/TrendingMini';
import { ActivityLog } from '@/components/dashboard/ActivityLog';
import { LivePill } from './LivePill';

const FEED_GRID_ID = 'feed-grid';
const TYPES: ContentType[] = ['news', 'movie', 'social'];

function greetingKey(hour: number) {
  if (hour < 12) return 'header.greetingMorning';
  if (hour < 18) return 'header.greetingAfternoon';
  return 'header.greetingEvening';
}

/**
 * The briefing dashboard: overview tiles and ticker on top, the reorderable
 * feed on the left, and a rail with source health, trending and the session
 * log on wide screens.
 */
export function FeedView() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector((state) => state.ui.hydrated);
  const args = useAppSelector(selectFeedArgs);
  const order = useAppSelector((state) => state.feed.order);
  const live = useAppSelector((state) => state.feed.live);
  const filter = useAppSelector((state) => state.feed.sourceFilter);
  const name = useAppSelector(selectDisplayName);

  // Wait for persisted preferences, so we don't fetch defaults and then refetch.
  const { data, isLoading, isError, isFetching, isFetchingNextPage, isFetchNextPageError, hasNextPage, fetchNextPage, refetch } =
    useGetFeedInfiniteQuery(args, { skip: !hydrated });

  const allItems = useMemo(
    () => uniqueById([...live, ...(data?.pages.flatMap((page) => page.items) ?? [])]),
    [live, data],
  );
  const ordered = useMemo(() => applyOrder(allItems, order), [allItems, order]);
  const visible = useMemo(
    () => (filter === 'all' ? ordered : ordered.filter((item) => item.type === filter)),
    [ordered, filter],
  );
  const counts = useMemo(() => countByType(allItems), [allItems]);
  const lastPage = data?.pages.at(-1);
  const failedSources = useMemo(() => lastPage?.failedSources ?? [], [lastPage]);

  // Where each source's data comes from right now, for the Source mix panel.
  const providerStatus = useMemo(() => {
    const enabled: Record<ContentType, boolean> = {
      news: args.categories.length > 0,
      movie: args.genres.length > 0,
      social: args.hashtags.length > 0,
    };
    return Object.fromEntries(
      TYPES.map((type) => {
        const status: ProviderStatus = !enabled[type]
          ? 'off'
          : failedSources.includes(type) || (isError && !data)
            ? 'down'
            : (lastPage?.sources[type] ?? 'mock');
        return [type, status];
      }),
    ) as Record<ContentType, ProviderStatus>;
  }, [args, failedSources, isError, data, lastPage]);

  const onMove = useCallback(
    (from: number, to: number) => dispatch(moveItem({ visibleIds: visible.map((item) => item.id), from, to })),
    [dispatch, visible],
  );

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) void fetchNextPage();
  }, [hasNextPage, isFetching, fetchNextPage]);
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: Boolean(hasNextPage) && !isFetching && !isFetchNextPageError,
    onLoadMore: loadMore,
  });

  const filterOptions: { value: SourceFilter; label: string; count: number; icon?: React.ReactNode }[] = [
    { value: 'all', label: t('sources.all'), count: allItems.length },
    ...TYPES.map((type) => {
      const Icon = SOURCE_ICON[type];
      return {
        value: type,
        label: t(`sources.${type}Plural`),
        count: counts[type],
        icon: <Icon aria-hidden="true" className="h-4 w-4" />,
      };
    }),
  ];

  const showSkeleton = !hydrated || (isLoading && !data);
  const enabledSources = TYPES.filter((type) => providerStatus[type] !== 'off').length;

  return (
    <section aria-labelledby="feed-title" className="flex flex-col gap-6">
      <PageHeader
        title={t('nav.feed')}
        titleId="feed-title"
        eyebrow={name ? t(greetingKey(new Date().getHours()), { name }) : undefined}
        description={t('feed.subtitle')}
        actions={
          order.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />}
              onClick={() => {
                dispatch(resetOrder());
                dispatch(showToast({ message: 'feed.orderReset', tone: 'info' }));
              }}
            >
              {t('feed.resetOrder')}
            </Button>
          )
        }
      />

      <StatTiles itemCount={allItems.length} sourceCount={enabledSources} />
      <HeadlineTicker items={ordered} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              label={t('feed.filterLabel')}
              value={filter}
              options={filterOptions}
              controls={FEED_GRID_ID}
              onChange={(value) => dispatch(setSourceFilter(value))}
            />
            {data && (
              <p className="font-mono text-[11px] font-bold uppercase tracking-wide text-fg-muted">
                {t('feed.countSummary', { news: counts.news, movie: counts.movie, social: counts.social })}
              </p>
            )}
          </div>

          <LivePill />

          {failedSources.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {failedSources.map((source) => (
                <InlineNotice key={source} onRetry={() => void refetch()}>
                  {t(`feed.partial_${source}`)}
                </InlineNotice>
              ))}
            </div>
          )}

          {showSkeleton ? (
            <div aria-busy="true">
              <span className="sr-only">{t('common.loading')}</span>
              <SkeletonGrid />
            </div>
          ) : isError && !data ? (
            <ErrorState title={t('feed.errorTitle')} body={t('feed.errorBody')} onRetry={() => void refetch()} retrying={isFetching} />
          ) : visible.length === 0 && !hasNextPage ? (
            <StateView
              icon={<Inbox className="h-6 w-6" />}
              title={t('feed.emptyTitle')}
              body={t('feed.emptyBody')}
              action={
                <Link href="/settings" className={buttonClasses('secondary')}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  {t('feed.emptyAction')}
                </Link>
              }
            />
          ) : (
            <>
              <ReorderableGrid id={FEED_GRID_ID} items={visible} onMove={onMove} spotlight />

              <div ref={sentinelRef} className="flex min-h-24 flex-col items-center justify-center gap-3 py-8">
                {isFetchingNextPage ? (
                  <p className="flex items-center gap-2 font-mono text-xs font-bold uppercase text-fg-muted" role="status">
                    <Spinner /> {t('feed.loadingMore')}
                  </p>
                ) : isFetchNextPageError ? (
                  <InlineNotice onRetry={() => void fetchNextPage()}>{t('feed.loadMoreError')}</InlineNotice>
                ) : hasNextPage ? (
                  <Button variant="secondary" onClick={loadMore}>
                    {t('feed.loadMore')}
                  </Button>
                ) : (
                  <p className="stamp text-fg">{t('feed.caughtUp')}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start">
          <SourceMix counts={counts} status={providerStatus} />
          <TrendingMini />
          <div className="hidden lg:block">
            <ActivityLog />
          </div>
        </div>
      </div>
    </section>
  );
}
