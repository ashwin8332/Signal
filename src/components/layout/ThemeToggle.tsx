'use client';

import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { setTheme } from '@/features/preferences/preferencesSlice';
import { useIsDark } from '@/hooks/useIsDark';
import { IconButton } from '@/components/ui/IconButton';

/**
 * Quick light/dark switch in the header. It flips whatever is currently shown
 * (even if that came from "system"). The full Light / Dark / System choice
 * lives in Settings.
 */
export function ThemeToggle() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isDark = useIsDark();
  const next = isDark ? 'light' : 'dark';

  return (
    <IconButton
      label={`${t('header.theme')}: ${t(next === 'dark' ? 'header.themeDark' : 'header.themeLight')}`}
      icon={isDark ? <Sun aria-hidden="true" className="h-5 w-5" /> : <Moon aria-hidden="true" className="h-5 w-5" />}
      onClick={() => {
        dispatch(setTheme(next));
        document.documentElement.classList.toggle('dark', next === 'dark');
      }}
      data-testid="theme-toggle"
    />
  );
}
