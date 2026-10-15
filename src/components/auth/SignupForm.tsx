'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, signup } from '@/features/auth/authSlice';
import { safeRedirectPath, signupSchema } from '@/lib/validation';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { PasswordField } from './PasswordField';

type Field = 'name' | 'email' | 'password';

export function SignupForm() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useSearchParams();
  // New accounts land in Settings to pick interests, unless they came from a specific page.
  const next = safeRedirectPath(params.get('next'), '/settings');

  const serverError = useAppSelector((state) => state.auth.error);
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState<Record<Field, boolean>>({ name: false, email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);
  useEffect(() => {
    if (serverError) alertRef.current?.focus();
  }, [serverError]);

  const parsed = signupSchema.safeParse(values);
  const invalid = new Set(parsed.success ? [] : parsed.error.issues.map((issue) => issue.path[0] as Field));
  const errorFor = (field: Field, message: string) => ((touched[field] || submitted) && invalid.has(field) ? message : null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!parsed.success) return;
    setPending(true);
    const result = await dispatch(signup(parsed.data));
    setPending(false);
    if (signup.fulfilled.match(result)) {
      router.replace(next);
      router.refresh();
    }
  };

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [field]: event.target.value })),
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
  });

  return (
    <div className="flex flex-col gap-6">
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
        <TextField label={t('auth.name')} name="name" autoComplete="name" maxLength={60} required error={errorFor('name', t('auth.errorName'))} {...bind('name')} />
        <TextField
          label={t('auth.email')}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          error={errorFor('email', t('auth.errorEmail'))}
          {...bind('email')}
        />
        <PasswordField
          label={t('auth.password')}
          name="password"
          autoComplete="new-password"
          hint={t('auth.passwordHint')}
          required
          error={errorFor('password', t('auth.errorPasswordLength'))}
          {...bind('password')}
        />
        <Button type="submit" loading={pending} className="mt-2 w-full">
          {pending ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </form>
      <p className="text-center text-sm text-fg-muted">
        {t('auth.haveAccount')}{' '}
        <Link href="/login" className="font-bold text-fg underline decoration-2 underline-offset-4 hover:decoration-accent">
          {t('auth.signInLink')}
        </Link>
      </p>
    </div>
  );
}
