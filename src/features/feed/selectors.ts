import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import type { FeedArgs } from '@/services/contentApi';

/**
 * Memoized so the RTK Query argument keeps its identity between renders and
 * only changes, triggering a refetch, when an interest actually changes.
 */
export const selectFeedArgs = createSelector(
  [
    (state: RootState) => state.preferences.categories,
    (state: RootState) => state.preferences.genres,
    (state: RootState) => state.preferences.hashtags,
  ],
  (categories, genres, hashtags): FeedArgs => ({ categories, genres, hashtags }),
);

export const selectDisplayName = (state: RootState): string =>
  state.profile.displayName ?? state.auth.user?.name ?? '';
