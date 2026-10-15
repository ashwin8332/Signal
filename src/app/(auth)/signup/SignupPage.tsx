'use client';

import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SignupForm } from '@/components/auth/SignupForm';

export function SignupPage() {
  const { t } = useTranslation();
  return (
    <AuthLayout title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')}>
      <SignupForm />
    </AuthLayout>
  );
}
