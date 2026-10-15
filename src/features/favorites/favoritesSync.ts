import { createAsyncThunk, type ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import type { ContentItem } from '@/types/content';
import type { RootState } from '@/store';
import { showToast } from '@/features/ui/uiSlice';
import { removeFavorite, restoreFavorite, setFavorites, toggleFavorite } from './favoritesSlice';

/**
 * Favorites belong to the account: the server keeps one list per user (in
 * Supabase when configured). The UI updates optimistically; these helpers
 * keep the server in step and pull the server's list after sign-in.
 */

async function send(method: 'PUT' | 'DELETE', item: ContentItem | string): Promise<boolean> {
  try {
    const response =
      method === 'PUT'
        ? await fetch('/api/favorites', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item }),
            credentials: 'same-origin',
          })
        : await fetch(`/api/favorites?id=${encodeURIComponent(item as string)}`, { method, credentials: 'same-origin' });
    return response.ok;
  } catch {
    return false;
  }
}

/** Loads the signed-in user's favorites from the server, replacing the local cache. */
export const fetchFavorites = createAsyncThunk('favorites/fetch', async (_, { dispatch }) => {
  const response = await fetch('/api/favorites', { credentials: 'same-origin' }).catch(() => null);
  if (!response?.ok) return; // keep the cached copy (offline or storage down)
  const data = (await response.json()) as { items: ContentItem[] };
  dispatch(setFavorites(data.items));
});

export function registerFavoritesSync(listener: ListenerMiddlewareInstance<RootState>) {
  const failed = (api: { dispatch: (action: unknown) => unknown }) =>
    api.dispatch(showToast({ message: 'favorites.syncError', tone: 'error' }));

  listener.startListening({
    actionCreator: toggleFavorite,
    effect: async (action, api) => {
      if (!api.getState().auth.user) return;
      const wasSaved = Boolean(api.getOriginalState().favorites.entities[action.payload.id]);
      const ok = wasSaved ? await send('DELETE', action.payload.id) : await send('PUT', action.payload);
      if (!ok) failed(api);
    },
  });
  listener.startListening({
    actionCreator: restoreFavorite,
    effect: async (action, api) => {
      if (!api.getState().auth.user) return;
      if (!(await send('PUT', action.payload.item))) failed(api);
    },
  });
  listener.startListening({
    actionCreator: removeFavorite,
    effect: async (action, api) => {
      if (!api.getState().auth.user) return;
      if (!(await send('DELETE', action.payload))) failed(api);
    },
  });
}
