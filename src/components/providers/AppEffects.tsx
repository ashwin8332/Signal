'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateDevice, hydrateFromStorage, userSessionEnded } from '@/store/hydrate';
import { loadDeviceSettings, loadPersistedState } from '@/store/persistence';
import { fetchFavorites } from '@/features/favorites/favoritesSync';

/**
 * Side effects that keep the document and the store in sync:
 * 1. load device settings (theme, language) once on mount,
 * 2. when a user signs in, load *their* saved data and favorites; when they
 *    sign out or switch accounts, reset per-user state so nothing leaks,
 * 3. apply the theme class (following the OS live for "system"),
 * 4. switch the i18n language and <html lang>.
 */
export function AppEffects() {
  const dispatch = useAppDispatch();
  const { i18n } = useTranslation();
  const deviceHydrated = useAppSelector((state) => state.ui.deviceHydrated);
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);
  const theme = useAppSelector((state) => state.preferences.theme);
  const language = useAppSelector((state) => state.preferences.language);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    dispatch(hydrateDevice(loadDeviceSettings()));
    // Marker for tests and tooling: the client app is live and interactive.
    document.documentElement.dataset.hydrated = 'true';
  }, [dispatch]);

  useEffect(() => {
    if (loadedFor.current === userId) return;
    if (loadedFor.current !== null) dispatch(userSessionEnded());
    loadedFor.current = userId;
    if (userId) {
      // Cached copy first (instant, offline), then the account's server list.
      dispatch(hydrateFromStorage(loadPersistedState(userId)));
      void dispatch(fetchFavorites());
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (!deviceHydrated) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [deviceHydrated, theme]);

  useEffect(() => {
    if (!deviceHydrated) return;
    if (i18n.language !== language) void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [deviceHydrated, language, i18n]);

  return null;
}
