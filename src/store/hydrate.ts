import { createAction } from '@reduxjs/toolkit';
import type { DeviceSettings, PersistedState } from './persistence';

/**
 * Dispatched once on the client after mount with whatever was validated out of
 * localStorage. Each persisted slice merges its part in extraReducers. Doing
 * this after mount (not in preloadedState) keeps the server render and first
 * client render identical, so there is no hydration mismatch.
 */
export const hydrateFromStorage = createAction<Partial<PersistedState>>('app/hydrateFromStorage');

/** Theme and language saved on this device; applied on every page, signed in or not. */
export const hydrateDevice = createAction<DeviceSettings>('app/hydrateDevice');

/**
 * The signed-in user changed (sign-out, or a different account). Per-user
 * slices reset to defaults so nothing leaks between accounts on one device.
 */
export const userSessionEnded = createAction('app/userSessionEnded');
