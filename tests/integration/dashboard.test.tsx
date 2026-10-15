import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import activity, { logActivity } from '@/features/activity/activitySlice';
import { toggleFavorite } from '@/features/favorites/favoritesSlice';
import { flushPending, moveItem, receiveLiveItem, setStreamStatus } from '@/features/feed/feedSlice';
import { setTheme, toggleCategory } from '@/features/preferences/preferencesSlice';
import { ActivityLog } from '@/components/dashboard/ActivityLog';
import { SourceMix } from '@/components/dashboard/SourceMix';
import { StatTiles } from '@/components/dashboard/StatTiles';
import { HeadlineTicker } from '@/components/dashboard/HeadlineTicker';
import { StreamStatusBadge } from '@/components/dashboard/ControlBar';
import { FeedView } from '@/components/feed/FeedView';
import { json, makeItem, mockFetch, page } from '../fixtures';
import { renderWithProviders } from '../render';

describe('activity slice', () => {
  it('coalesces bursts of the same kind within 10 s, but not across kinds or later', () => {
    let state = activity(undefined, logActivity('reordered', undefined, 1_000));
    state = activity(state, logActivity('reordered', undefined, 5_000));
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]!.at).toBe(5_000);
    state = activity(state, logActivity('saved', { title: 'A' }, 6_000));
    state = activity(state, logActivity('saved', { title: 'B' }, 7_000));
    expect(state.entries.map((entry) => entry.kind)).toEqual(['saved', 'saved', 'reordered']);
    state = activity(state, logActivity('reordered', undefined, 30_000));
    expect(state.entries).toHaveLength(4);
  });
});

describe('ActivityLog (listener → log)', () => {
  it('records saves, removals, reorders, interests and theme changes', () => {
    const item = makeItem({ title: 'Deep sea' });
    const { store } = renderWithProviders(<ActivityLog />);
    expect(screen.getByText(/Nothing yet/)).toBeInTheDocument();

    act(() => {
      store.dispatch(toggleFavorite(item));
      store.dispatch(toggleFavorite(item));
      store.dispatch(moveItem({ visibleIds: ['a', 'b'], from: 0, to: 1 }));
      store.dispatch(toggleCategory('health'));
      store.dispatch(setTheme('dark'));
      store.dispatch(receiveLiveItem(makeItem({ type: 'social' })));
      store.dispatch(flushPending());
    });

    const log = within(screen.getByTestId('activity-log'));
    expect(log.getByText('Saved “Deep sea”')).toBeInTheDocument();
    expect(log.getByText('Removed “Deep sea”')).toBeInTheDocument();
    expect(log.getByText('Reordered your briefing')).toBeInTheDocument();
    expect(log.getByText('Updated interests (10 active)')).toBeInTheDocument();
    expect(log.getByText('Switched theme to dark')).toBeInTheDocument();
    expect(log.getByText('Showed 1 live posts')).toBeInTheDocument();
  });
});

describe('SourceMix', () => {
  it('shows shares as text and a provider stamp per source', () => {
    renderWithProviders(
      <SourceMix counts={{ news: 6, movie: 3, social: 3 }} status={{ news: 'live', movie: 'mock', social: 'down' }} />,
    );
    expect(screen.getByText('6 · 50%')).toBeInTheDocument();
    expect(screen.getByTestId('provider-news')).toHaveTextContent('Live API');
    expect(screen.getByTestId('provider-movie')).toHaveTextContent('Demo data');
    expect(screen.getByTestId('provider-social')).toHaveTextContent('Unavailable');
  });
});

describe('FeedView dashboard', () => {
  it('reports live vs demo data per source and marks a failing one as unavailable', async () => {
    mockFetch({
      '/api/news': () => json({ ...page([makeItem({ type: 'news', title: 'Real news' })]), source: 'live' }),
      '/api/recommendations': () => json({ error: { code: 'UPSTREAM_ERROR', message: 'down' } }, 502),
      '/api/social': () => json(page([makeItem({ type: 'social' })])),
      '/api/trending': () => json({ items: [makeItem({ title: 'Hot item' })] }),
    });
    renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'Real news' });
    expect(screen.getByTestId('provider-news')).toHaveAttribute('data-status', 'live');
    expect(screen.getByTestId('provider-movie')).toHaveAttribute('data-status', 'down');
    expect(screen.getByTestId('provider-social')).toHaveAttribute('data-status', 'mock');
    // The first card is the spotlight.
    expect(screen.getAllByTestId('content-card')[0]).toHaveAttribute('data-featured', 'true');
    expect(await screen.findByRole('link', { name: /Hot item/ })).toHaveAttribute('target', '_blank');
  });

  it('marks a source the reader switched off as Off', async () => {
    mockFetch({
      '/api/news': () => json(page([makeItem({ title: 'Only news' })])),
      '/api/social': () => json(page([])),
      '/api/trending': () => json({ items: [] }),
    });
    renderWithProviders(<FeedView />, {
      preloadedState: {
        preferences: { categories: ['technology'], genres: [], hashtags: ['ai'], language: 'en', theme: 'light', liveUpdates: false },
      },
    });
    await screen.findByRole('heading', { name: 'Only news' });
    expect(screen.getByTestId('provider-movie')).toHaveAttribute('data-status', 'off');
  });
});

describe('StatTiles', () => {
  it('summarizes the briefing and links to favorites and settings', () => {
    const item = makeItem();
    renderWithProviders(<StatTiles itemCount={27} sourceCount={3} />, {
      preloadedState: { favorites: { ids: [item.id], entities: { [item.id]: item } } },
    });
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('across 3 sources')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Saved\s*1/ })).toHaveAttribute('href', '/favorites');
    expect(screen.getByRole('link', { name: /Interests/ })).toHaveAttribute('href', '/settings');
  });
});

describe('HeadlineTicker', () => {
  it('hides the duplicate moving text from assistive tech and can be paused', async () => {
    const { container } = renderWithProviders(<HeadlineTicker items={[makeItem({ title: 'Ticker headline' })]} />);
    expect(container.querySelector('[aria-hidden="true"].group')).not.toBeNull();
    const pause = screen.getByRole('button', { name: 'Pause headlines' });
    await userEvent.click(pause);
    expect(screen.getByRole('button', { name: 'Play headlines' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders nothing without items', () => {
    renderWithProviders(<HeadlineTicker items={[]} />);
    expect(screen.queryByText('Headlines')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Pause headlines' })).toBeNull();
  });
});

describe('StreamStatusBadge', () => {
  it('reflects the live-stream connection state', async () => {
    const { store } = renderWithProviders(<StreamStatusBadge />);
    expect(screen.getByTestId('stream-status')).toHaveTextContent('Stream off');
    act(() => {
      store.dispatch(setStreamStatus('live'));
    });
    await waitFor(() => expect(screen.getByTestId('stream-status')).toHaveTextContent('Stream live'));
  });
});
