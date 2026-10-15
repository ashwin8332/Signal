'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SEARCH_DEBOUNCE_MS, SEARCH_MAX_LENGTH } from '@/lib/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useHotkey } from '@/hooks/useHotkey';
import { cn } from '@/lib/cn';

/**
 * Global search box. Typing is debounced (350 ms) before the query is written
 * to the URL (/search?q=…), and the search page fetches from the URL. A burst
 * of keystrokes therefore costs one request, and results stay shareable and
 * work with the back button. "/" focuses it from anywhere; Esc clears it.
 */
export function SearchBar({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQuery = pathname === '/search' ? (params.get('q') ?? '') : '';
  const [value, setValue] = useState(urlQuery);
  const [focused, setFocused] = useState(false);
  /** True once the user has typed; only typing (not URL changes) may navigate. */
  const [edited, setEdited] = useState(false);
  const [syncedUrlQuery, setSyncedUrlQuery] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const debounced = useDebounce(value, SEARCH_DEBOUNCE_MS);

  // Follow the URL when it changes from outside (back button, links) unless
  // the user is typing. Adjusting state during render avoids an extra pass.
  if (urlQuery !== syncedUrlQuery) {
    setSyncedUrlQuery(urlQuery);
    if (!focused) {
      setValue(urlQuery);
      setEdited(false);
    }
  }

  useEffect(() => {
    if (!edited) return;
    const query = debounced.trim();
    if (query === urlQuery.trim()) return;
    if (query) {
      const url = `/search?q=${encodeURIComponent(query)}`;
      // First search navigates (one history entry); refinements replace it.
      if (pathname === '/search') router.replace(url, { scroll: false });
      else router.push(url);
    } else if (pathname === '/search') {
      router.replace('/search', { scroll: false });
    }
  }, [debounced, edited, urlQuery, pathname, router]);

  const focusSearch = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    inputRef.current?.focus();
  }, []);
  useHotkey('/', focusSearch);

  return (
    <form role="search" className={cn('relative w-full', className)} onSubmit={(event) => event.preventDefault()}>
      <label htmlFor={inputId} className="sr-only">
        {t('header.searchLabel')}
      </label>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        autoComplete="off"
        spellCheck={false}
        autoFocus={autoFocus}
        maxLength={SEARCH_MAX_LENGTH}
        placeholder={t('header.searchPlaceholder')}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setEdited(true);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && value) {
            event.preventDefault();
            setValue('');
            setEdited(true);
          }
        }}
        aria-describedby={hintId}
        className="h-11 w-full border-2 border-ink bg-surface-2 pl-9 pr-16 font-mono text-base text-fg placeholder:text-fg-muted transition-shadow focus-visible:bg-surface focus-visible:shadow-brut-sm focus-visible:outline-none sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      <span id={hintId} className="sr-only">
        {t('header.searchShortcut')}
      </span>
      {value ? (
        <button
          type="button"
          aria-label={t('header.clearSearch')}
          onClick={() => {
            setValue('');
            setEdited(true);
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-muted hover:bg-surface hover:text-fg"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 border-2 border-ink bg-surface px-1.5 font-mono text-xs font-bold text-fg pointer-fine:inline"
        >
          /
        </kbd>
      )}
    </form>
  );
}
