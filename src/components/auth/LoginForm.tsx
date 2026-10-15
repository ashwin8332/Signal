'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login, loginDemo } from '@/features/auth/authSlice';
import { safeRedirectPath } from '@/lib/validation';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PasswordField } from './PasswordField';

const emailSchema = z.email();

export function LoginForm() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeRedirectPath(params.get('next'), '/dashboard');
  const expired = params.get('expired') === '1';

  const serverError = useAppSelector((state) => state.auth.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState<'form' | 'demo' | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  // Move focus to the error so screen-reader users hear it right away.
  useEffect(() => {
    if (serverError) alertRef.current?.focus();
  }, [serverError]);

  const emailError =
    (touched.email || submitted) && !emailSchema.safeParse(email.trim()).success ? t('auth.errorEmail') : null;
  const passwordError = (touched.password || submitted) && password.length === 0 ? t('auth.errorPasswordRequired') : null;

  const finish = () => {
    router.replace(next);
    router.refresh();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!emailSchema.safeParse(email.trim()).success || password.length === 0) return;
    setPending('form');
    const result = await dispatch(login({ email: email.trim(), password }));
    setPending(null);
    if (login.fulfilled.match(result)) finish();
    else setPassword('');
  };

  const onDemo = async () => {
    setPending('demo');
    const result = await dispatch(loginDemo());
    setPending(null);
    if (loginDemo.fulfilled.match(result)) finish();
  };

  return (
    <div className="flex flex-col gap-6">
      {expired && !serverError && (
        <p role="status" className="flex items-start gap-2 rounded-control bg-warning-soft px-3 py-2.5 text-sm text-warning-fg">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {t('auth.sessionExpired')}
        </p>
      )}
      {serverError && (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger outline-none"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {serverError}
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <TextField
          label={t('auth.email')}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onBlur={() => setTouched((value) => ({ ...value, email: true }))}
          error={emailError}
          required
        />
        <PasswordField
          label={t('auth.password')}
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setTouched((value) => ({ ...value, password: true }))}
          error={passwordError}
          required
        />
        <Button type="submit" loading={pending === 'form'} disabled={pending !== null} className="mt-2 w-full">
          {pending === 'form' ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <div className="flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-wide text-fg-muted">
        <span className="h-0.5 flex-1 bg-ink" />
        {t('auth.or')}
        <span className="h-0.5 flex-1 bg-ink" />
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => void onDemo()}
        loading={pending === 'demo'}
        disabled={pending !== null}
        icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
      >
        {t('auth.demo')}
      </Button>

      <p className="text-center text-sm text-fg-muted">
        {t('auth.noAccount')}{' '}
        <Link
          href={next === '/dashboard' ? '/signup' : `/signup?next=${encodeURIComponent(next)}`}
          className="font-bold text-fg underline decoration-2 underline-offset-4 hover:decoration-accent"
        >
          {t('auth.signUpLink')}
        </Link>
      </p>
    </div>
  );
}
