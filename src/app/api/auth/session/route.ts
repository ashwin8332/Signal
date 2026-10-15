import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionUser, unauthorized } from '@/lib/server/http';

/** GET /api/auth/session: the signed-in user, or 401. */
export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) return unauthorized();
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
