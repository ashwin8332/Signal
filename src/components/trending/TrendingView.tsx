'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentType } from '@/types/content';
import { useGetTrendingQuery } from '@/services/contentApi';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { ErrorState, StateView } from '@/components/ui/StateViews';
import { GRID_CLASSES, SkeletonGrid } from '@/components/content/ContentGrid';
import { ContentCard } from '@/components/content/ContentCard';
import { SOURCE_ICON } from '@/components/content/SourceBadge';

type TrendingType = 'all' | ContentType;
const PANEL_ID = 'trending-panel';

export function TrendingView() {
  const { t } = useTranslation();
  const [type, setType] = useState<TrendingType>('all');
  const { data, isLoading, isFetching, isError, refetch } = useGetTrendingQuery(type);

  const options = [
    { value: 'all' as const, label: t('sources.all') },
    ...(['news', 'movie', 'social'] as ContentType[]).map((value) => {
      const Icon = SOURCE_ICON[value];
      return { value, label: t(`sources.${value}Plural`), icon: <Icon aria-hidden="true" className="h-4 w-4" /> };
    }),
  ];

  return (
    <section aria-labelledby="trending-title">
      <PageHeader title={t('trending.title')} titleId="trending-title" description={t('trending.subtitle')} />
      <Tabs label={t('trending.tabsLabel')} value={type} options={options} onChange={setType} controls={PANEL_ID} className="mb-6" />

      <div id={PANEL_ID} role="tabpanel" aria-label={t('trending.tabsLabel')} aria-busy={isFetching}>
        {isLoading ? (
          <SkeletonGrid />
        ) : isError ? (
          <ErrorState title={t('trending.errorTitle')} body={t('trending.errorBody')} onRetry={() => void refetch()} retrying={isFetching} />
        ) : !data || data.length === 0 ? (
          <StateView icon={<Flame className="h-6 w-6" />} title={t('trending.emptyTitle')} body={t('trending.emptyBody')} />
        ) : (
          <div className="@container">
          <ol className={GRID_CLASSES}>
            {data.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: isFetching ? 0.6 : 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
              >
                <ContentCard item={item} rank={index + 1} />
              </motion.li>
            ))}
          </ol>
          </div>
        )}
      </div>
    </section>
  );
}
