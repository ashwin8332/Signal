import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ContentItem } from '@/types/content';
import { hydrateFromStorage, userSessionEnded } from '@/store/hydrate';

/**
 * Favorites store a full snapshot of each item, so the Favorites page renders
 * instantly and offline even when the item has dropped out of the feed.
 */
export interface FavoritesState {
  /** Most recently saved first. */
  ids: string[];
  entities: Record<string, ContentItem>;
}

const initialState: FavoritesState = { ids: [], entities: {} };

export const MAX_FAVORITES = 200;

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    toggleFavorite(state, action: PayloadAction<ContentItem>) {
      const item = action.payload;
      if (state.entities[item.id]) {
        delete state.entities[item.id];
        state.ids = state.ids.filter((id) => id !== item.id);
        return;
      }
      state.entities[item.id] = item;
      state.ids.unshift(item.id);
      // Bound localStorage growth: drop the oldest beyond the cap.
      for (const dropped of state.ids.splice(MAX_FAVORITES)) delete state.entities[dropped];
    },
    removeFavorite(state, action: PayloadAction<string>) {
      delete state.entities[action.payload];
      state.ids = state.ids.filter((id) => id !== action.payload);
    },
    /** Replaces everything with the server's list (newest first): the account is the source of truth. */
    setFavorites(_state, action: PayloadAction<ContentItem[]>) {
      const items = action.payload.slice(0, MAX_FAVORITES);
      return { ids: items.map((item) => item.id), entities: Object.fromEntries(items.map((item) => [item.id, item])) };
    },
    /** Undo for a removal: puts the item back where it was. */
    restoreFavorite(state, action: PayloadAction<{ item: ContentItem; index: number }>) {
      const { item, index } = action.payload;
      if (state.entities[item.id]) return;
      state.entities[item.id] = item;
      state.ids.splice(Math.min(Math.max(index, 0), state.ids.length), 0, item.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFromStorage, (state, action) => action.payload.favorites ?? state)
      .addCase(userSessionEnded, () => initialState);
  },
});

export const { toggleFavorite, removeFavorite, restoreFavorite, setFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
