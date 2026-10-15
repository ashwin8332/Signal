'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchX, Search as SearchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentType } from '@/types/content';
import { SEARCH_MAX_LENGTH } from '@/lib/constants';
import { uniqueById } from '@/lib/feed';
import { useSearchInfiniteQuery } from '@/services/contentApi';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { ErrorState, InlineNotice, StateView } from '@/components/ui/StateViews';
import { Spinner } from '@/components/ui/Spinner';
import { ContentGrid, SkeletonGrid } from '@/components/content/ContentGrid';
import { SOURCE_ICON } from '@/components/content/SourceBadge';
import { SearchBar } from '@/components/layout/SearchBar';
import { cn } from '@/lib/cn';

type SearchType = 'all' | ContentType;
const RESULTS_ID = 'search-results';

/**
 * Results for the query in the URL. The header SearchBar debounces typing
 * before updating the URL, so each pause in typing costs exactly one request.
 */
export function SearchView() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const query = (params.get('q') ?? '').trim().slice(0, SEARCH_MAX_LENGTH);
  const [type, setType] = useState<SearchType>('all');

  const { data, isLoading, isFetching, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = useSearchInfiniteQuery(
    { q: query, type },
    { skip: query.length === 0 },
  );

  const items = useMemo(() => uniqueById(data?.pages.flatMap((page) => page.items) ?? []), [data]);
  const failedSources = data?.pages[0]?.failedSources ?? [];
  const sentinelRef = useInfiniteScroll<HTMLDivElement>({
    enabled: Boolean(hasNextPage) && !isFetching,
    onLoadMore: () => void fetchNextPage(),
  });

  const options = [
    { value: 'all' as const, label: t('sources.all') },
    ...(['news', 'movie', 'social'] as ContentType[]).map((value) => {
      const Icon = SOURCE_ICON[value];
      return { value, label: t(`sources.${value}Plural`), icon: <Icon aria-hidden="true" className="h-4 w-4" /> };
    }),
  ];

  // While a new query loads, keep the previous results visible but dimmed.
  const refreshing = isFetching && !isFetchingNextPage && items.length > 0;

  return (
    <section aria-labelledby="search-title">
      <PageHeader
        title={query ? t('search.resultsFor', { query }) : t('search.title')}
        titleId="search-title"
      />

      {/* Small screens have no header search box, so show one here. */}
      <div className="mb-5 sm:hidden">
        <SearchBar autoFocus={!query} />
      </div>

      {query.length === 0 ? (
        <StateView icon={<SearchIcon className="h-6 w-6" />} title={t('search.hintTitle')} body={t('search.hintBody')} />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Tabs label={t('search.typeLabel')} value={type} options={options} onChange={setType} controls={RESULTS_ID} />
            {/* Announces the result count once results arrive. */}
            <p role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-fg-muted">
              {isFetching && !isFetchingNextPage ? (
                <>
                  <Spinner size="sm" /> {t('search.searching')}
                </>
              ) : data ? (
                t('search.results', { count: items.length })
              ) : null}
            </p>
          </div>

          {failedSources.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {failedSources.map((source) => (
                <InlineNotice key={source} onRetry={() => void refetch()}>
                  {t(`feed.partial_${source}`)}
                </InlineNotice>
              ))}
            </div>
          )}

          <div id={RESULTS_ID} className={cn('transition-opacity duration-200', refreshing && 'opacity-50')}>
            {isLoading ? (
              <SkeletonGrid count={3} />
            ) : isError && items.length === 0 ? (
              <ErrorState title={t('search.errorTitle')} body={t('search.errorBody')} onRetry={() => void refetch()} retrying={isFetching} />
            ) : items.length === 0 ? (
              <StateView icon={<SearchX className="h-6 w-6" />} title={t('search.noResultsTitle', { query })} body={t('search.noResultsBody')} />
            ) : (
              <>
                <ContentGrid items={items} />
                <div ref={sentinelRef} className="flex justify-center py-8">
                  {isFetchingNextPage ? (
                    <Spinner />
                  ) : hasNextPage ? (
                    <Button variant="secondary" onClick={() => void fetchNextPage()}>
                      {t('feed.loadMore')}
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
