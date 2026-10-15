import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { saveFavoriteSchema } from '@/lib/validation';
import { deleteFavorite, listFavorites, saveFavorite } from '@/lib/server/favorites';
import { storageMode } from '@/lib/server/supabase';
import { getSessionUser, handleRouteError, isSameOrigin, jsonError, parseJsonBody, unauthorized } from '@/lib/server/http';

/**
 * Per-user favorites. The user id always comes from the verified session
 * cookie, never from the request, so nobody can read or change another
 * user's favorites.
 *
 * GET    /api/favorites            → { items, storage }
 * PUT    /api/favorites  { item }  → 204 (idempotent)
 * DELETE /api/favorites?id=…       → 204 (idempotent)
 */
export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return unauthorized();
  try {
    const items = await listFavorites(user.id);
    return NextResponse.json({ items, storage: storageMode() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  const user = getSessionUser(request);
  if (!user) return unauthorized();
  const parsed = await parseJsonBody(request, saveFavoriteSchema);
  if (!parsed.ok) return parsed.response;
  try {
    await saveFavorite(user.id, parsed.data.item);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) return jsonError(403, 'FORBIDDEN', 'Cross-origin request rejected.');
  const user = getSessionUser(request);
  if (!user) return unauthorized();
  const id = request.nextUrl.searchParams.get('id');
  if (!id || id.length > 300) return jsonError(400, 'BAD_REQUEST', 'Invalid "id".');
  try {
    await deleteFavorite(user.id, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleRouteError(error);
  }
}
