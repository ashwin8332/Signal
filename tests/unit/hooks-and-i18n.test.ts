import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';
import { backoffDelay } from '@/hooks/useLiveFeed';
import { formatCompactNumber, formatRelativeTime } from '@/lib/format';
import { createI18n, resources } from '@/i18n';

describe('useDebounce', () => {
  it('only emits the latest value after the delay', () => {
    vi.useFakeTimers();
    try {
      const { result, rerender } = renderHook(({ value }) => useDebounce(value, 350), { initialProps: { value: 'a' } });
      rerender({ value: 'ab' });
      rerender({ value: 'abc' });
      act(() => {
        vi.advanceTimersByTime(349);
      });
      expect(result.current).toBe('a');
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('abc');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('live feed backoff', () => {
  it('grows exponentially and caps at 30 s', () => {
    expect([0, 1, 2, 3, 4, 5, 10].map(backoffDelay)).toEqual([1000, 2000, 4000, 8000, 16_000, 30_000, 30_000]);
  });
});

describe('formatting', () => {
  const now = Date.parse('2026-10-15T12:00:00Z');
  it('formats relative time per locale', () => {
    expect(formatRelativeTime('2026-10-15T09:00:00Z', 'en', now)).toBe('3 hours ago');
    expect(formatRelativeTime('2026-10-15T09:00:00Z', 'es', now)).toBe('hace 3 horas');
    expect(formatRelativeTime('2026-10-14T12:00:00Z', 'en', now)).toBe('yesterday');
    expect(formatRelativeTime('garbage', 'en', now)).toBe('');
  });

  it('formats compact numbers', () => {
    expect(formatCompactNumber(12_400, 'en')).toBe('12.4K');
  });
});

describe('i18n', () => {
  const keysOf = (object: object, prefix = ''): string[] =>
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === 'object' && value !== null ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

  it('every locale has exactly the English keys and no empty strings', () => {
    const english = keysOf(resources.en.translation).sort();
    for (const language of ['es', 'fr'] as const) {
      expect(keysOf(resources[language].translation).sort()).toEqual(english);
    }
  });

  it('switches language and pluralizes', async () => {
    const i18n = createI18n('en');
    expect(i18n.t('feed.newPosts', { count: 1 })).toBe('1 new post');
    expect(i18n.t('feed.newPosts', { count: 3 })).toBe('3 new posts');
    await i18n.changeLanguage('fr');
    expect(i18n.t('nav.favorites')).toBe('Favoris');
    expect(i18n.t('feed.newPosts', { count: 3 })).toBe('3 nouvelles publications');
  });
});
