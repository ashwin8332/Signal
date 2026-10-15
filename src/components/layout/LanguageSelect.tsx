'use client';

import { useId } from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { LANGUAGES, setLanguage, type Language } from '@/features/preferences/preferencesSlice';
import { LANGUAGE_NAMES } from '@/i18n';
import { cn } from '@/lib/cn';

/** Native <select>: fully keyboard and screen-reader friendly with no custom widget. */
export function LanguageSelect({ showLabel = false, className }: { showLabel?: boolean; className?: string }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.preferences.language);
  const id = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('font-mono text-xs font-bold uppercase tracking-wider text-fg', !showLabel && 'sr-only')}>
        {t('header.language')}
      </label>
      <div className="relative">
        <Languages aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
        <select
          id={id}
          value={language}
          onChange={(event) => dispatch(setLanguage(event.target.value as Language))}
          className="h-11 appearance-none border-2 border-ink bg-surface pl-8 pr-8 font-mono text-xs font-bold uppercase text-fg hover:bg-surface-3"
        >
          {LANGUAGES.map((code) => (
            <option key={code} value={code} lang={code}>
              {LANGUAGE_NAMES[code]}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-fg-muted">
          ▾
        </span>
      </div>
    </div>
  );
}
