import { NextRequest } from 'next/server';
import { runOrchestrator } from '@/lib/agents/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const { query } = (await req.json()) as { query: string };

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'query is required' }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      const ping = () => controller.enqueue(encoder.encode(': ping\n\n'));

      // Keepalive: prevents proxies and Cloud Run from closing idle SSE connections
      const keepalive = setInterval(ping, 15000);

      try {
        for await (const event of runOrchestrator(query)) {
          send(event);
          if (event.type === 'done') break;
        }
      } catch (err) {
        send({ type: 'error', message: String(err) });
        send({ type: 'done' });
      } finally {
        clearInterval(keepalive);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
