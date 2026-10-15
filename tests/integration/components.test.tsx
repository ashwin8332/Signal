import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentCard } from '@/components/content/ContentCard';
import { FavoritesView } from '@/components/favorites/FavoritesView';
import { SearchBar } from '@/components/layout/SearchBar';
import { SearchView } from '@/components/search/SearchView';
import { SettingsView } from '@/components/settings/SettingsView';
import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LivePill } from '@/components/feed/LivePill';
import { TrendingView } from '@/components/trending/TrendingView';
import { receiveLiveItem } from '@/features/feed/feedSlice';
import { json, makeItem, mockFetch, page } from '../fixtures';
import { navigation } from '../navigation';
import { renderWithProviders } from '../render';

describe('ContentCard', () => {
  it('toggles a favorite with an announced state and a toast', async () => {
    const item = makeItem({ title: 'Saved story' });
    const { store } = renderWithProviders(<ContentCard item={item} />);
    const button = screen.getByRole('button', { name: 'Save “Saved story” to favorites' });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(button);
    expect(screen.getByRole('button', { name: 'Remove “Saved story” from favorites' })).toHaveAttribute('aria-pressed', 'true');
    expect(store.getState().favorites.ids).toEqual([item.id]);
    expect(screen.getByText('Saved to favorites')).toBeInTheDocument();
  });

  it('falls back to a branded placeholder when the image fails', () => {
    const { container } = renderWithProviders(<ContentCard item={makeItem({ imageUrl: 'https://img.example/broken.jpg' })} />);
    const img = container.querySelector('img')!;
    expect(img).toHaveAttribute('loading', 'lazy');
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows a rank for trending items', () => {
    renderWithProviders(<ContentCard item={makeItem()} rank={3} />);
    expect(screen.getByText('Rank 3')).toBeInTheDocument();
  });
});

