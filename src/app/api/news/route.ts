import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PageResponse } from '@/types/content';
import { newsQuerySchema } from '@/lib/validation';
import { getNews } from '@/lib/server/providers';
import { getSessionUser, handleRouteError, parseQuery, unauthorized } from '@/lib/server/http';

/** GET /api/news?categories=technology,sports&page=1&pageSize=9 */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();
  const parsed = parseQuery(request, newsQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { categories, page, pageSize } = parsed.data;
  try {
    const result = await getNews(categories, page, pageSize);
    return NextResponse.json<PageResponse>({ ...result, page });
  } catch (error) {
    return handleRouteError(error);
  }
}
