'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { flushPending, setSourceFilter } from '@/features/feed/feedSlice';

/**
 * "3 new posts": live items wait here instead of pushing the feed down while
 * someone is reading. Clicking shows them at the top and scrolls there.
 */
export function LivePill() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const count = useAppSelector((state) => state.feed.pending.length);
  const filter = useAppSelector((state) => state.feed.sourceFilter);
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none sticky top-32 z-20 flex h-0 justify-center">
      <AnimatePresence>
        {count > 0 && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              dispatch(flushPending());
              // Live posts are social; make sure they're visible under the current filter.
              if (filter !== 'all' && filter !== 'social') dispatch(setSourceFilter('all'));
              window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
            }}
            className="brut press pointer-events-auto inline-flex h-11 items-center gap-2 bg-amber px-4 font-mono text-xs font-bold uppercase tracking-wide text-[#121210]"
          >
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
            {t('feed.newPosts', { count })}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
