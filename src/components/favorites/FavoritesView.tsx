'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Bookmark, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { PageHeader } from '@/components/ui/PageHeader';
import { StateView } from '@/components/ui/StateViews';
import { buttonClasses } from '@/components/ui/Button';
import { ContentGrid, SkeletonGrid } from '@/components/content/ContentGrid';

/** Saved items, read straight from the persisted snapshot: instant and offline. */
export function FavoritesView() {
  const { t } = useTranslation();
  const hydrated = useAppSelector((state) => state.ui.hydrated);
  const ids = useAppSelector((state) => state.favorites.ids);
  const entities = useAppSelector((state) => state.favorites.entities);
  const items = useMemo(() => ids.map((id) => entities[id]!).filter(Boolean), [ids, entities]);

  return (
    <section aria-labelledby="favorites-title">
      <PageHeader
        title={t('favorites.title')}
        titleId="favorites-title"
        description={t('favorites.subtitle')}
        actions={items.length > 0 && <p className="text-sm text-fg-muted">{t('favorites.count', { count: items.length })}</p>}
      />
      {!hydrated ? (
        <SkeletonGrid count={3} />
      ) : items.length === 0 ? (
        <StateView
          icon={<Bookmark className="h-6 w-6" />}
          title={t('favorites.emptyTitle')}
          body={t('favorites.emptyBody')}
          action={
            <Link href="/dashboard" className={buttonClasses('primary')}>
              <Home className="h-4 w-4" aria-hidden="true" />
              {t('favorites.emptyAction')}
            </Link>
          }
        />
      ) : (
        <ContentGrid items={items} />
      )}
    </section>
  );
}
