'use client';

import { Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ContentItem } from '@/types/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { restoreFavorite, toggleFavorite } from '@/features/favorites/favoritesSlice';
import { showToast } from '@/features/ui/uiSlice';
import { cn } from '@/lib/cn';

/**
 * Bookmark toggle. aria-pressed announces the state and the label names the
 * action. Removing offers Undo instead of a confirmation dialog, because the
 * action is reversible.
 */
export function FavoriteButton({ item }: { item: ContentItem }) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector((state) => Boolean(state.favorites.entities[item.id]));
  const index = useAppSelector((state) => state.favorites.ids.indexOf(item.id));
  const label = t(isFavorite ? 'card.removeFavorite' : 'card.addFavorite', { title: item.title });

  const onClick = () => {
    dispatch(toggleFavorite(item));
    dispatch(
      isFavorite
        ? showToast({
            message: 'card.removedFromFavorites',
            tone: 'info',
            action: { label: 'common.undo', dispatch: restoreFavorite({ item, index }) },
          })
        : showToast({ message: 'card.savedToFavorites', tone: 'success' }),
    );
  };

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center border-2 transition-colors duration-150 pointer-fine:h-9 pointer-fine:w-9',
        isFavorite ? 'border-ink bg-amber text-[#121210]' : 'border-transparent text-fg hover:border-ink hover:bg-surface-3',
      )}
    >
      <motion.span
        key={String(isFavorite)}
        initial={{ scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        className="flex"
      >
        <Bookmark aria-hidden="true" className="h-5 w-5" fill={isFavorite ? 'currentColor' : 'none'} />
      </motion.span>
    </button>
  );
}
