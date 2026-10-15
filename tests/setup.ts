import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// `server-only` throws outside the react-server condition; in unit tests the
// server modules are exercised directly, so make it a no-op.
vi.mock('server-only', () => ({}));

// App Router hooks need a mounted router; tests drive them through tests/navigation.ts.
vi.mock('next/navigation', async () => (await import('./navigation')).nextNavigationMock);
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  return {
    default: ({ href, children, ...props }: { href: string; children?: import('react').ReactNode; prefetch?: unknown }) => {
      delete props.prefetch;
      return createElement('a', { href, ...props }, children);
    },
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  // Server tests run in the node environment, which has no DOM.
  if (typeof window === 'undefined') return;
  localStorage.clear();
  document.documentElement.className = '';
});

// jsdom gaps used by components.
if (typeof window !== 'undefined') {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  window.scrollTo ??= (() => {}) as typeof window.scrollTo;

  class MockIntersectionObserver {
    static instances: MockIntersectionObserver[] = [];
    constructor(public callback: IntersectionObserverCallback) {
      MockIntersectionObserver.instances.push(this);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    /** Test helper: pretend the sentinel scrolled into view. */
    trigger() {
      this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver;

  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.open = false;
  };
}
