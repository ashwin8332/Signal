import { vi } from 'vitest';

/** Controllable stand-in for next/navigation in jsdom tests. */
export const navigation = {
  pathname: '/',
  search: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  reset(pathname = '/', search = '') {
    this.pathname = pathname;
    this.search = new URLSearchParams(search);
    this.push.mockReset();
    this.replace.mockReset();
    this.refresh.mockReset();
  },
};

export const nextNavigationMock = {
  useRouter: () => ({
    push: navigation.push,
    replace: navigation.replace,
    refresh: navigation.refresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
};
