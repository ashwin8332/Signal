'use client';

import { Clapperboard, MessageCircle, Newspaper, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ContentType } from '@/types/content';
import { cn } from '@/lib/cn';

export const SOURCE_ICON: Record<ContentType, LucideIcon> = {
  news: Newspaper,
  movie: Clapperboard,
  social: MessageCircle,
};

/** Accent text color per source (used for small marks, legends and bars). */
export const SOURCE_TEXT: Record<ContentType, string> = {
  news: 'text-news',
  movie: 'text-film',
  social: 'text-social',
};

/** Solid tag background per source: ink text on a pastel keeps ≥ 7:1 contrast. */
export const SOURCE_TAG: Record<ContentType, string> = {
  news: 'bg-news-soft',
  movie: 'bg-film-soft',
  social: 'bg-social-soft',
};

export const SOURCE_BAR: Record<ContentType, string> = {
  news: 'bg-news',
  movie: 'bg-film',
  social: 'bg-social',
};

/** Source identity as icon + label + color: never color alone (WCAG 1.4.1). */
export function SourceBadge({ type, className }: { type: ContentType; className?: string }) {
  const { t } = useTranslation();
  const Icon = SOURCE_ICON[type];
  return (
    <span className={cn('tag text-fg', SOURCE_TAG[type], className)}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {t(`sources.${type}`)}
    </span>
  );
}