describe('FavoritesView', () => {
  it('shows an empty state that leads back to the feed', () => {
    renderWithProviders(<FavoritesView />);
    expect(screen.getByRole('heading', { name: 'No favorites yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse your briefing/ })).toHaveAttribute('href', '/');
  });

  it('removes an item and brings it back with Undo', async () => {
    const item = makeItem({ title: 'Keep me' });
    renderWithProviders(<FavoritesView />, { preloadedState: { favorites: { ids: [item.id], entities: { [item.id]: item } } } });
    expect(screen.getByText('1 saved item')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove “Keep me” from favorites' }));
    expect(screen.getByRole('heading', { name: 'No favorites yet' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByRole('heading', { name: 'Keep me' })).toBeInTheDocument();
  });
});

describe('SearchBar (debounced)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /** A quick burst of keystrokes, one change event per character. */
  const typeBurst = (input: HTMLElement, text: string, start = '') => {
    for (let index = 1; index <= text.length; index += 1) {
      fireEvent.change(input, { target: { value: start + text.slice(0, index) } });
      act(() => {
        vi.advanceTimersByTime(50);
      });
    }
  };

  it('navigates once, 350 ms after the user stops typing', () => {
    renderWithProviders(<SearchBar />, { pathname: '/trending' });
    const input = screen.getByRole('searchbox', { name: 'Search news, films and posts' });
    input.focus();
    typeBurst(input, 'space');
    expect(navigation.push).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(299); // 50 ms already elapsed after the last keystroke
    });
    expect(navigation.push).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(navigation.push).toHaveBeenCalledTimes(1);
    expect(navigation.push).toHaveBeenCalledWith('/search?q=space');
  });

  it('refines in place on the search page, and clears with Escape', () => {
    renderWithProviders(<SearchBar />, { pathname: '/search', search: 'q=ai' });
    const input = screen.getByRole('searchbox');
    expect(input).toHaveValue('ai');
    input.focus();
    typeBurst(input, ' news', 'ai');
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(navigation.replace).toHaveBeenLastCalledWith('/search?q=ai%20news', { scroll: false });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
  });

  it('focuses on "/" from anywhere', () => {
    renderWithProviders(<SearchBar />);
    fireEvent.keyDown(window, { key: '/' });
    expect(screen.getByRole('searchbox')).toHaveFocus();
  });
});

describe('SearchView', () => {
  it('hints before a query, then shows and announces results', async () => {
    mockFetch({ '/api/search': () => json({ ...page([makeItem({ title: 'Space news' })]), failedSources: [] }) });
    renderWithProviders(<SearchView />, { pathname: '/search', search: 'q=space' });
    expect(await screen.findByRole('heading', { name: 'Space news' })).toBeInTheDocument();
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('shows the no-results state', async () => {
    mockFetch({ '/api/search': () => json({ ...page([]), failedSources: [] }) });
    renderWithProviders(<SearchView />, { pathname: '/search', search: 'q=zzz' });
    expect(await screen.findByRole('heading', { name: 'No results for “zzz”' })).toBeInTheDocument();
  });

  it('shows a hint and makes no request without a query', () => {
    const fetchMock = mockFetch({});
    renderWithProviders(<SearchView />, { pathname: '/search' });
    expect(screen.getByRole('heading', { name: 'Search across everything' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('TrendingView', () => {
  it('lists ranked items and switches type', async () => {
    const fetchMock = mockFetch({
      '/api/trending': (url) => json({ items: [makeItem({ title: `Top ${url.searchParams.get('type')}` })] }),
    });
    renderWithProviders(<TrendingView />);
    expect(await screen.findByRole('heading', { name: 'Top all' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Films/ }));
    expect(await screen.findByRole('heading', { name: 'Top movie' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('SettingsView', () => {
  it('keeps the last news category and explains why', async () => {
    const { store } = renderWithProviders(<SettingsView />, {
      preloadedState: {
        preferences: { categories: ['sports'], genres: [], hashtags: [], language: 'en', theme: 'system', liveUpdates: true },
      },
    });
    const sports = screen.getByRole('button', { name: 'Sports' });
    expect(sports).toHaveAttribute('aria-pressed', 'true');
    expect(sports).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(sports);
    expect(store.getState().preferences.categories).toEqual(['sports']);
    expect(screen.getByText('At least one news category is required')).toBeInTheDocument();
  });

  it('validates and adds hashtags, and removes them', async () => {
    const { store } = renderWithProviders(<SettingsView />);
    const input = screen.getByRole('textbox', { name: 'Add a hashtag' });
    await userEvent.type(input, 'not valid!{Enter}');
    expect(screen.getByText('Use 2–30 letters, numbers or underscores.')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await userEvent.clear(input);
    await userEvent.type(input, '#Climate{Enter}');
    expect(store.getState().preferences.hashtags).toContain('climate');
    await userEvent.click(screen.getByRole('button', { name: 'Stop following #climate' }));
    expect(store.getState().preferences.hashtags).not.toContain('climate');
  });

  it('switches theme and live updates', async () => {
    const { store } = renderWithProviders(<SettingsView />);
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(store.getState().preferences.theme).toBe('dark');
    await userEvent.click(screen.getByRole('switch', { name: 'Show new posts as they arrive' }));
    expect(store.getState().preferences.liveUpdates).toBe(false);
  });

  it('resets interests with undo', async () => {
    const { store } = renderWithProviders(<SettingsView />);
    await userEvent.click(screen.getByRole('button', { name: 'Health' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset interests to defaults' }));
    expect(store.getState().preferences.categories).not.toContain('health');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(store.getState().preferences.categories).toContain('health');
  });
});

describe('LoginForm', () => {
  it('validates fields before sending anything', async () => {
    const fetchMock = mockFetch({});
    renderWithProviders(<LoginForm />, { user: null, pathname: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByText('Enter a valid email address, like name@example.com.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the server error and clears the password', async () => {
    mockFetch({ '/api/auth/login': () => json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } }, 401) });
    renderWithProviders(<LoginForm />, { user: null, pathname: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Email or password is incorrect.');
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });

  it('signs in and returns to the requested page (never off-site)', async () => {
    mockFetch({ '/api/auth/login': () => json({ user: { id: 'u1', name: 'Ana', email: 'ana@example.com' } }) });
    renderWithProviders(<LoginForm />, { user: null, pathname: '/login', search: 'next=/favorites' });
    await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/favorites'));

    mockFetch({ '/api/auth/demo': () => json({ user: { id: 'demo', name: 'Demo', email: 'demo@signal.app' } }) });
    renderWithProviders(<LoginForm />, { user: null, pathname: '/login', search: 'next=//evil.com' });
    await userEvent.click(screen.getAllByRole('button', { name: /Continue with demo account/ }).at(-1)!);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/'));
  });

  it('explains an expired session', () => {
    renderWithProviders(<LoginForm />, { user: null, pathname: '/login', search: 'expired=1' });
    expect(screen.getByText('Your session expired. Sign in again to continue.')).toBeInTheDocument();
  });
});

describe('ThemeToggle', () => {
  it('flips the applied theme and saves the preference', async () => {
    const { store } = renderWithProviders(<ThemeToggle />);
    await userEvent.click(screen.getByRole('button', { name: 'Theme: Dark' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(store.getState().preferences.theme).toBe('dark');
    expect(await screen.findByRole('button', { name: 'Theme: Light' })).toBeInTheDocument();
  });
});

describe('LivePill', () => {
  it('queues live posts behind a pill, then shows them', async () => {
    const { store } = renderWithProviders(<LivePill />);
    expect(screen.queryByRole('button')).toBeNull();
    act(() => {
      store.dispatch(receiveLiveItem(makeItem({ type: 'social' })));
      store.dispatch(receiveLiveItem(makeItem({ type: 'social' })));
    });
    const pill = screen.getByRole('button', { name: '2 new posts' });
    await userEvent.click(pill);
    expect(store.getState().feed.pending).toEqual([]);
    expect(store.getState().feed.live).toHaveLength(2);
  });
});

describe('Toaster', () => {
  it('auto-dismisses after 5 seconds', async () => {
    vi.useFakeTimers();
    try {
      renderWithProviders(<ContentCard item={makeItem({ title: 'T' })} />);
      fireEvent.click(screen.getByRole('button', { name: 'Save “T” to favorites' }));
      const toast = screen.getByText('Saved to favorites');
      act(() => {
        vi.advanceTimersByTime(5100);
      });
      await vi.runAllTimersAsync();
      expect(toast).not.toBeInTheDocument();
      expect(within(document.body).queryByText('Saved to favorites')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
