import { useEffect, useRef } from 'react';

/**
 * Calls `onLoadMore` when the returned sentinel element comes within
 * `rootMargin` of the viewport. Disabled while a page is loading or when there
 * is nothing more, so it never double-fetches.
 */
export function useInfiniteScroll<T extends Element>({
  enabled,
  onLoadMore,
  rootMargin = '600px 0px',
}: {
  enabled: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}) {
  const sentinelRef = useRef<T | null>(null);
  const callback = useRef(onLoadMore);

  useEffect(() => {
    callback.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) callback.current();
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
