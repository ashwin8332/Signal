'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { Monitor, Moon, Plus, RotateCcw, Sun, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOVIE_GENRE_KEYS, NEWS_CATEGORIES, SUGGESTED_HASHTAGS } from '@/lib/constants';
import { hashtagSchema } from '@/lib/validation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  MAX_HASHTAGS,
  addHashtag,
  removeHashtag,
  resetInterests,
  restoreInterests,
  setLiveUpdates,
  setTheme,
  toggleCategory,
  toggleGenre,
  type ThemePreference,
} from '@/features/preferences/preferencesSlice';
import { showToast } from '@/features/ui/uiSlice';
import { PageHeader } from '@/components/ui/PageHeader';
import { Chip } from '@/components/ui/Chip';
import { Switch } from '@/components/ui/Switch';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { RadioCards } from '@/components/ui/RadioCards';
import { LanguageSelect } from '@/components/layout/LanguageSelect';

function SettingsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="brut bg-surface p-5 md:p-6">
      <h2 id={id} className="mb-5 border-b-[3px] border-ink pb-3 text-xl font-black text-fg">
        {title}
      </h2>
      <div className="flex flex-col gap-7">{children}</div>
    </section>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-3">
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-fg">{label}</h3>
        {hint && <p className="mt-0.5 text-sm text-fg-muted">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function SettingsView() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const preferences = useAppSelector((state) => state.preferences);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);

  const onAddHashtag = (event: FormEvent) => {
    event.preventDefault();
    if (preferences.hashtags.length >= MAX_HASHTAGS) {
      setTagError(t('settings.hashtagLimit'));
      return;
    }
    const parsed = hashtagSchema.safeParse(tagInput);
    if (!parsed.success) {
      setTagError(t('settings.hashtagInvalid'));
      return;
    }
    dispatch(addHashtag(parsed.data));
    setTagInput('');
    setTagError(null);
  };

  const onReset = () => {
    const previous = { categories: preferences.categories, genres: preferences.genres, hashtags: preferences.hashtags };
    dispatch(resetInterests());
    dispatch(
      showToast({
        message: 'settings.interestsReset',
        tone: 'info',
        action: { label: 'common.undo', dispatch: restoreInterests(previous) },
      }),
    );
  };

  const suggestions = SUGGESTED_HASHTAGS.filter((tag) => !preferences.hashtags.includes(tag));
  const themeOptions: { value: ThemePreference; label: string; icon: ReactNode }[] = [
    { value: 'light', label: t('header.themeLight'), icon: <Sun aria-hidden="true" className="h-4 w-4" /> },
    { value: 'dark', label: t('header.themeDark'), icon: <Moon aria-hidden="true" className="h-4 w-4" /> },
    { value: 'system', label: t('header.themeSystem'), icon: <Monitor aria-hidden="true" className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('settings.title')}
        description={t('settings.subtitle')}
        actions={
          <Button variant="secondary" size="sm" icon={<RotateCcw className="h-4 w-4" aria-hidden="true" />} onClick={onReset}>
            {t('settings.resetInterests')}
          </Button>
        }
      />

      <SettingsSection id="settings-interests" title={t('settings.interests')}>
        <Group label={t('settings.newsCategories')} hint={t('settings.newsCategoriesHint')}>
          {NEWS_CATEGORIES.map((category) => {
            const selected = preferences.categories.includes(category);
            const locked = selected && preferences.categories.length === 1;
            return (
              <Chip
                key={category}
                selected={selected}
                aria-disabled={locked || undefined}
                title={locked ? t('settings.lastCategory') : undefined}
                onClick={() => {
                  if (locked) dispatch(showToast({ message: 'settings.lastCategory', tone: 'info' }));
                  else dispatch(toggleCategory(category));
                }}
              >
                {t(`categories.${category}`)}
              </Chip>
            );
          })}
        </Group>

        <Group label={t('settings.genres')} hint={t('settings.genresHint')}>
          {MOVIE_GENRE_KEYS.map((genre) => (
            <Chip key={genre} selected={preferences.genres.includes(genre)} onClick={() => dispatch(toggleGenre(genre))}>
              {t(`genres.${genre}`)}
            </Chip>
          ))}
        </Group>

        <div className="flex flex-col gap-3">
          <Group label={t('settings.hashtags')} hint={t('settings.hashtagsHint')}>
            {preferences.hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex min-h-9 items-center gap-1 border-2 border-ink bg-fg py-1 pl-3 pr-1 font-mono text-sm font-bold text-bg shadow-brut-sm"
              >
                #{tag}
                <button
                  type="button"
                  aria-label={t('settings.removeHashtag', { tag })}
                  onClick={() => dispatch(removeHashtag(tag))}
                  className="inline-flex h-7 w-7 items-center justify-center hover:bg-bg/20"
                >
                  <X aria-hidden="true" className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </Group>

          <form onSubmit={onAddHashtag} className="flex max-w-md items-start gap-2" noValidate>
            <TextField
              label={t('settings.addHashtag')}
              hideLabel
              placeholder="#climate"
              value={tagInput}
              onChange={(event) => {
                setTagInput(event.target.value);
                if (tagError) setTagError(null);
              }}
              error={tagError}
              containerClassName="flex-1"
              autoComplete="off"
              maxLength={31}
            />
            <Button type="submit" variant="secondary" icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              {t('settings.addHashtagButton')}
            </Button>
          </form>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-fg-muted">{t('settings.suggested')}:</span>
              {suggestions.map((tag) => (
                <Chip
                  key={tag}
                  selected={false}
                  aria-disabled={preferences.hashtags.length >= MAX_HASHTAGS || undefined}
                  onClick={() => dispatch(addHashtag(tag))}
                >
                  #{tag}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </SettingsSection>

      <SettingsSection id="settings-live" title={t('settings.live')}>
        <Switch
          label={t('settings.liveLabel')}
          description={t('settings.liveHint')}
          checked={preferences.liveUpdates}
          onChange={(checked) => dispatch(setLiveUpdates(checked))}
        />
      </SettingsSection>

      <SettingsSection id="settings-appearance" title={t('settings.appearance')}>
        <RadioCards
          legend={t('header.theme')}
          name="theme"
          value={preferences.theme}
          options={themeOptions}
          onChange={(value) => dispatch(setTheme(value))}
        />
        <LanguageSelect showLabel className="max-w-xs" />
      </SettingsSection>
    </div>
  );
}
