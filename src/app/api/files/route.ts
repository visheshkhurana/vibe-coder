// ============================================================
// /api/files — File system operations
// GET  ?sessionId=x&path=y  — read file or list directory
// POST { sessionId, path, content } — write file
// DELETE ?sessionId=x&path=y — delete file
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, deleteFile, listFiles, ensureWorkspace } from "@/lib/sandbox";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const filePath = req.nextUrl.searchParams.get("path") || ".";
  const action = req.nextUrl.searchParams.get("action") || "read"; // "read" | "list"

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  await ensureWorkspace(sessionId);

  try {
    if (action === "list") {
      const files = await listFiles(sessionId, filePath);
      return NextResponse.json({ files });
    } else {
      const content = await readFile(sessionId, filePath);
      return NextResponse.json({ content, path: filePath });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  const { sessionId, path: filePath, content } = await req.json();

  if (!sessionId || !filePath) {
    return NextResponse.json({ error: "Missing sessionId or path" }, { status: 400 });
  }

  await ensureWorkspace(sessionId);

  try {
    await writeFile(sessionId, filePath, content || "");
    return NextResponse.json({ success: true, path: filePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  const filePath = req.nextUrl.searchParams.get("path");

  if (!sessionId || !filePath) {
    return NextResponse.json({ error: "Missing sessionId or path" }, { status: 400 });
  }

  try {
    await deleteFile(sessionId, filePath);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
