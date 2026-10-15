'use client';

import { useState, type FormEvent } from 'react';
import { Check, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { profileSchema } from '@/lib/validation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AVATAR_COLORS, updateProfile, type AvatarColor } from '@/features/profile/profileSlice';
import { selectDisplayName } from '@/features/feed/selectors';
import { showToast } from '@/features/ui/uiSlice';
import { PageHeader } from '@/components/ui/PageHeader';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { AVATAR_CLASSES, Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

export function ProfileView() {
  const hydrated = useAppSelector((state) => state.ui.hydrated);
  const userLoaded = useAppSelector((state) => state.auth.user !== null);
  // Mount the form once saved profile and account are known, so its initial values are right.
  return hydrated && userLoaded ? <ProfileForm /> : <ProfileSkeleton />;
}

function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-4">
      <div className="skeleton h-9 w-40 rounded" />
      <div className="skeleton h-72 w-full max-w-2xl rounded-card" />
    </div>
  );
}

function ProfileForm() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const currentName = useAppSelector(selectDisplayName);
  const email = useAppSelector((state) => state.auth.user?.email ?? '');
  const profile = useAppSelector((state) => state.profile);

  const [displayName, setDisplayName] = useState(currentName);
  const [bio, setBio] = useState(profile.bio);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(profile.avatarColor);
  const [errors, setErrors] = useState<{ displayName?: string; bio?: string }>({});

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = profileSchema.safeParse({ displayName, bio, avatarColor });
    if (!parsed.success) {
      const fields = new Set(parsed.error.issues.map((issue) => issue.path[0]));
      setErrors({
        displayName: fields.has('displayName') ? t('profile.displayNameError') : undefined,
        bio: fields.has('bio') ? t('profile.bioError') : undefined,
      });
      return;
    }
    setErrors({});
    dispatch(updateProfile(parsed.data));
    dispatch(showToast({ message: 'profile.saved', tone: 'success' }));
  };

  return (
    <section aria-labelledby="profile-title">
      <PageHeader title={t('profile.title')} titleId="profile-title" description={t('profile.subtitle')} />
      <form onSubmit={onSubmit} noValidate className="brut-lg flex max-w-2xl flex-col gap-6 bg-surface p-5 md:p-6">
        <div className="flex items-center gap-4 border-b-[3px] border-ink pb-5">
          <Avatar name={displayName || '?'} color={avatarColor} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-2xl font-black text-fg">{displayName || '…'}</p>
            <p className="truncate font-mono text-xs font-bold text-fg-muted">
              <span className="sr-only">{t('profile.email')}: </span>
              {email}
            </p>
          </div>
        </div>

        <TextField
          label={t('profile.displayName')}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          error={errors.displayName}
          autoComplete="nickname"
          maxLength={60}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-bio" className="font-mono text-xs font-bold uppercase tracking-wider text-fg">
            {t('profile.bio')}
          </label>
          <textarea
            id="profile-bio"
            rows={3}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            aria-invalid={errors.bio ? true : undefined}
            aria-describedby="profile-bio-hint"
            className={cn(
              'w-full resize-y border-2 bg-surface px-3 py-2 text-base text-fg sm:text-sm',
              'focus-visible:shadow-brut-sm focus-visible:outline-none',
              errors.bio || bio.length > 160 ? 'border-danger' : 'border-ink',
            )}
          />
          <p id="profile-bio-hint" className={cn('text-sm', bio.length > 160 ? 'text-danger' : 'text-fg-muted')} aria-live="polite">
            {errors.bio ?? t('profile.bioHint', { count: bio.length })}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-fg">{t('profile.avatarColor')}</legend>
          <div className="flex flex-wrap gap-3">
            {AVATAR_COLORS.map((color) => (
              <label key={color} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="avatar-color"
                  value={color}
                  checked={avatarColor === color}
                  onChange={() => setAvatarColor(color)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    'flex h-11 w-11 items-center justify-center border-2 border-ink transition-shadow',
                    'peer-checked:shadow-brut peer-focus-visible:outline-3 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-focus',
                    AVATAR_CLASSES[color],
                  )}
                >
                  {avatarColor === color && <Check aria-hidden="true" className="h-5 w-5" />}
                </span>
                <span className="sr-only">{t(`profile.colors.${color}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <Button type="submit" icon={<Save className="h-4 w-4" aria-hidden="true" />}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </section>
  );
}
