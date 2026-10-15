import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { TrendingResponse } from '@/types/content';
import { trendingQuerySchema } from '@/lib/validation';
import { getTrending } from '@/lib/server/providers';
import { getSessionUser, handleRouteError, parseQuery, unauthorized } from '@/lib/server/http';

/** GET /api/trending?type=all|news|movie|social&limit=10 */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();
  const parsed = parseQuery(request, trendingQuerySchema);
  if (!parsed.ok) return parsed.response;
  try {
    const items = await getTrending(parsed.data.type, parsed.data.limit);
    return NextResponse.json<TrendingResponse>({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
