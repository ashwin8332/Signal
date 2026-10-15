import { describe, expect, it } from 'vitest';
import type { PreferencesState } from '@/features/preferences/preferencesSlice';
import preferences, {
  addHashtag,
  defaultPreferences,
  removeHashtag,
  resetInterests,
  restoreInterests,
  toggleCategory,
  toggleGenre,
  MAX_HASHTAGS,
} from '@/features/preferences/preferencesSlice';
import favorites, { removeFavorite, restoreFavorite, toggleFavorite, MAX_FAVORITES } from '@/features/favorites/favoritesSlice';
import feed, { flushPending, moveItem, receiveLiveItem, resetOrder } from '@/features/feed/feedSlice';
import auth, { login, sessionExpired } from '@/features/auth/authSlice';
import { hydrateFromStorage } from '@/store/hydrate';
import { makeItem } from '../fixtures';

const init = { type: '@@init' };

describe('preferences slice', () => {
  it('toggles categories but never removes the last one', () => {
    let state: PreferencesState = { ...defaultPreferences, categories: ['technology'] };
    state = preferences(state, toggleCategory('technology'));
    expect(state.categories).toEqual(['technology']);
    state = preferences(state, toggleCategory('sports'));
    expect(state.categories).toEqual(['technology', 'sports']);
    state = preferences(state, toggleCategory('technology'));
    expect(state.categories).toEqual(['sports']);
  });

  it('allows emptying genres (switches the film source off)', () => {
    let state: PreferencesState = { ...defaultPreferences, genres: ['drama'] };
    state = preferences(state, toggleGenre('drama'));
    expect(state.genres).toEqual([]);
  });

  it('normalizes hashtags and ignores invalid ones, duplicates and overflow', () => {
    let state: PreferencesState = { ...defaultPreferences, hashtags: [] };
    state = preferences(state, addHashtag('#Climate'));
    state = preferences(state, addHashtag('climate'));
    state = preferences(state, addHashtag('not valid!'));
    expect(state.hashtags).toEqual(['climate']);

    state = { ...state, hashtags: Array.from({ length: MAX_HASHTAGS }, (_, index) => `tag${index}`) };
    expect(preferences(state, addHashtag('one_more')).hashtags).toHaveLength(MAX_HASHTAGS);
    expect(preferences(state, removeHashtag('tag0')).hashtags).not.toContain('tag0');
  });

  it('reset restores default interests but keeps theme and language; undo restores them', () => {
    const custom = { ...defaultPreferences, categories: ['health' as const], theme: 'dark' as const, language: 'fr' as const };
    const reset = preferences(custom, resetInterests());
    expect(reset.categories).toEqual(defaultPreferences.categories);
    expect(reset.theme).toBe('dark');
    expect(reset.language).toBe('fr');
    const undone = preferences(reset, restoreInterests({ categories: ['health'], genres: [], hashtags: [] }));
    expect(undone.categories).toEqual(['health']);
  });

  it('merges hydrated preferences', () => {
    const state = preferences(undefined, hydrateFromStorage({ preferences: { ...defaultPreferences, theme: 'dark' } }));
    expect(state.theme).toBe('dark');
  });
});

describe('favorites slice', () => {
  it('toggles an item on (newest first) and off', () => {
    const a = makeItem();
    const b = makeItem();
    let state = favorites(undefined, toggleFavorite(a));
    state = favorites(state, toggleFavorite(b));
    expect(state.ids).toEqual([b.id, a.id]);
    expect(state.entities[a.id]).toEqual(a);
    state = favorites(state, toggleFavorite(a));
    expect(state.ids).toEqual([b.id]);
    expect(state.entities[a.id]).toBeUndefined();
  });

  it('undo restores a removed item at its old position, once', () => {
    const [a, b, c] = [makeItem(), makeItem(), makeItem()];
    let state = [a, b, c].reduce((current, item) => favorites(current, toggleFavorite(item)), favorites(undefined, init));
    expect(state.ids).toEqual([c.id, b.id, a.id]);
    state = favorites(state, removeFavorite(b.id));
    state = favorites(state, restoreFavorite({ item: b, index: 1 }));
    state = favorites(state, restoreFavorite({ item: b, index: 1 }));
    expect(state.ids).toEqual([c.id, b.id, a.id]);
  });

  it('caps the number of stored favorites', () => {
    let state = favorites(undefined, init);
    for (let index = 0; index < MAX_FAVORITES + 5; index += 1) state = favorites(state, toggleFavorite(makeItem()));
    expect(state.ids).toHaveLength(MAX_FAVORITES);
    expect(Object.keys(state.entities)).toHaveLength(MAX_FAVORITES);
  });
});

describe('feed slice', () => {
  it('saves the order after a move and resets it', () => {
    let state = feed(undefined, moveItem({ visibleIds: ['a', 'b', 'c'], from: 2, to: 0 }));
    expect(state.order).toEqual(['c', 'a', 'b']);
    state = feed(state, resetOrder());
    expect(state.order).toEqual([]);
  });

  it('ignores no-op moves', () => {
    const state = feed(undefined, moveItem({ visibleIds: ['a', 'b'], from: 1, to: 1 }));
    expect(state.order).toEqual([]);
  });

  it('queues live items without duplicates and flushes them to the top of a custom order', () => {
    const post = makeItem({ type: 'social' });
    let state = feed({ order: ['x', 'y'], sourceFilter: 'all', pending: [], live: [], streamStatus: 'off' }, receiveLiveItem(post));
    state = feed(state, receiveLiveItem(post));
    expect(state.pending).toHaveLength(1);
    state = feed(state, flushPending());
    expect(state.pending).toEqual([]);
    expect(state.live).toEqual([post]);
    expect(state.order).toEqual([post.id, 'x', 'y']);
    // Once shown, the same post is not queued again.
    expect(feed(state, receiveLiveItem(post)).pending).toEqual([]);
  });

  it('hydrates only the saved order', () => {
    const state = feed(undefined, hydrateFromStorage({ feed: { order: ['a'] } }));
    expect(state.order).toEqual(['a']);
    expect(state.pending).toEqual([]);
  });
});

describe('auth slice', () => {
  it('stores the user on login and the server message on failure', () => {
    const user = { id: 'u1', name: 'Ana', email: 'ana@example.com' };
    let state = auth(undefined, { type: login.pending.type });
    expect(state.status).toBe('loading');
    state = auth(state, { type: login.fulfilled.type, payload: user });
    expect(state).toMatchObject({ status: 'authenticated', user });
    state = auth(state, { type: login.rejected.type, payload: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    expect(state).toMatchObject({ status: 'unauthenticated', error: 'Email or password is incorrect.' });
  });

  it('marks an expired session', () => {
    const state = auth(undefined, sessionExpired());
    expect(state).toMatchObject({ status: 'unauthenticated', sessionExpired: true, user: null });
  });
});
