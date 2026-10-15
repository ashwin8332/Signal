'use client';

import Link from 'next/link';
import { Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StateView } from '@/components/ui/StateViews';
import { buttonClasses } from '@/components/ui/Button';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <main className="flex min-h-dvh items-center justify-center">
      <StateView
        icon={<Compass className="h-6 w-6" />}
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={
          <Link href="/dashboard" className={buttonClasses('primary')}>
            {t('notFound.action')}
          </Link>
        }
      />
    </main>
  );
}
