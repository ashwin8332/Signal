import { isAnyOf, type ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import { restoreFavorite, toggleFavorite } from '@/features/favorites/favoritesSlice';
import { flushPending, moveItem, resetOrder } from '@/features/feed/feedSlice';
import {
  addHashtag,
  removeHashtag,
  resetInterests,
  restoreInterests,
  setLanguage,
  setTheme,
  toggleCategory,
  toggleGenre,
} from '@/features/preferences/preferencesSlice';
import { logActivity } from './activitySlice';
import type { RootState } from '@/store';

/**
 * Turns meaningful user actions into session-log entries, keeping that
 * bookkeeping out of components and reducers.
 */
export function registerActivityListener(listener: ListenerMiddlewareInstance<RootState>) {
  listener.startListening({
    actionCreator: toggleFavorite,
    effect: (action, api) => {
      const wasSaved = Boolean(api.getOriginalState().favorites.entities[action.payload.id]);
      api.dispatch(logActivity(wasSaved ? 'removed' : 'saved', { title: action.payload.title }));
    },
  });
  listener.startListening({
    actionCreator: restoreFavorite,
    effect: (action, api) => {
      api.dispatch(logActivity('restored', { title: action.payload.item.title }));
    },
  });
  listener.startListening({
    actionCreator: moveItem,
    effect: (_action, api) => {
      api.dispatch(logActivity('reordered'));
    },
  });
  listener.startListening({
    actionCreator: resetOrder,
    effect: (_action, api) => {
      api.dispatch(logActivity('orderReset'));
    },
  });
  listener.startListening({
    matcher: isAnyOf(toggleCategory, toggleGenre, addHashtag, removeHashtag, resetInterests, restoreInterests),
    effect: (_action, api) => {
      const { categories, genres, hashtags } = api.getState().preferences;
      api.dispatch(logActivity('interests', { count: categories.length + genres.length + hashtags.length }));
    },
  });
  listener.startListening({
    actionCreator: flushPending,
    effect: (_action, api) => {
      const count = api.getOriginalState().feed.pending.length;
      if (count > 0) api.dispatch(logActivity('live', { count }));
    },
  });
  listener.startListening({
    actionCreator: setTheme,
    effect: (action, api) => {
      api.dispatch(logActivity('theme', { value: action.payload }));
    },
  });
  listener.startListening({
    actionCreator: setLanguage,
    effect: (action, api) => {
      api.dispatch(logActivity('language', { value: action.payload }));
    },
  });
}
