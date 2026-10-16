import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/server/env';
import { isSupabaseConfigured, storageMode } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health: deployment check. Public on purpose, so it reports only
 * which integrations are configured (booleans) and never a key or value.
 */
export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      integrations: {
        newsApi: Boolean(serverEnv.newsApiKey),
        tmdb: Boolean(serverEnv.tmdbToken || serverEnv.tmdbApiKey),
        supabase: isSupabaseConfigured(),
        authSecret: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32),
      },
      storage: storageMode(),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
