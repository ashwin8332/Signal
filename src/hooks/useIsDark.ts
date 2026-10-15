import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

/**
 * Whether dark mode is currently applied to <html>, whatever set it (the
 * pre-paint script, the user, or the OS via "system"). Uses the server
 * snapshot during hydration, so there's no mismatch.
 */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains('dark'),
    () => false,
  );
}
