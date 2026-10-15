import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PageResponse } from '@/types/content';
import { recommendationsQuerySchema } from '@/lib/validation';
import { getMovies } from '@/lib/server/providers';
import { getSessionUser, handleRouteError, parseQuery, unauthorized } from '@/lib/server/http';

/** GET /api/recommendations?genres=drama,comedy&page=1&pageSize=9 */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();
  const parsed = parseQuery(request, recommendationsQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { genres, page, pageSize } = parsed.data;
  try {
    const result = await getMovies(genres, page, pageSize);
    return NextResponse.json<PageResponse>({ ...result, page });
  } catch (error) {
    return handleRouteError(error);
  }
}
