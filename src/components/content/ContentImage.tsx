'use client';

import { useState } from 'react';
import type { ContentType } from '@/types/content';
import { cn } from '@/lib/cn';
import { SOURCE_ICON } from './SourceBadge';

const FALLBACK_BG: Record<ContentType, string> = {
  news: 'bg-news-soft',
  movie: 'bg-film-soft',
  social: 'bg-social-soft',
};

// Diagonal hatching: a print-like texture that reads as "no photo" at a glance.
const HATCH = {
  backgroundImage: 'repeating-linear-gradient(-45deg, rgb(18 18 16 / 0.08) 0 2px, transparent 2px 12px)',
};

/**
 * Fixed 16:9 frame (no layout shift), lazy-loaded, and a branded fallback
 * when the image is missing or fails. Decorative (alt=""), because the card
 * title already names the item.
 */
export function ContentImage({ src, type, className }: { src: string | null; type: ContentType; className?: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const Icon = SOURCE_ICON[type];
  const showImage = src && !failed;

  return (
    <div className={cn('relative aspect-video w-full overflow-hidden bg-surface-2', className)}>
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out-soft group-hover:scale-[1.03]',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      ) : (
        <div className={cn('flex h-full w-full items-center justify-center', FALLBACK_BG[type])} style={HATCH}>
          <span className="brut-sm flex h-16 w-16 items-center justify-center bg-surface text-fg">
            <Icon aria-hidden="true" className="h-8 w-8" />
          </span>
        </div>
      )}
      {showImage && !loaded && <div aria-hidden="true" className="skeleton absolute inset-0" />}
    </div>
  );
}
