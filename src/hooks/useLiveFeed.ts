import { useEffect } from 'react';
import type { ContentItem } from '@/types/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { receiveLiveItem, setStreamStatus } from '@/features/feed/feedSlice';

const MAX_BACKOFF_MS = 30_000;

export function backoffDelay(attempt: number): number {
  return Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt);
}

/**
 * Subscribes to /api/stream (Server-Sent Events) while live updates are on
 * and the tab is visible. New posts are queued in `feed.pending`; the feed
 * shows a "N new posts" pill instead of shifting content under the reader.
 * Reconnects with exponential backoff after errors.
 */
export function useLiveFeed() {
  const dispatch = useAppDispatch();
  const enabled = useAppSelector((state) => state.ui.hydrated && state.preferences.liveUpdates && state.auth.user !== null);
  const hashtags = useAppSelector((state) => state.preferences.hashtags);
  const hashtagKey = hashtags.join(',');

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') {
      dispatch(setStreamStatus('off'));
      return;
    }

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let disposed = false;

    const close = () => {
      source?.close();
      source = null;
      clearTimeout(retryTimer);
    };

    const open = () => {
      if (disposed) return;
      if (document.visibilityState === 'hidden') {
        dispatch(setStreamStatus('paused'));
        return;
      }
      close();
      dispatch(setStreamStatus(attempt === 0 ? 'connecting' : 'reconnecting'));
      const query = hashtagKey ? `?hashtags=${encodeURIComponent(hashtagKey)}` : '';
      source = new EventSource(`/api/stream${query}`);
      source.addEventListener('open', () => {
        attempt = 0;
        dispatch(setStreamStatus('live'));
      });
      source.addEventListener('post', (event) => {
        try {
          dispatch(receiveLiveItem(JSON.parse((event as MessageEvent<string>).data) as ContentItem));
        } catch {
          // Ignore malformed events rather than breaking the stream.
        }
      });
      source.addEventListener('error', () => {
        // Take over from the browser's fixed retry so we can back off.
        close();
        dispatch(setStreamStatus('reconnecting'));
        retryTimer = setTimeout(open, backoffDelay(attempt++));
      });
    };

    // Pause while the tab is hidden: saves battery and server connections.
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        close();
        dispatch(setStreamStatus('paused'));
      } else {
        open();
      }
    };

    open();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      close();
      dispatch(setStreamStatus('off'));
    };
  }, [enabled, hashtagKey, dispatch]);
}
