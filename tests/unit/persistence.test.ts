import { describe, expect, it, vi } from 'vitest';
import {
  loadDeviceSettings,
  loadPersistedState,
  saveDeviceSettings,
  savePersistedState,
  type PersistableState,
} from '@/store/persistence';
import { makeStore } from '@/store';
import { hydrateFromStorage, userSessionEnded } from '@/store/hydrate';
import { defaultPreferences, setLanguage, setTheme, toggleCategory } from '@/features/preferences/preferencesSlice';
import { toggleFavorite } from '@/features/favorites/favoritesSlice';
import { hydrateDevice } from '@/store/hydrate';
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY, userStorageKey } from '@/lib/constants';
import { makeItem } from '../fixtures';

const emptyState = (): PersistableState => ({
  preferences: defaultPreferences,
  favorites: { ids: [], entities: {} },
  feed: { order: [] },
  profile: { displayName: null, bio: '', avatarColor: 'indigo' },
});

describe('per-user persistence', () => {
  it('returns {} when nothing is stored or the JSON is corrupt', () => {
    expect(loadPersistedState('u1')).toEqual({});
    localStorage.setItem(userStorageKey('u1'), '{not json');
    expect(loadPersistedState('u1')).toEqual({});
    localStorage.setItem(userStorageKey('u1'), '"a string"');
    expect(loadPersistedState('u1')).toEqual({});
  });

  it('keeps each user’s data separate on the same device', () => {
    const item = makeItem();
    savePersistedState('alice', { ...emptyState(), favorites: { ids: [item.id], entities: { [item.id]: item } } });
    savePersistedState('bob', emptyState());
    expect(loadPersistedState('alice').favorites?.ids).toEqual([item.id]);
    expect(loadPersistedState('bob').favorites?.ids).toEqual([]);
  });

  it('stores interests only, never theme or language, in the user snapshot', () => {
    savePersistedState('u1', { ...emptyState(), preferences: { ...defaultPreferences, theme: 'dark', language: 'fr' } });
    const raw = JSON.parse(localStorage.getItem(userStorageKey('u1'))!);
    expect(raw.preferences).not.toHaveProperty('theme');
    expect(raw.preferences).not.toHaveProperty('language');
  });

  it('drops only the invalid slice and keeps the valid ones', () => {
    localStorage.setItem(
      userStorageKey('u1'),
      JSON.stringify({
        preferences: { ...defaultPreferences, categories: ['not-a-category'] },
        feed: { order: ['a', 'b'] },
        profile: { displayName: 'Ana', bio: '', avatarColor: 'rose' },
      }),
    );
    const state = loadPersistedState('u1');
    expect(state.preferences).toBeUndefined();
    expect(state.feed).toEqual({ order: ['a', 'b'] });
    expect(state.profile?.avatarColor).toBe('rose');
  });

  it('rejects favorites with unsafe URLs and repairs ids/entities drift', () => {
    const good = makeItem();
    const evil = makeItem({ url: 'javascript:alert(1)' });
    localStorage.setItem(userStorageKey('u1'), JSON.stringify({ favorites: { ids: [good.id, 'missing'], entities: { [good.id]: good } } }));
    expect(loadPersistedState('u1').favorites).toEqual({ ids: [good.id], entities: { [good.id]: good } });
    localStorage.setItem(userStorageKey('u1'), JSON.stringify({ favorites: { ids: [evil.id], entities: { [evil.id]: evil } } }));
    expect(loadPersistedState('u1').favorites).toBeUndefined();
  });

  it('survives storage that throws (e.g. disabled in private mode)', () => {
    const storage = { getItem: () => { throw new Error('denied'); } };
    expect(loadPersistedState('u1', storage as unknown as Storage)).toEqual({});
    expect(loadDeviceSettings(storage as unknown as Storage)).toEqual({});
    const failing = { setItem: vi.fn(() => { throw new Error('QuotaExceededError'); }) };
    expect(() => savePersistedState('u1', emptyState(), failing as unknown as Storage)).not.toThrow();
    expect(() => saveDeviceSettings({ theme: 'dark', language: 'de' }, failing as unknown as Storage)).not.toThrow();
  });
});

describe('device settings', () => {
  it('round-trips theme and language and ignores unknown values', () => {
    saveDeviceSettings({ theme: 'dark', language: 'hi' });
    expect(loadDeviceSettings()).toEqual({ theme: 'dark', language: 'hi' });
    localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'xx');
    expect(loadDeviceSettings()).toEqual({ theme: undefined, language: undefined });
  });
});

describe('persistence listeners', () => {
  const signIn = (store: ReturnType<typeof makeStore>, id: string) =>
    store.dispatch({ type: 'auth/fetchSession/fulfilled', payload: { id, name: id, email: `${id}@example.com` } });

  it('saves the signed-in user’s data after hydration, debounced', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
    try {
      const store = makeStore();
      signIn(store, 'u1');
      store.dispatch(hydrateFromStorage({}));
      store.dispatch(toggleCategory('health'));
      expect(localStorage.getItem(userStorageKey('u1'))).toBeNull();
      await vi.advanceTimersByTimeAsync(300);
      expect(loadPersistedState('u1').preferences?.categories).toContain('health');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not write before hydration (so defaults never overwrite saved data)', async () => {
    vi.useFakeTimers();
    try {
      const store = makeStore();
      signIn(store, 'u1');
      store.dispatch(toggleCategory('health'));
      await vi.advanceTimersByTimeAsync(300);
      expect(localStorage.getItem(userStorageKey('u1'))).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('saves device settings immediately once read', () => {
    const store = makeStore();
    store.dispatch(hydrateDevice({}));
    store.dispatch(setTheme('dark'));
    store.dispatch(setLanguage('pt'));
    expect(loadDeviceSettings()).toEqual({ theme: 'dark', language: 'pt' });
  });

  it('clears per-user state on sign-out but keeps device settings', () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
    const store = makeStore();
    signIn(store, 'u1');
    store.dispatch(hydrateFromStorage({}));
    store.dispatch(setTheme('dark'));
    store.dispatch(toggleFavorite(makeItem()));
    store.dispatch(toggleCategory('health'));
    store.dispatch(userSessionEnded());
    const state = store.getState();
    expect(state.favorites.ids).toEqual([]);
    expect(state.preferences.categories).toEqual(defaultPreferences.categories);
    expect(state.preferences.theme).toBe('dark');
    expect(state.ui.hydrated).toBe(false);
  });
});
