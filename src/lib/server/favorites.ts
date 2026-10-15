import 'server-only';
import type { ContentItem } from '@/types/content';
import { supabaseRequest, withSupabase } from './supabase';

export const MAX_FAVORITES_PER_USER = 200;

/**
 * Per-user favorites. In Supabase that's one `user_favorites` row per
 * (user_id, item_id); without Supabase, a per-user map in server memory.
 * Every function takes the user id from the verified session, never from
 * the request, so users can only ever touch their own favorites.
 */

const globalStore = globalThis as typeof globalThis & { __signalFavorites?: Map<string, Map<string, ContentItem>> };
function memoryFor(userId: string): Map<string, ContentItem> {
  globalStore.__signalFavorites ??= new Map();
  let favorites = globalStore.__signalFavorites.get(userId);
  if (!favorites) {
    favorites = new Map();
    globalStore.__signalFavorites.set(userId, favorites);
  }
  return favorites;
}

interface FavoriteRow {
  item: ContentItem;
}

/** Newest first. */
export async function listFavorites(userId: string): Promise<ContentItem[]> {
  return withSupabase(
    async () => {
      const rows = await supabaseRequest<FavoriteRow[]>('user_favorites', {
        query: { select: 'item', user_id: `eq.${userId}`, order: 'created_at.desc', limit: String(MAX_FAVORITES_PER_USER) },
      });
      return rows.map((row) => row.item);
    },
    () => [...memoryFor(userId).values()].reverse(),
  );
}

/** Idempotent: saving an item twice keeps one row (and refreshes its snapshot). */
export async function saveFavorite(userId: string, item: ContentItem): Promise<void> {
  await withSupabase(
    async () => {
      await supabaseRequest('user_favorites', {
        method: 'POST',
        query: { on_conflict: 'user_id,item_id' },
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: { user_id: userId, item_id: item.id, item },
      });
    },
    () => {
      const favorites = memoryFor(userId);
      favorites.delete(item.id);
      favorites.set(item.id, item);
      while (favorites.size > MAX_FAVORITES_PER_USER) favorites.delete(favorites.keys().next().value as string);
    },
  );
}

export async function deleteFavorite(userId: string, itemId: string): Promise<void> {
  await withSupabase(
    async () => {
      await supabaseRequest('user_favorites', {
        method: 'DELETE',
        query: { user_id: `eq.${userId}`, item_id: `eq.${itemId}` },
        prefer: 'return=minimal',
      });
    },
    () => {
      memoryFor(userId).delete(itemId);
    },
  );
}

export function resetFavoriteStore(): void {
  globalStore.__signalFavorites = new Map();
}
