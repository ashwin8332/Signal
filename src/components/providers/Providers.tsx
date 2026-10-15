'use client';

import { useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';
import { MotionConfig } from 'framer-motion';
import { makeStore } from '@/store';
import { createI18n } from '@/i18n';
import { AppEffects } from './AppEffects';
import { Toaster } from '@/components/ui/Toaster';

/**
 * Client-side app context: one Redux store and i18n instance per browser tab
 * (created lazily so they survive re-renders), plus reduced-motion-aware
 * animation defaults.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => makeStore());
  const [i18n] = useState(() => createI18n('en'));

  return (
    <ReduxProvider store={store}>
      <I18nextProvider i18n={i18n}>
        <MotionConfig reducedMotion="user">
          <AppEffects />
          {children}
          <Toaster />
        </MotionConfig>
      </I18nextProvider>
    </ReduxProvider>
  );
}
