'use client';

import { useState } from 'react';
import { Pause, Play, Zap } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ContentItem } from '@/types/content';
import { cn } from '@/lib/cn';

/**
 * Scrolling headline strip. The scrolling copy is decorative and hidden from
 * assistive tech, because the same items are in the feed below. It has a
 * pause button (WCAG 2.2.2), pauses on hover, and stays still under
 * reduced motion.
 */
export function HeadlineTicker({ items }: { items: ContentItem[] }) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  if (items.length === 0) return null;

  const headlines = items.slice(0, 10);
  const still = paused || Boolean(reduceMotion);
  // Rendered twice so the loop is seamless (the animation moves by -50%).
  const strip = [...headlines, ...headlines];

  return (
    <div className="brut flex h-11 items-stretch overflow-hidden bg-bar text-bar-fg">
      <span className="flex shrink-0 items-center gap-1.5 border-r-[3px] border-ink bg-amber px-3 font-mono text-[11px] font-bold uppercase tracking-wider text-[#121210]">
        <Zap aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" />
        {t('dashboard.ticker')}
      </span>
      <div className="group relative flex-1 overflow-hidden" aria-hidden="true">
        <div
          className={cn(
            'flex h-full w-max items-center gap-8 whitespace-nowrap pl-6 font-mono text-xs font-bold uppercase tracking-wide',
            !still && 'animate-ticker group-hover:[animation-play-state:paused]',
          )}
        >
          {strip.map((item, index) => (
            <span key={`${item.id}-${index}`} className="flex items-center gap-8">
              <span>{item.title}</span>
              <span className="text-accent">■</span>
            </span>
          ))}
        </div>
      </div>
      {!reduceMotion && (
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          aria-label={t(paused ? 'dashboard.playTicker' : 'dashboard.pauseTicker')}
          aria-pressed={paused}
          className="flex w-11 shrink-0 items-center justify-center border-l-[3px] border-ink hover:bg-white/10"
        >
          {paused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}
