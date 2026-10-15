'use client';

import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * "Why you're seeing this": turns a machine reason like `category:technology`
 * into "You follow Technology". It makes personalization legible.
 */
export function useReasonText(reason: string): string {
  const { t } = useTranslation();
  const [kind, value = ''] = reason.split(':');
  switch (kind) {
    case 'category':
      return t('card.reason_category', { value: t(`categories.${value}`, { defaultValue: value }) });
    case 'genre':
      return t('card.reason_genre', { value: t(`genres.${value}`, { defaultValue: value }) });
    case 'hashtag':
      return t('card.reason_hashtag', { value });
    case 'trending':
    case 'search':
    case 'live':
      return t(`card.reason_${kind}`);
    default:
      return '';
  }
}

export function ReasonChip({ reason }: { reason: string }) {
  const { t } = useTranslation();
  const text = useReasonText(reason);
  if (!text) return null;
  return (
    <p className="tag max-w-full self-start bg-primary-soft text-primary-soft-fg">
      <Sparkles aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="sr-only">{t('card.why')}: </span>
      <span className="truncate">{text}</span>
    </p>
  );
}
