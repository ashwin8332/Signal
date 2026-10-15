import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignupPage } from './SignupPage';

export const metadata: Metadata = { title: 'Create account' };

export default function Page() {
  return (
    <Suspense>
      <SignupPage />
    </Suspense>
  );
}
