import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import type { ContentItem, ContentType, FeedPage, PageResponse, SearchResponse, TrendingResponse } from '@/types/content';
import type { MovieGenre, NewsCategory } from '@/lib/constants';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { interleave } from '@/lib/feed';
import { sessionExpired } from '@/features/auth/authSlice';

/**
 * Absolute base URL in the browser (and in jsdom tests), where Request needs
 * one. Queries only ever run on the client.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: typeof window === 'undefined' ? '/api' : `${window.location.origin}/api`,
  credentials: 'same-origin',
});

/** Turns a mid-session 401 into a `sessionExpired` action (SessionGuard redirects). */
const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extra) => {
  const result = await rawBaseQuery(args, api, extra);
  if (result.error?.status === 401) api.dispatch(sessionExpired());
  return result;
};

export interface FeedArgs {
  categories: NewsCategory[];
  genres: MovieGenre[];
  hashtags: string[];
}

export interface SearchArgs {
  q: string;
  type: 'all' | ContentType;
}

const csv = (values: readonly string[]) => values.join(',');

export const contentApi = createApi({
  reducerPath: 'contentApi',
  baseQuery,
  keepUnusedDataFor: 300,
  endpoints: (build) => ({
    /**
     * The unified feed. Each page fetches the enabled sources in parallel and
     * interleaves them. A failing source is reported in `failedSources` so the
     * UI can show the rest; only when every source fails does the page error.
     */
    getFeed: build.infiniteQuery<FeedPage, FeedArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      async queryFn({ queryArg, pageParam }, _api, _extra, fetchWithBQ) {
        const page = `page=${pageParam}&pageSize=${DEFAULT_PAGE_SIZE}`;
        const requests: { type: ContentType; url: string }[] = [];
        if (queryArg.categories.length) {
          requests.push({ type: 'news', url: `news?categories=${csv(queryArg.categories)}&${page}` });
        }
        if (queryArg.genres.length) {
          requests.push({ type: 'movie', url: `recommendations?genres=${csv(queryArg.genres)}&${page}` });
        }
        if (queryArg.hashtags.length) {
          requests.push({ type: 'social', url: `social?hashtags=${csv(queryArg.hashtags)}&${page}` });
        }

        const results = await Promise.all(requests.map((request) => fetchWithBQ(request.url)));
        const lists: ContentItem[][] = [];
        const failedSources: ContentType[] = [];
        const sources: FeedPage['sources'] = {};
        let hasMore = false;
        let firstError: FetchBaseQueryError | undefined;

        results.forEach((result, index) => {
          if (result.error) {
            failedSources.push(requests[index]!.type);
            firstError ??= result.error;
            return;
          }
          const data = result.data as PageResponse;
          sources[requests[index]!.type] = data.source;
          lists.push(data.items);
          hasMore ||= data.hasMore;
        });

        if (requests.length > 0 && failedSources.length === requests.length && firstError) {
          return { error: firstError };
        }
        return { data: { items: interleave(...lists), page: pageParam, hasMore, failedSources, sources } };
      },
    }),

    getTrending: build.query<ContentItem[], 'all' | ContentType>({
      query: (type) => `trending?type=${type}&limit=12`,
      transformResponse: (response: TrendingResponse) => response.items,
    }),

    search: build.infiniteQuery<SearchResponse, SearchArgs, number>({
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
      },
      query: ({ queryArg, pageParam }) => ({
        url: 'search',
        params: { q: queryArg.q, type: queryArg.type, page: pageParam },
      }),
    }),
  }),
});

export const { useGetFeedInfiniteQuery, useGetTrendingQuery, useSearchInfiniteQuery } = contentApi;
