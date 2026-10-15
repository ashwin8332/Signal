import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ContentItem, ContentType } from '@/types/content';
import { mergeVisibleOrder, moveId } from '@/lib/feed';
import { hydrateFromStorage, userSessionEnded } from '@/store/hydrate';

export type SourceFilter = 'all' | ContentType;
export type StreamStatus = 'off' | 'connecting' | 'live' | 'reconnecting' | 'paused';

export interface FeedState {
  /** The user's custom order (ids). Empty = natural order. Persisted. */
  order: string[];
  sourceFilter: SourceFilter;
  /** Live posts received but not shown yet (behind the "N new posts" pill). */
  pending: ContentItem[];
  /** Live posts the user chose to show, newest first. */
  live: ContentItem[];
  /** Connection state of the real-time stream (shown in the control bar). */
  streamStatus: StreamStatus;
}

const initialState: FeedState = { order: [], sourceFilter: 'all', pending: [], live: [], streamStatus: 'off' };

const MAX_ORDER = 500;
const MAX_LIVE = 50;

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    /**
     * Moves a card within the *visible* list (which may be filtered) and saves
     * the resulting order. Hidden items keep their slots.
     */
    moveItem(state, action: PayloadAction<{ visibleIds: string[]; from: number; to: number }>) {
      const { visibleIds, from, to } = action.payload;
      const after = moveId(visibleIds, from, to);
      if (after === visibleIds) return;
      state.order = mergeVisibleOrder(state.order, visibleIds, after).slice(0, MAX_ORDER);
    },
    resetOrder(state) {
      state.order = [];
    },
    setStreamStatus(state, action: PayloadAction<StreamStatus>) {
      state.streamStatus = action.payload;
    },
    setSourceFilter(state, action: PayloadAction<SourceFilter>) {
      state.sourceFilter = action.payload;
    },
    receiveLiveItem(state, action: PayloadAction<ContentItem>) {
      const item = action.payload;
      const known = state.pending.some((p) => p.id === item.id) || state.live.some((l) => l.id === item.id);
      if (!known) state.pending = [item, ...state.pending].slice(0, MAX_LIVE);
    },
    /** Shows queued live posts at the top of the feed. */
    flushPending(state) {
      if (state.pending.length === 0) return;
      const ids = state.pending.map((item) => item.id);
      state.live = [...state.pending, ...state.live].slice(0, MAX_LIVE);
      // With a custom order, new posts must be placed explicitly or they'd land at the end.
      if (state.order.length > 0) state.order = [...ids, ...state.order].slice(0, MAX_ORDER);
      state.pending = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateFromStorage, (state, action) => {
        if (action.payload.feed) state.order = action.payload.feed.order;
      })
      .addCase(userSessionEnded, (state) => ({ ...initialState, streamStatus: state.streamStatus }));
  },
});

export const { moveItem, resetOrder, setSourceFilter, receiveLiveItem, flushPending, setStreamStatus } = feedSlice.actions;
export default feedSlice.reducer;
