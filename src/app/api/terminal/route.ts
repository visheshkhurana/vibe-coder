// ============================================================
// POST /api/terminal — Execute shell commands
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { runCommand, ensureWorkspace } from "@/lib/sandbox";

export async function POST(req: NextRequest) {
  const { command, sessionId, cwd } = await req.json();

  if (!sessionId || !command) {
    return NextResponse.json({ error: "Missing sessionId or command" }, { status: 400 });
  }

  await ensureWorkspace(sessionId);

  try {
    const result = await runCommand(sessionId, command, cwd);
    return NextResponse.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
