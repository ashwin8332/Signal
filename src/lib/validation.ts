import { z } from 'zod';
import {
  DEFAULT_PAGE_SIZE,
  HASHTAG_PATTERN,
  MAX_PAGE,
  MOVIE_GENRE_KEYS,
  NEWS_CATEGORIES,
  SEARCH_MAX_LENGTH,
} from './constants';

/**
 * Schemas shared by route handlers (request validation) and client forms, so
 * both sides agree on what is valid.
 */

/** Splits `a,b,c` into a de-duplicated, lower-cased, non-empty list. */
const csv = z
  .string()
  .transform((value) =>
    Array.from(
      new Set(
        value
          .split(',')
          .map((part) => part.trim().toLowerCase())
          .filter(Boolean),
      ),
    ),
  );

const page = z.coerce.number().int().min(1).max(MAX_PAGE).default(1);
const pageSize = z.coerce.number().int().min(1).max(30).default(DEFAULT_PAGE_SIZE);

export const newsQuerySchema = z.object({
  categories: csv.pipe(z.array(z.enum(NEWS_CATEGORIES)).min(1).max(NEWS_CATEGORIES.length)),
  page,
  pageSize,
});

export const recommendationsQuerySchema = z.object({
  genres: csv.pipe(
    z
      .array(z.enum(MOVIE_GENRE_KEYS))
      .min(1)
      .max(MOVIE_GENRE_KEYS.length),
  ),
  page,
  pageSize,
});

export const hashtagSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((tag) => tag.replace(/^#/, ''))
  .pipe(z.string().regex(HASHTAG_PATTERN));

export const socialQuerySchema = z.object({
  hashtags: csv.pipe(z.array(z.string().regex(HASHTAG_PATTERN)).min(1).max(10)),
  page,
  pageSize,
});

export const contentTypeFilter = z.enum(['all', 'news', 'movie', 'social']).default('all');

export const trendingQuerySchema = z.object({
  type: contentTypeFilter,
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(SEARCH_MAX_LENGTH),
  type: contentTypeFilter,
  page,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(200),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  bio: z.string().trim().max(160),
  avatarColor: z.enum(['indigo', 'sky', 'emerald', 'amber', 'rose', 'violet']),
});

/** A stored ContentItem (favorites in localStorage and in the database): https-only URLs, bounded sizes. */
export const contentItemSchema = z.object({
  id: z.string().max(300),
  type: z.enum(['news', 'movie', 'social']),
  title: z.string().max(500),
  summary: z.string().max(5000),
  imageUrl: z.string().url().startsWith('https://').nullable(),
  url: z.string().url().startsWith('https://'),
  source: z.string().max(200),
  author: z.string().max(200).nullable(),
  publishedAt: z.string().max(40),
  category: z.string().max(60),
  tags: z.array(z.string().max(60)).max(10),
  reason: z.string().max(100),
  metrics: z.object({ label: z.enum(['rating', 'likes', 'reads']), value: z.number() }).nullable(),
});

export const saveFavoriteSchema = z.object({ item: contentItemSchema });

/** Turns URLSearchParams into a plain object for zod. */
export function paramsToObject(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries());
}

/** Returns the URL only if it is a well-formed https URL, else null. */
export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Accepts only same-origin relative paths, which prevents open redirects via
 * `?next=`. `//evil.com` and `/\evil.com` are rejected because browsers treat
 * them as protocol-relative.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
    return fallback;
  }
  return value;
}
