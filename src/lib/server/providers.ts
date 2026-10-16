import 'server-only';
import type { ContentItem, ContentType } from '@/types/content';
import {
  MOVIE_GENRES,
  MOVIE_GENRE_KEYS,
  NEWS_CATEGORIES,
  SUGGESTED_HASHTAGS,
  type MovieGenre,
  type NewsCategory,
} from '@/lib/constants';
import { interleave, uniqueById } from '@/lib/feed';
import { safeHttpsUrl } from '@/lib/validation';
import { serverEnv } from './env';
import { mockNewsCorpus, mockNewsPage } from './mock/news';
import { mockMovieCorpus, mockMoviesPage } from './mock/movies';
import { mockSocialCorpus, mockSocialPage } from './mock/social';
import { slugify } from './mock/random';

export interface ProviderPage {
  items: ContentItem[];
  hasMore: boolean;
  source: 'live' | 'mock';
}

/** An upstream API failed. Surfaced to the client as 502 / partial failure. */
export class UpstreamError extends Error {
  constructor(
    public readonly provider: string,
    message: string,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

const UPSTREAM_TIMEOUT_MS = 8_000;
const CACHE_SECONDS = 300;

async function upstreamJson<T>(provider: string, url: URL, headers: Record<string, string>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json', ...headers },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      next: { revalidate: CACHE_SECONDS },
    });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'was unreachable';
    throw new UpstreamError(provider, `${provider} ${reason}`);
  }
  if (!response.ok) {
    // Status only: upstream bodies can echo request details, never log them.
    throw new UpstreamError(provider, `${provider} responded with ${response.status}`);
  }
  return (await response.json()) as T;
}

// ─── Live-or-demo with a cooldown ────────────────────────────────────────────

/** After an upstream failure (e.g. NewsAPI's 100-requests/day cap), stay on demo data this long. */
const COOLDOWN_MS = 15 * 60_000;
const cooldownUntil = new Map<string, number>();

/**
 * Runs `live` when the provider is configured and healthy; otherwise serves
 * `demo`. On an upstream failure it switches that provider to demo data for
 * 15 minutes instead of hammering a rate-limited API. Demo results carry
 * `source: 'mock'`, so the dashboard visibly stamps them DEMO DATA: it's a
 * labelled fallback, never a silent swap.
 */
async function liveOrDemo<C, T>(provider: string, credentials: C | null | undefined, demo: () => T, live: (credentials: C) => Promise<T>): Promise<T> {
  if (!credentials || (cooldownUntil.get(provider) ?? 0) > Date.now()) return demo();
  try {
    return await live(credentials);
  } catch (error) {
    if (!(error instanceof UpstreamError)) throw error;
    cooldownUntil.set(provider, Date.now() + COOLDOWN_MS);
    console.warn(`[providers] ${error.message}; serving demo data for 15 minutes.`);
    return demo();
  }
}

/** Test helper: forget cooldowns. */
export function resetProviderCooldowns(): void {
  cooldownUntil.clear();
}

// ─── News ────────────────────────────────────────────────────────────────────

interface NewsApiArticle {
  source?: { name?: string | null };
  author?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  urlToImage?: string | null;
  publishedAt?: string | null;
}

interface NewsApiResponse {
  status: string;
  totalResults?: number;
  articles?: NewsApiArticle[];
}

/** Maps a NewsAPI article, dropping removed or unsafe entries. */
export function normalizeNewsArticle(article: NewsApiArticle, category: string, reason: string): ContentItem | null {
  const url = safeHttpsUrl(article.url);
  const sourceName = article.source?.name?.trim() || 'News';
  // NewsAPI headlines usually end with " - <Outlet>", which the card already shows.
  const rawTitle = article.title?.trim();
  const title = rawTitle?.endsWith(` - ${sourceName}`) ? rawTitle.slice(0, -(sourceName.length + 3)).trim() : rawTitle;
  if (!url || !title || rawTitle === '[Removed]') return null;
  return {
    id: `news:${slugify(url).slice(-80)}`,
    type: 'news',
    title,
    summary: article.description?.trim() ?? '',
    imageUrl: safeHttpsUrl(article.urlToImage),
    url,
    source: sourceName,
    author: article.author?.trim() || null,
    publishedAt: article.publishedAt ?? new Date().toISOString(),
    category,
    tags: [category],
    reason,
    metrics: null,
  };
}

