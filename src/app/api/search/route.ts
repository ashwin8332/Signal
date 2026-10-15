import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { SearchResponse } from '@/types/content';
import { searchQuerySchema } from '@/lib/validation';
import { searchContent } from '@/lib/server/providers';
import { getSessionUser, handleRouteError, jsonError, parseQuery, unauthorized } from '@/lib/server/http';

/**
 * GET /api/search?q=ai&type=all&page=1
 * Sources are searched in parallel; a failing source is reported in
 * `failedSources` instead of failing the whole search.
 */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();
  const parsed = parseQuery(request, searchQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { q, type, page } = parsed.data;
  try {
    const { allFailed, ...result } = await searchContent(q, type, page);
    if (allFailed) return jsonError(502, 'UPSTREAM_ERROR', 'Search is unavailable right now.');
    return NextResponse.json<SearchResponse>({ ...result, page });
  } catch (error) {
    return handleRouteError(error);
  }
}
