import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedView } from '@/components/feed/FeedView';
import { toggleCategory } from '@/features/preferences/preferencesSlice';
import { callsTo, json, makeItem, mockFetch, page } from '../fixtures';
import { renderWithProviders } from '../render';

const news = [makeItem({ type: 'news', title: 'News one' }), makeItem({ type: 'news', title: 'News two' })];
const movies = [makeItem({ type: 'movie', title: 'Film one', reason: 'genre:drama' })];
const posts = [makeItem({ type: 'social', title: 'Post one', reason: 'hashtag:ai' })];

function sources(overrides: Partial<Record<'news' | 'recommendations' | 'social', () => Response>> = {}) {
  return mockFetch({
    '/api/news': overrides.news ?? (() => json(page(news))),
    '/api/recommendations': overrides.recommendations ?? (() => json(page(movies))),
    '/api/social': overrides.social ?? (() => json(page(posts))),
  });
}

const cardTitles = () => screen.getAllByTestId('content-card').map((card) => within(card).getByRole('heading').textContent);

describe('FeedView', () => {
  it('shows skeletons, then one interleaved feed from all three sources', async () => {
    sources();
    renderWithProviders(<FeedView />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByTestId('content-card')).toHaveLength(4));
    expect(cardTitles()).toEqual(['News one', 'Film one', 'Post one', 'News two']);
    expect(screen.getByText('You’re all caught up')).toBeInTheDocument();
  });

  it('shows the reason, source label and a named CTA on each card', async () => {
    sources();
    renderWithProviders(<FeedView />);
    const card = (await screen.findByRole('heading', { name: 'Film one' })).closest('article')!;
    expect(within(card).getByText('You like Drama')).toBeInTheDocument();
    expect(within(card).getByText('Film')).toBeInTheDocument();
    const link = within(card).getByRole('link', { name: /View film/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('keeps the other sources when one fails, and offers a retry', async () => {
    let filmsUp = false;
    const fetchMock = sources({
      recommendations: () => (filmsUp ? json(page(movies)) : json({ error: { code: 'UPSTREAM_ERROR', message: 'TMDB is unavailable' } }, 502)),
    });
    renderWithProviders(<FeedView />);
    expect(await screen.findByText('Film picks couldn’t load right now.')).toBeInTheDocument();
    expect(cardTitles()).toEqual(['News one', 'Post one', 'News two']);

    filmsUp = true;
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(cardTitles()).toContain('Film one'));
    expect(screen.queryByText('Film picks couldn’t load right now.')).not.toBeInTheDocument();
    expect(callsTo(fetchMock, '/api/recommendations')).toHaveLength(2);
  });

  it('shows an error state with retry when every source fails', async () => {
    const down = () => json({ error: { code: 'INTERNAL_ERROR', message: 'x' } }, 500);
    sources({ news: down, recommendations: down, social: down });
    renderWithProviders(<FeedView />);
    const alert = await screen.findByRole('alert');
    expect(within(alert).getByText('We couldn’t load your briefing')).toBeInTheDocument();
    expect(within(alert).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows an empty state that links to Settings when a filter has nothing', async () => {
    sources({ social: () => json(page([])) });
    renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'News one' });
    await userEvent.click(screen.getByRole('tab', { name: /Social/ }));
    expect(screen.getByRole('heading', { name: 'Nothing here for this filter' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Adjust interests/ })).toHaveAttribute('href', '/settings');
  });

  it('filters by source with counts, and the tabs follow the arrow keys', async () => {
    sources();
    renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'News one' });
    expect(screen.getByRole('tab', { name: /News\s*2/ })).toBeInTheDocument();
    screen.getByRole('tab', { name: /All/ }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /News/ })).toHaveAttribute('aria-selected', 'true');
    expect(cardTitles()).toEqual(['News one', 'News two']);
  });

  it('loads the next page when the sentinel scrolls into view', async () => {
    const fetchMock = mockFetch({
      '/api/news': (url) => json(page([makeItem({ title: `News p${url.searchParams.get('page')}` })], url.searchParams.get('page') === '1', Number(url.searchParams.get('page')))),
      '/api/recommendations': () => json(page([])),
      '/api/social': () => json(page([])),
    });
    renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'News p1' });
    const observers = (IntersectionObserver as unknown as { instances: { trigger: () => void }[] }).instances;
    act(() => observers.at(-1)!.trigger());
    expect(await screen.findByRole('heading', { name: 'News p2' })).toBeInTheDocument();
    expect(callsTo(fetchMock, '/api/news').map((url) => url.searchParams.get('page'))).toEqual(['1', '2']);
  });

  it('reorders with the keyboard controls, announces the move and saves the order', async () => {
    sources();
    const { store } = renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'News one' });
    await userEvent.click(screen.getByRole('button', { name: 'Move “News one” later' }));
    expect(cardTitles()).toEqual(['Film one', 'News one', 'Post one', 'News two']);
    expect(screen.getByText('Moved to position 2 of 4')).toBeInTheDocument();
    expect(store.getState().feed.order.slice(0, 2)).toEqual([movies[0]!.id, news[0]!.id]);
    // The first card can't move earlier and the last can't move later.
    expect(screen.getByRole('button', { name: 'Move “Film one” earlier' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move “News two” later' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Reset order' }));
    expect(cardTitles()).toEqual(['News one', 'Film one', 'Post one', 'News two']);
  });

  it('refetches with the new interests when a preference changes', async () => {
    const fetchMock = sources();
    const { store } = renderWithProviders(<FeedView />);
    await screen.findByRole('heading', { name: 'News one' });
    act(() => {
      store.dispatch(toggleCategory('health'));
    });
    await waitFor(() => expect(callsTo(fetchMock, '/api/news')).toHaveLength(2));
    expect(callsTo(fetchMock, '/api/news')[1]!.searchParams.get('categories')).toBe('technology,business,sports,health');
  });

  it('skips a source the user switched off', async () => {
    const fetchMock = sources();
    renderWithProviders(<FeedView />, {
      preloadedState: {
        preferences: { categories: ['technology'], genres: [], hashtags: ['ai'], language: 'en', theme: 'light', liveUpdates: false },
      },
    });
    await screen.findByRole('heading', { name: 'News one' });
    expect(callsTo(fetchMock, '/api/recommendations')).toHaveLength(0);
  });

  it('waits for saved preferences before fetching', () => {
    const fetchMock = sources();
    renderWithProviders(<FeedView />, { hydrated: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