export function getNews(categories: NewsCategory[], page: number, pageSize: number): Promise<ProviderPage> {
  return liveOrDemo(
    'NewsAPI',
    serverEnv.newsApiKey,
    (): ProviderPage => ({ ...mockNewsPage(categories, page, pageSize), source: 'mock' }),
    (apiKey) => liveNews(apiKey, categories, page, pageSize),
  );
}

async function liveNews(apiKey: string, categories: NewsCategory[], page: number, pageSize: number): Promise<ProviderPage> {
  const perCategory = Math.max(1, Math.ceil(pageSize / categories.length));
  const results = await Promise.all(
    categories.map(async (category) => {
      const url = new URL('https://newsapi.org/v2/top-headlines');
      url.search = new URLSearchParams({
        category,
        country: 'us',
        page: String(page),
        pageSize: String(perCategory),
      }).toString();
      const data = await upstreamJson<NewsApiResponse>('NewsAPI', url, { 'X-Api-Key': apiKey });
      const items = (data.articles ?? [])
        .map((article) => normalizeNewsArticle(article, category, `category:${category}`))
        .filter((item): item is ContentItem => item !== null);
      return { items, hasMore: (data.totalResults ?? 0) > page * perCategory };
    }),
  );
  return {
    items: uniqueById(interleave(...results.map((result) => result.items))).slice(0, pageSize),
    hasMore: results.some((result) => result.hasMore),
    source: 'live',
  };
}

// ─── Movies (TMDB) ───────────────────────────────────────────────────────────

