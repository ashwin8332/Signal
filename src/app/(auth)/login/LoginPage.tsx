'use client';

import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';

export function LoginPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')}>
      <LoginForm />
    </AuthLayout>
  );
}
