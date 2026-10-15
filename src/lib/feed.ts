import type { ContentItem } from '@/types/content';

/**
 * Round-robin merge, so no single source floods the top of the feed:
 * [n1, n2] + [m1] + [s1, s2, s3] → n1, m1, s1, n2, s2, s3.
 */
export function interleave<T>(...lists: T[][]): T[] {
  const result: T[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let index = 0; index < longest; index += 1) {
    for (const list of lists) {
      const item = list[index];
      if (item !== undefined) result.push(item);
    }
  }
  return result;
}

/** Drops later duplicates (the same item can appear on two pages after live inserts). */
export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Applies the user's saved order. Items the user has positioned come first, in
 * that order. Anything not yet positioned (newly loaded pages) follows in its
 * natural order, so loading more content never scrambles a custom arrangement.
 * Saved ids that are no longer loaded are ignored.
 */
export function applyOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;
  const byId = new Map(items.map((item) => [item.id, item]));
  const ordered: T[] = [];
  const placed = new Set<string>();
  for (const id of order) {
    const item = byId.get(id);
    if (item && !placed.has(id)) {
      ordered.push(item);
      placed.add(id);
    }
  }
  for (const item of items) {
    if (!placed.has(item.id)) ordered.push(item);
  }
  return ordered;
}

/**
 * Moves the item at `from` to `to` within the currently visible list and
 * returns the new full id order. Out-of-range indices return the list unchanged.
 */
export function moveId(visibleIds: string[], from: number, to: number): string[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= visibleIds.length ||
    to >= visibleIds.length
  ) {
    return visibleIds;
  }
  const next = [...visibleIds];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as string);
  return next;
}

/**
 * Merges a reordered *visible* subset back into the full saved order. When the
 * feed is filtered (e.g. "News only"), only the visible ids move; hidden ids
 * keep their slots, so switching back to "All" does not lose their positions.
 */
export function mergeVisibleOrder(fullOrder: string[], visibleBefore: string[], visibleAfter: string[]): string[] {
  const base = uniqueById([...fullOrder, ...visibleBefore].map((id) => ({ id }))).map(({ id }) => id);
  const visibleSet = new Set(visibleBefore);
  const queue = [...visibleAfter];
  return base.map((id) => (visibleSet.has(id) ? (queue.shift() as string) : id));
}

export function countByType(items: ContentItem[]): Record<ContentItem['type'], number> {
  return items.reduce(
    (counts, item) => {
      counts[item.type] += 1;
      return counts;
    },
    { news: 0, movie: 0, social: 0 },
  );
}