interface TmdbMovie {
  id: number;
  title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

interface TmdbList {
  page: number;
  total_pages: number;
  results: TmdbMovie[];
}

const TMDB_PAGE_SIZE = 20;
const GENRE_BY_ID = new Map<number, MovieGenre>(Object.entries(MOVIE_GENRES).map(([key, id]) => [id, key as MovieGenre]));

export function normalizeTmdbMovie(movie: TmdbMovie, preferredGenres: readonly MovieGenre[], reason?: string): ContentItem | null {
  if (!movie.title) return null;
  const genres = (movie.genre_ids ?? [])
    .map((id) => GENRE_BY_ID.get(id))
    .filter((genre): genre is MovieGenre => genre !== undefined);
  const matched = genres.find((genre) => preferredGenres.includes(genre)) ?? genres[0] ?? 'drama';
  const image = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : null;
  return {
    id: `movie:tmdb-${movie.id}`,
    type: 'movie',
    title: movie.title,
    summary: movie.overview ?? '',
    imageUrl: safeHttpsUrl(image),
    url: `https://www.themoviedb.org/movie/${movie.id}`,
    source: 'TMDB',
    author: null,
    publishedAt: movie.release_date ? new Date(movie.release_date).toISOString() : new Date().toISOString(),
    category: matched,
    tags: genres.slice(0, 3),
    reason: reason ?? `genre:${matched}`,
    metrics: typeof movie.vote_average === 'number' ? { label: 'rating', value: Math.round(movie.vote_average * 10) / 10 } : null,
  };
}

/**
 * TMDB accepts either a v4 read token (Bearer header) or a v3 API key (query
 * parameter). Returns null when neither is configured, which means mock data.
 * The URL carrying a v3 key is only ever used server-side and never logged.
 */
interface TmdbAuth {
  headers: Record<string, string>;
  params: Record<string, string>;
}

export function tmdbAuth(): TmdbAuth | null {
  if (serverEnv.tmdbToken) return { headers: { Authorization: `Bearer ${serverEnv.tmdbToken}` }, params: {} };
  if (serverEnv.tmdbApiKey) return { headers: {}, params: { api_key: serverEnv.tmdbApiKey } };
  return null;
}

function tmdbUrl(path: string, params: Record<string, string>): URL {
  const url = new URL(`https://api.themoviedb.org/3/${path}`);
  url.search = new URLSearchParams({ include_adult: 'false', language: 'en-US', ...params }).toString();
  return url;
}

/**
 * Our pages are `pageSize` long while TMDB's are fixed at 20, so map our
 * window onto the (at most two) TMDB pages that cover it.
 */
async function tmdbWindow(path: string, params: Record<string, string>, page: number, pageSize: number, auth: TmdbAuth) {
  const start = (page - 1) * pageSize;
  const firstPage = Math.floor(start / TMDB_PAGE_SIZE) + 1;
  const lastPage = Math.floor((start + pageSize - 1) / TMDB_PAGE_SIZE) + 1;
  const pages: TmdbList[] = [];
  for (let tmdbPage = firstPage; tmdbPage <= lastPage; tmdbPage += 1) {
    const data = await upstreamJson<TmdbList>('TMDB', tmdbUrl(path, { ...params, ...auth.params, page: String(tmdbPage) }), auth.headers);
    pages.push(data);
    if (tmdbPage >= data.total_pages) break;
  }
  const offset = start - (firstPage - 1) * TMDB_PAGE_SIZE;
  const movies = pages.flatMap((data) => data.results).slice(offset, offset + pageSize);
  const totalPages = pages[0]?.total_pages ?? 0;
  return { movies, hasMore: start + pageSize < Math.min(totalPages, 500) * TMDB_PAGE_SIZE };
}

export function getMovies(genres: MovieGenre[], page: number, pageSize: number): Promise<ProviderPage> {
  return liveOrDemo(
    'TMDB',
    tmdbAuth(),
    (): ProviderPage => ({ ...mockMoviesPage(genres, page, pageSize), source: 'mock' }),
    (auth) => liveMovies(auth, genres, page, pageSize),
  );
}

async function liveMovies(auth: TmdbAuth, genres: MovieGenre[], page: number, pageSize: number): Promise<ProviderPage> {
  const { movies, hasMore } = await tmdbWindow(
    'discover/movie',
    { with_genres: genres.map((genre) => MOVIE_GENRES[genre]).join('|'), sort_by: 'popularity.desc' },
    page,
    pageSize,
    auth,
  );
  return {
    items: movies.map((movie) => normalizeTmdbMovie(movie, genres)).filter((item): item is ContentItem => item !== null),
    hasMore,
    source: 'live',
  };
}

// ─── Social (mock API) ───────────────────────────────────────────────────────

export async function getSocial(hashtags: string[], page: number, pageSize: number): Promise<ProviderPage> {
  return { ...mockSocialPage(hashtags, page, pageSize), source: 'mock' };
}

// ─── Trending ────────────────────────────────────────────────────────────────

function byMetricDesc(a: ContentItem, b: ContentItem): number {
  return (b.metrics?.value ?? 0) - (a.metrics?.value ?? 0);
}

function trendingNews(limit: number): Promise<ContentItem[]> {
  return liveOrDemo(
    'NewsAPI',
    serverEnv.newsApiKey,
    () => mockNewsCorpus(NEWS_CATEGORIES, 4).sort(byMetricDesc).slice(0, limit),
    async (apiKey) => {
      // Top headlines are already ranked by NewsAPI.
      const url = new URL('https://newsapi.org/v2/top-headlines');
      url.search = new URLSearchParams({ country: 'us', pageSize: String(limit) }).toString();
      const data = await upstreamJson<NewsApiResponse>('NewsAPI', url, { 'X-Api-Key': apiKey });
      return (data.articles ?? [])
        .map((article) => normalizeNewsArticle(article, 'general', 'trending'))
        .filter((item): item is ContentItem => item !== null);
    },
  );
}

function trendingMovies(limit: number): Promise<ContentItem[]> {
  return liveOrDemo(
    'TMDB',
    tmdbAuth(),
    () => mockMovieCorpus(MOVIE_GENRE_KEYS, 3).sort(byMetricDesc).slice(0, limit),
    async (auth) => {
      const data = await upstreamJson<TmdbList>('TMDB', tmdbUrl('trending/movie/day', auth.params), auth.headers);
      return data.results
        .slice(0, limit)
        .map((movie) => normalizeTmdbMovie(movie, MOVIE_GENRE_KEYS, 'trending'))
        .filter((item): item is ContentItem => item !== null);
    },
  );
}

async function trendingSocial(limit: number): Promise<ContentItem[]> {
  return mockSocialCorpus(SUGGESTED_HASHTAGS, 4).sort(byMetricDesc).slice(0, limit);
}

const TRENDING_BY_TYPE: Record<ContentType, (limit: number) => Promise<ContentItem[]>> = {
  news: trendingNews,
  movie: trendingMovies,
  social: trendingSocial,
};

export async function getTrending(type: ContentType | 'all', limit: number): Promise<ContentItem[]> {
  const withReason = (items: ContentItem[]) => items.map((item) => ({ ...item, reason: 'trending' }));
  if (type !== 'all') return withReason(await TRENDING_BY_TYPE[type](limit));
  // One failing source never blanks the whole list.
  const settled = await Promise.allSettled([trendingNews(limit), trendingMovies(limit), trendingSocial(limit)]);
  const lists = settled.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
  if (lists.length === 0) throw (settled[0] as PromiseRejectedResult).reason;
  return withReason(interleave(...lists).slice(0, limit));
}

// ─── Search ──────────────────────────────────────────────────────────────────

export const SEARCH_PAGE_SIZE = 12;

/** Every whitespace-separated term must appear in the title, summary, tags or source. */
export function matchesQuery(item: ContentItem, query: string): boolean {
  const haystack = `${item.title} ${item.summary} ${item.tags.join(' ')} ${item.source}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term.replace(/^#/, '')));
}

function pageOf(items: ContentItem[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), hasMore: start + pageSize < items.length };
}

function searchNews(query: string, page: number): Promise<ProviderPage> {
  return liveOrDemo(
    'NewsAPI',
    serverEnv.newsApiKey,
    (): ProviderPage => {
      const matches = mockNewsCorpus(NEWS_CATEGORIES, 20).filter((item) => matchesQuery(item, query));
      return { ...pageOf(matches, page, SEARCH_PAGE_SIZE), source: 'mock' };
    },
    (apiKey) => liveSearchNews(apiKey, query, page),
  );
}

async function liveSearchNews(apiKey: string, query: string, page: number): Promise<ProviderPage> {
  const url = new URL('https://newsapi.org/v2/everything');
  url.search = new URLSearchParams({
    q: query,
    searchIn: 'title,description',
    sortBy: 'relevancy',
    language: 'en',
    page: String(page),
    pageSize: String(SEARCH_PAGE_SIZE),
  }).toString();
  const data = await upstreamJson<NewsApiResponse>('NewsAPI', url, { 'X-Api-Key': apiKey });
  return {
    items: (data.articles ?? [])
      .map((article) => normalizeNewsArticle(article, 'general', 'search'))
      .filter((item): item is ContentItem => item !== null),
    hasMore: (data.totalResults ?? 0) > page * SEARCH_PAGE_SIZE,
    source: 'live',
  };
}

function searchMovies(query: string, page: number): Promise<ProviderPage> {
  return liveOrDemo(
    'TMDB',
    tmdbAuth(),
    (): ProviderPage => {
      const matches = mockMovieCorpus(MOVIE_GENRE_KEYS, 12).filter((item) => matchesQuery(item, query));
      return { ...pageOf(matches, page, SEARCH_PAGE_SIZE), source: 'mock' };
    },
    (auth) => liveSearchMovies(auth, query, page),
  );
}

async function liveSearchMovies(auth: TmdbAuth, query: string, page: number): Promise<ProviderPage> {
  const { movies, hasMore } = await tmdbWindow('search/movie', { query }, page, SEARCH_PAGE_SIZE, auth);
  return {
    items: movies
      .map((movie) => normalizeTmdbMovie(movie, MOVIE_GENRE_KEYS, 'search'))
      .filter((item): item is ContentItem => item !== null),
    hasMore,
    source: 'live',
  };
}

async function searchSocial(query: string, page: number): Promise<ProviderPage> {
  const matches = mockSocialCorpus(SUGGESTED_HASHTAGS, 12).filter((item) => matchesQuery(item, query));
  return { ...pageOf(matches, page, SEARCH_PAGE_SIZE), source: 'mock' };
}

const SEARCH_BY_TYPE: Record<ContentType, (query: string, page: number) => Promise<ProviderPage>> = {
  news: searchNews,
  movie: searchMovies,
  social: searchSocial,
};

export async function searchContent(query: string, type: ContentType | 'all', page: number) {
  const types: ContentType[] = type === 'all' ? ['news', 'movie', 'social'] : [type];
  const settled = await Promise.allSettled(types.map((contentType) => SEARCH_BY_TYPE[contentType](query, page)));
  const failedSources: ContentType[] = [];
  const lists: ContentItem[][] = [];
  let hasMore = false;
  let live = false;
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      lists.push(result.value.items.map((item) => ({ ...item, reason: 'search' })));
      hasMore ||= result.value.hasMore;
      live ||= result.value.source === 'live';
    } else {
      failedSources.push(types[index] as ContentType);
    }
  });
  return {
    items: interleave(...lists),
    hasMore,
    failedSources,
    allFailed: failedSources.length === types.length,
    source: (live ? 'live' : 'mock') as 'live' | 'mock',
  };
}
