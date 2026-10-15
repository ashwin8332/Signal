import { describe, expect, it } from 'vitest';
import {
  hashtagSchema,
  newsQuerySchema,
  recommendationsQuerySchema,
  safeHttpsUrl,
  safeRedirectPath,
  searchQuerySchema,
  signupSchema,
} from '@/lib/validation';

describe('query schemas', () => {
  it('parses csv categories, de-duplicates and lower-cases them, and applies paging defaults', () => {
    const result = newsQuerySchema.parse({ categories: 'Technology, sports,technology' });
    expect(result).toEqual({ categories: ['technology', 'sports'], page: 1, pageSize: 9 });
  });

  it('rejects unknown categories, empty lists and out-of-range pages', () => {
    expect(newsQuerySchema.safeParse({ categories: 'hacking' }).success).toBe(false);
    expect(newsQuerySchema.safeParse({ categories: '' }).success).toBe(false);
    expect(newsQuerySchema.safeParse({ categories: 'sports', page: '0' }).success).toBe(false);
    expect(newsQuerySchema.safeParse({ categories: 'sports', page: '21' }).success).toBe(false);
    expect(newsQuerySchema.safeParse({ categories: 'sports', pageSize: '100' }).success).toBe(false);
  });

  it('only accepts known film genres', () => {
    expect(recommendationsQuerySchema.parse({ genres: 'drama,science-fiction' }).genres).toEqual(['drama', 'science-fiction']);
    expect(recommendationsQuerySchema.safeParse({ genres: 'drama,<script>' }).success).toBe(false);
  });

  it('trims search queries and enforces the 1–100 length bound', () => {
    expect(searchQuerySchema.parse({ q: '  ai  ' })).toEqual({ q: 'ai', type: 'all', page: 1 });
    expect(searchQuerySchema.safeParse({ q: '   ' }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'x'.repeat(101) }).success).toBe(false);
    expect(searchQuerySchema.safeParse({ q: 'ai', type: 'podcast' }).success).toBe(false);
  });
});

describe('hashtagSchema', () => {
  it.each([
    ['#AI', 'ai'],
    ['  web_dev ', 'web_dev'],
    ['f1', 'f1'],
  ])('normalizes %j to %j', (input, expected) => {
    expect(hashtagSchema.parse(input)).toBe(expected);
  });

  it.each(['a', '#', 'has space', 'émoji', 'x'.repeat(31), 'drop;table'])('rejects %j', (input) => {
    expect(hashtagSchema.safeParse(input).success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('requires a name, a valid email and an 8+ character password', () => {
    expect(signupSchema.safeParse({ name: 'Ana', email: 'ANA@Example.com ', password: '12345678' })).toMatchObject({
      success: true,
      data: { email: 'ana@example.com' },
    });
    expect(signupSchema.safeParse({ name: '', email: 'ana@example.com', password: '12345678' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Ana', email: 'not-an-email', password: '12345678' }).success).toBe(false);
    expect(signupSchema.safeParse({ name: 'Ana', email: 'ana@example.com', password: 'short' }).success).toBe(false);
  });
});

describe('safeHttpsUrl', () => {
  it('keeps https URLs', () => {
    expect(safeHttpsUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
  });

  it.each(['http://example.com', 'javascript:alert(1)', 'data:text/html,hi', '//example.com', 'not a url', null, 42])(
    'drops %j',
    (value) => {
      expect(safeHttpsUrl(value)).toBeNull();
    },
  );
});

describe('safeRedirectPath (open-redirect guard)', () => {
  it('allows same-origin relative paths', () => {
    expect(safeRedirectPath('/favorites')).toBe('/favorites');
    expect(safeRedirectPath('/search?q=ai')).toBe('/search?q=ai');
  });

  it.each(['https://evil.com', '//evil.com', '/\\evil.com', 'evil.com', '', null, undefined])('falls back for %j', (value) => {
    expect(safeRedirectPath(value)).toBe('/');
  });
});
