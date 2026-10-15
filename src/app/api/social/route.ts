import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { PageResponse } from '@/types/content';
import { socialQuerySchema } from '@/lib/validation';
import { getSocial } from '@/lib/server/providers';
import { getSessionUser, handleRouteError, parseQuery, unauthorized } from '@/lib/server/http';

/** GET /api/social?hashtags=ai,webdev&page=1&pageSize=9 (mock social network) */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();
  const parsed = parseQuery(request, socialQuerySchema);
  if (!parsed.ok) return parsed.response;
  const { hashtags, page, pageSize } = parsed.data;
  try {
    const result = await getSocial(hashtags, page, pageSize);
    return NextResponse.json<PageResponse>({ ...result, page });
  } catch (error) {
    return handleRouteError(error);
  }
}
