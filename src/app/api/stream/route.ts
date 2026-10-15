import type { NextRequest } from 'next/server';
import { SUGGESTED_HASHTAGS } from '@/lib/constants';
import { socialQuerySchema } from '@/lib/validation';
import { serverEnv } from '@/lib/server/env';
import { mockLivePost } from '@/lib/server/mock/social';
import { getSessionUser, unauthorized } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 15_000;

/**
 * GET /api/stream?hashtags=ai,webdev  (Server-Sent Events)
 * Emits `event: post` with a new ContentItem every LIVE_FEED_INTERVAL_MS, and
 * a comment heartbeat so proxies keep the connection open.
 */
export async function GET(request: NextRequest) {
  if (!getSessionUser(request)) return unauthorized();

  const parsed = socialQuerySchema.shape.hashtags.safeParse(request.nextUrl.searchParams.get('hashtags') ?? '');
  const hashtags = parsed.success ? parsed.data : [...SUGGESTED_HASHTAGS];
  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };
      // Ask the browser to wait 5 s before its built-in reconnect.
      send('retry: 5000\n\n');
      const postTimer = setInterval(() => {
        send(`event: post\ndata: ${JSON.stringify(mockLivePost(hashtags))}\n\n`);
      }, serverEnv.liveFeedIntervalMs);
      const heartbeatTimer = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);

      cleanup = () => {
        clearInterval(postTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      request.signal.addEventListener('abort', cleanup, { once: true });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
