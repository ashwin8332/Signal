import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import preferences from '@/features/preferences/preferencesSlice';
import favorites from '@/features/favorites/favoritesSlice';
import feed from '@/features/feed/feedSlice';
import auth from '@/features/auth/authSlice';
import profile from '@/features/profile/profileSlice';
import ui from '@/features/ui/uiSlice';
import activity from '@/features/activity/activitySlice';
import { registerActivityListener } from '@/features/activity/activityListener';
import { contentApi } from '@/services/contentApi';
import { saveDeviceSettings, savePersistedState } from './persistence';
import { registerFavoritesSync } from '@/features/favorites/favoritesSync';

export const rootReducer = combineReducers({
  preferences,
  favorites,
  feed,
  auth,
  profile,
  ui,
  activity,
  [contentApi.reducerPath]: contentApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;

const PERSIST_DEBOUNCE_MS = 250;

export function makeStore(preloadedState?: Partial<RootState>) {
  const persistence = createListenerMiddleware<RootState>();

  // Save whenever a persisted slice changes, at most once per 250 ms burst
  // (dragging fires many moveItem actions in a row).
  persistence.startListening({
    // Per-user data: only once that user's saved data is loaded, so defaults never overwrite it.
    predicate: (_action, current, previous) =>
      current.ui.hydrated &&
      current.auth.user !== null &&
      (current.preferences !== previous.preferences ||
        current.favorites !== previous.favorites ||
        current.feed.order !== previous.feed.order ||
        current.profile !== previous.profile),
    effect: async (_action, api) => {
      api.cancelActiveListeners();
      await api.delay(PERSIST_DEBOUNCE_MS);
      const state = api.getState();
      if (state.auth.user) savePersistedState(state.auth.user.id, state);
    },
  });
  persistence.startListening({
    // Device settings: saved immediately (the pre-paint script reads them).
    predicate: (_action, current, previous) =>
      current.ui.deviceHydrated &&
      (current.preferences.theme !== previous.preferences.theme || current.preferences.language !== previous.preferences.language),
    effect: (_action, api) => {
      const { theme, language } = api.getState().preferences;
      saveDeviceSettings({ theme, language });
    },
  });
  registerFavoritesSync(persistence);

  const activityLog = createListenerMiddleware<RootState>();
  registerActivityListener(activityLog);

  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(persistence.middleware, activityLog.middleware).concat(contentApi.middleware),
  });
  // Enables refetchOnFocus / refetchOnReconnect.
  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
