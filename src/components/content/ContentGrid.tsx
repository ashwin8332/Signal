'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useDrag, useDrop } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import type { ContentItem } from '@/types/content';
import { cn } from '@/lib/cn';
import { ContentCard, ContentCardSkeleton } from './ContentCard';

/**
 * Columns follow the width of the grid's container (not the viewport), so the
 * same grid works full-width and next to the dashboard rail. Wrap grids in
 * an element with the `@container` class.
 */
export const GRID_CLASSES = 'grid grid-cols-1 gap-5 @xl:grid-cols-2 @5xl:grid-cols-3';
const CARD = 'content-card';

interface DragItem {
  id: string;
  index: number;
}

/** Static grid (Trending, Favorites, Search). */
export function ContentGrid({ items, renderExtra }: { items: ContentItem[]; renderExtra?: (item: ContentItem, index: number) => ReactNode }) {
  return (
    <div className="@container">
    <ul className={GRID_CLASSES}>
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          layout="position"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: Math.min(index, 8) * 0.03 }}
        >
          <ContentCard item={item} />
          {renderExtra?.(item, index)}
        </motion.li>
      ))}
    </ul>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="@container">
      <ul className={GRID_CLASSES} aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <ContentCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReorderableGridProps {
  items: ContentItem[];
  onMove: (from: number, to: number) => void;
  id?: string;
  /** Feature the first card: whatever the reader moves to the top becomes the spotlight. */
  spotlight?: boolean;
}

/**
 * The feed grid. Pointer users drag a card's handle (react-dnd, HTML5
 * backend). Keyboard and touch users get "Move earlier/later" buttons, and a
 * live region announces the new position (WCAG 2.5.7 dragging alternative).
 * Framer Motion animates the reflow either way.
 */
export function ReorderableGrid({ items, onMove, id, spotlight = false }: ReorderableGridProps) {
  const { t } = useTranslation();
  const [announcement, setAnnouncement] = useState('');
  const pendingFocus = useRef<string | null>(null);

  // After a keyboard move React re-orders the DOM, so put focus back on the
  // same control of the moved card (or its sibling if that one is now disabled).
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;
    const [itemId, direction] = target.split('|') as [string, 'earlier' | 'later'];
    const other = direction === 'earlier' ? 'later' : 'earlier';
    const button =
      document.querySelector<HTMLButtonElement>(`[data-move="${CSS.escape(`${itemId}:${direction}`)}"]:not(:disabled)`) ??
      document.querySelector<HTMLButtonElement>(`[data-move="${CSS.escape(`${itemId}:${other}`)}"]`);
    button?.focus();
  });

  const moveWithKeyboard = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 0 || to >= items.length) return;
    pendingFocus.current = `${items[index]!.id}|${delta < 0 ? 'earlier' : 'later'}`;
    onMove(index, to);
    setAnnouncement(t('feed.movedTo', { position: to + 1, total: items.length }));
  };

  return (
    <div className="@container">
      <ul id={id} className={GRID_CLASSES}>
        {items.map((item, index) => (
          <SortableCard
            key={item.id}
            item={item}
            index={index}
            total={items.length}
            featured={spotlight && index === 0}
            onHoverMove={onMove}
            onMoveEarlier={() => moveWithKeyboard(index, -1)}
            onMoveLater={() => moveWithKeyboard(index, 1)}
          />
        ))}
      </ul>
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

function SortableCard({
  item,
  index,
  total,
  featured,
  onHoverMove,
  onMoveEarlier,
  onMoveLater,
}: {
  item: ContentItem;
  index: number;
  total: number;
  featured: boolean;
  onHoverMove: (from: number, to: number) => void;
  onMoveEarlier: () => void;
  onMoveLater: () => void;
}) {
  const nodeRef = useRef<HTMLLIElement | null>(null);

  const [{ isDragging }, drag, preview] = useDrag(
    () => ({
      type: CARD,
      item: (): DragItem => ({ id: item.id, index }),
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [item.id, index],
  );

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(
    () => ({
      accept: CARD,
      collect: (monitor) => ({ isOver: monitor.isOver() && monitor.getItem<DragItem>()?.id !== item.id }),
      hover(dragged, monitor) {
        const node = nodeRef.current;
        const pointer = monitor.getClientOffset();
        const from = dragged.index;
        if (!node || !pointer || from === index) return;
        // Only swap once the pointer crosses the target's midpoint in the
        // direction of travel. This prevents jitter between neighbours.
        const rect = node.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        const midY = rect.top + rect.height / 2;
        const forward = from < index;
        const crossed = forward ? pointer.x > midX || pointer.y > midY : pointer.x < midX || pointer.y < midY;
        if (!crossed) return;
        onHoverMove(from, index);
        dragged.index = index; // the dragged card now lives here
      },
    }),
    [index, item.id, onHoverMove],
  );

  return (
    <motion.li
      ref={(node: HTMLLIElement | null) => {
        nodeRef.current = node;
        drop(preview(node));
      }}
      layout
      transition={{ layout: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
      className={cn(featured && '@xl:col-span-2', isOver && 'outline-dashed outline-[3px] outline-offset-4 outline-ink')}
    >
      <ContentCard
        item={item}
        featured={featured}
        reorder={{
          position: index + 1,
          total,
          onMoveEarlier,
          onMoveLater,
        }}
        connectDragHandle={(node) => {
          drag(node);
        }}
      />
    </motion.li>
  );
}
