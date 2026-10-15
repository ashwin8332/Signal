import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit';
import { userSessionEnded } from '@/store/hydrate';

export type ActivityKind =
  | 'saved'
  | 'removed'
  | 'restored'
  | 'reordered'
  | 'orderReset'
  | 'interests'
  | 'live'
  | 'theme'
  | 'language';

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  /** i18n interpolation values, e.g. { title }. */
  values?: Record<string, string | number>;
  /** epoch ms */
  at: number;
}

export interface ActivityState {
  /** Newest first. Session-only (not persisted): a log of what changed and when. */
  entries: ActivityEntry[];
}

const MAX_ENTRIES = 30;
/** Bursts of the same kind (dragging, toggling several chips) collapse into one entry. */
const COALESCE: ReadonlySet<ActivityKind> = new Set(['reordered', 'interests', 'theme', 'language']);
const COALESCE_WINDOW_MS = 10_000;

const activitySlice = createSlice({
  name: 'activity',
  initialState: { entries: [] } as ActivityState,
  reducers: {
    logActivity: {
      reducer(state, action: PayloadAction<ActivityEntry>) {
        const entry = action.payload;
        const latest = state.entries[0];
        if (latest && latest.kind === entry.kind && COALESCE.has(entry.kind) && entry.at - latest.at < COALESCE_WINDOW_MS) {
          state.entries[0] = { ...entry, id: latest.id };
          return;
        }
        state.entries = [entry, ...state.entries].slice(0, MAX_ENTRIES);
      },
      prepare(kind: ActivityKind, values?: Record<string, string | number>, at = Date.now()) {
        return { payload: { id: nanoid(), kind, values, at } };
      },
    },
    clearActivity(state) {
      state.entries = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(userSessionEnded, () => ({ entries: [] }));
  },
});

export const { logActivity, clearActivity } = activitySlice.actions;
export default activitySlice.reducer;
