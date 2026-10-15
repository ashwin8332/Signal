import type { ContentType } from '@/types/content';

/** NewsAPI top-headline categories. "Finance" is served by `business`. */
export const NEWS_CATEGORIES = [
  'technology',
  'business',
  'sports',
  'science',
  'health',
  'entertainment',
  'general',
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Film genres we expose, mapped to TMDB genre ids. */
export const MOVIE_GENRES = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  horror: 27,
  romance: 10749,
  'science-fiction': 878,
  thriller: 53,
} as const;
export type MovieGenre = keyof typeof MOVIE_GENRES;
export const MOVIE_GENRE_KEYS = Object.keys(MOVIE_GENRES) as [MovieGenre, ...MovieGenre[]];

export const SUGGESTED_HASHTAGS = [
  'ai',
  'webdev',
  'football',
  'markets',
  'space',
  'climate',
  'gaming',
  'design',
] as const;

export const HASHTAG_PATTERN = /^[a-z0-9_]{2,30}$/;

export const CONTENT_TYPES: readonly ContentType[] = ['news', 'movie', 'social'];

export const DEFAULT_PAGE_SIZE = 9;
export const MAX_PAGE = 20;
export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_DEBOUNCE_MS = 350;

export const SESSION_COOKIE = 'signal_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/** Per-user localStorage key (versioned): interests, favorites cache, feed order, profile. */
export const USER_STORAGE_PREFIX = 'signal:v2:user:';
export const userStorageKey = (userId: string) => `${USER_STORAGE_PREFIX}${userId}`;
/** Device-level keys read by the pre-paint script (shared by everyone on this browser). */
export const THEME_STORAGE_KEY = 'signal:theme';
export const LANGUAGE_STORAGE_KEY = 'signal:lang';
