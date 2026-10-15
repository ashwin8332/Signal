import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MovieGenre, NewsCategory } from '@/lib/constants';
import { hashtagSchema } from '@/lib/validation';
import { hydrateDevice, hydrateFromStorage, userSessionEnded } from '@/store/hydrate';

export type ThemePreference = 'light' | 'dark' | 'system';
export const LANGUAGES = ['en', 'es', 'fr', 'de', 'pt', 'hi'] as const;
export type Language = (typeof LANGUAGES)[number];

export interface PreferencesState {
  categories: NewsCategory[];
  genres: MovieGenre[];
  hashtags: string[];
  language: Language;
  theme: ThemePreference;
  liveUpdates: boolean;
}

export const defaultPreferences: PreferencesState = {
  categories: ['technology', 'business', 'sports'],
  genres: ['science-fiction', 'drama', 'comedy'],
  hashtags: ['ai', 'webdev', 'football'],
  language: 'en',
  theme: 'system',
  liveUpdates: true,
};

export const MAX_HASHTAGS = 10;

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: defaultPreferences,
  reducers: {
    /** News needs at least one category, so the last one cannot be removed. */
    toggleCategory(state, action: PayloadAction<NewsCategory>) {
      const index = state.categories.indexOf(action.payload);
      if (index === -1) state.categories.push(action.payload);
      else if (state.categories.length > 1) state.categories.splice(index, 1);
    },
    /** Genres may be emptied; the film source is then simply switched off. */
    toggleGenre(state, action: PayloadAction<MovieGenre>) {
      const index = state.genres.indexOf(action.payload);
      if (index === -1) state.genres.push(action.payload);
      else state.genres.splice(index, 1);
    },
    /** Accepts "#AI", " ai ", etc.; ignores invalid tags and duplicates. */
    addHashtag(state, action: PayloadAction<string>) {
      const parsed = hashtagSchema.safeParse(action.payload);
      if (!parsed.success || state.hashtags.includes(parsed.data) || state.hashtags.length >= MAX_HASHTAGS) return;
      state.hashtags.push(parsed.data);
    },
    removeHashtag(state, action: PayloadAction<string>) {
      state.hashtags = state.hashtags.filter((tag) => tag !== action.payload);
    },
    setLanguage(state, action: PayloadAction<Language>) {
      state.language = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    setLiveUpdates(state, action: PayloadAction<boolean>) {
      state.liveUpdates = action.payload;
    },
    /** Restores defaults but keeps appearance and language (those aren't "interests"). */
    resetInterests(state) {
      state.categories = [...defaultPreferences.categories];
      state.genres = [...defaultPreferences.genres];
      state.hashtags = [...defaultPreferences.hashtags];
    },
    /** Used by "Undo" after a reset. */
    restoreInterests(state, action: PayloadAction<Pick<PreferencesState, 'categories' | 'genres' | 'hashtags'>>) {
      Object.assign(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Per-user interests; theme and language are device settings and stay as they are.
      .addCase(hydrateFromStorage, (state, action) => ({ ...state, ...action.payload.preferences }))
      .addCase(hydrateDevice, (state, action) => {
        if (action.payload.theme) state.theme = action.payload.theme;
        if (action.payload.language) state.language = action.payload.language;
      })
      .addCase(userSessionEnded, (state) => ({ ...defaultPreferences, theme: state.theme, language: state.language }));
  },
});

export const {
  toggleCategory,
  toggleGenre,
  addHashtag,
  removeHashtag,
  setLanguage,
  setTheme,
  setLiveUpdates,
  resetInterests,
  restoreInterests,
} = preferencesSlice.actions;
export default preferencesSlice.reducer;
