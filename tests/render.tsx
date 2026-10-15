import type { ReactElement, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { makeStore, type RootState } from '@/store';
import { hydrateFromStorage } from '@/store/hydrate';
import { createI18n } from '@/i18n';
import { Toaster } from '@/components/ui/Toaster';
import type { PublicUser } from '@/types/content';
import type { Language } from '@/features/preferences/preferencesSlice';
import { navigation } from './navigation';

interface Options {
  preloadedState?: Partial<RootState>;
  /** Mark persisted state as loaded (the app does this right after mount). Default true. */
  hydrated?: boolean;
  user?: PublicUser | null;
  pathname?: string;
  search?: string;
  language?: Language;
}

export const TEST_USER: PublicUser = { id: 'u1', name: 'Ana Lima', email: 'ana@example.com' };

/** Renders with the real store, i18n and DnD providers, as the app does. */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { preloadedState, hydrated = true, user = TEST_USER, pathname = '/', search = '', language = 'en' } = options;
  navigation.reset(pathname, search);
  const store = makeStore(preloadedState);
  if (user) store.dispatch({ type: 'auth/fetchSession/fulfilled', payload: user });
  if (hydrated) store.dispatch(hydrateFromStorage({}));
  const i18n = createI18n(language);

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <DndProvider backend={HTML5Backend}>
          {children}
          <Toaster />
        </DndProvider>
      </I18nextProvider>
    </Provider>
  );

  return { store, i18n, ...render(ui, { wrapper: Wrapper }) };
}
