import { NextRequest } from "next/server";

import { getLatestJobEvent, subscribeToJob } from "@/lib/server/jobs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const current = getLatestJobEvent(params.id);
      if (current) {
        send(current);
      } else {
        send({ projectId: params.id, progress: 0, step: "uploaded", message: "Waiting for job..." });
      }

      const unsubscribe = subscribeToJob(params.id, send);
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 5000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
