// ============================================================
// POST /api/chat — Streaming AI agent endpoint
// ============================================================
import { NextRequest } from "next/server";
import { runAgentLoop } from "@/lib/agent";
import { ensureWorkspace } from "@/lib/sandbox";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { messages, sessionId } = await req.json();

  if (!sessionId || !messages?.length) {
    return new Response(JSON.stringify({ error: "Missing sessionId or messages" }), {
      status: 400,
    });
  }

  await ensureWorkspace(sessionId);

  // Convert frontend messages to Anthropic format
  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Stream Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of runAgentLoop(sessionId, anthropicMessages)) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", content: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
