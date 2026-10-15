import { z } from 'zod';
import {
  HASHTAG_PATTERN,
  LANGUAGE_STORAGE_KEY,
  MOVIE_GENRE_KEYS,
  NEWS_CATEGORIES,
  THEME_STORAGE_KEY,
  userStorageKey,
} from '@/lib/constants';
import { AVATAR_COLORS } from '@/features/profile/profileSlice';
import { LANGUAGES, type Language, type ThemePreference } from '@/features/preferences/preferencesSlice';
import { contentItemSchema } from '@/lib/validation';

/**
 * Two layers of persistence:
 *  - **Device** settings (theme, language) in tiny global keys, read before
 *    first paint and shared by everyone using this browser.
 *  - **Per-user** data (interests, cached favorites, feed order, profile)
 *    under a key that includes the user id, so two accounts on one device
 *    never see each other's data. The server is the source of truth for
 *    favorites; this copy is an offline cache.
 * Everything is validated on the way in: localStorage is user-controlled, and
 * a corrupt slice is dropped on its own without costing the others.
 */

const interestsSchema = z.object({
  categories: z.array(z.enum(NEWS_CATEGORIES)).min(1),
  genres: z.array(z.enum(MOVIE_GENRE_KEYS)),
  hashtags: z.array(z.string().regex(HASHTAG_PATTERN)).max(10),
  liveUpdates: z.boolean(),
});

const favoritesSchema = z
  .object({ ids: z.array(z.string()), entities: z.record(z.string(), contentItemSchema) })
  // Keep ids and entities consistent even if someone edited storage by hand.
  .transform(({ ids, entities }) => {
    const validIds = ids.filter((id) => entities[id]);
    return { ids: validIds, entities: Object.fromEntries(validIds.map((id) => [id, entities[id]!])) };
  });

const feedSchema = z.object({ order: z.array(z.string().max(300)).max(500) });

const profileSchema = z.object({
  displayName: z.string().max(60).nullable(),
  bio: z.string().max(160),
  avatarColor: z.enum(AVATAR_COLORS),
});

const schemas = {
  preferences: interestsSchema,
  favorites: favoritesSchema,
  feed: feedSchema,
  profile: profileSchema,
};

export type PersistedState = {
  [K in keyof typeof schemas]: z.infer<(typeof schemas)[K]>;
};

export const PERSISTED_SLICES = Object.keys(schemas) as (keyof PersistedState)[];

type ReadableStorage = Pick<Storage, 'getItem'> | undefined;
type WritableStorage = Pick<Storage, 'setItem'> | undefined;

const defaultStorage = (): Storage | undefined => (typeof localStorage === 'undefined' ? undefined : localStorage);

/** Reads and validates one user's saved data. Never throws; returns {} when nothing usable exists. */
export function loadPersistedState(userId: string, storage: ReadableStorage = defaultStorage()): Partial<PersistedState> {
  if (!storage) return {};
  let raw: unknown;
  try {
    raw = JSON.parse(storage.getItem(userStorageKey(userId)) ?? 'null');
  } catch {
    return {};
  }
  if (typeof raw !== 'object' || raw === null) return {};

  const result: Partial<PersistedState> = {};
  for (const key of PERSISTED_SLICES) {
    const parsed = schemas[key].safeParse((raw as Record<string, unknown>)[key]);
    // Each schema validates its own slice; the cast just tells TS that key and value line up.
    if (parsed.success) (result as Record<string, unknown>)[key] = parsed.data;
  }
  return result;
}

export interface PersistableState {
  preferences: PersistedState['preferences'] & { theme: ThemePreference; language: Language };
  favorites: PersistedState['favorites'];
  feed: { order: string[] };
  profile: PersistedState['profile'];
}

export function savePersistedState(userId: string, state: PersistableState, storage: WritableStorage = defaultStorage()): void {
  if (!storage) return;
  const { categories, genres, hashtags, liveUpdates } = state.preferences;
  const snapshot: PersistedState = {
    preferences: { categories, genres, hashtags, liveUpdates },
    favorites: state.favorites,
    feed: { order: state.feed.order },
    profile: state.profile,
  };
  try {
    storage.setItem(userStorageKey(userId), JSON.stringify(snapshot));
  } catch {
    // Quota exceeded or storage disabled (private mode): keep working in memory.
  }
}

export interface DeviceSettings {
  theme?: ThemePreference;
  language?: Language;
}

export function loadDeviceSettings(storage: ReadableStorage = defaultStorage()): DeviceSettings {
  if (!storage) return {};
  try {
    const theme = storage.getItem(THEME_STORAGE_KEY);
    const language = storage.getItem(LANGUAGE_STORAGE_KEY);
    return {
      theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : undefined,
      language: (LANGUAGES as readonly string[]).includes(language ?? '') ? (language as Language) : undefined,
    };
  } catch {
    return {};
  }
}

export function saveDeviceSettings(settings: Required<DeviceSettings>, storage: WritableStorage = defaultStorage()): void {
  if (!storage) return;
  try {
    // Separate tiny keys so the pre-paint script doesn't have to parse JSON.
    storage.setItem(THEME_STORAGE_KEY, settings.theme);
    storage.setItem(LANGUAGE_STORAGE_KEY, settings.language);
  } catch {
    // ignore (see above)
  }
}
