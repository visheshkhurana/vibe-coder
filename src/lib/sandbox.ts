// ============================================================
// Sandbox — Dual mode: E2B cloud sandboxes (production) or
//           local filesystem (development)
// ============================================================

const USE_E2B = !!process.env.E2B_API_KEY;

// ==================== E2B MODE ====================
import { Sandbox } from "e2b";

const activeSandboxes = new Map<string, Sandbox>();
const sandboxIds = new Map<string, string>();
const SANDBOX_TIMEOUT = 10 * 60; // 10 min keep-alive

async function getE2BSandbox(sessionId: string): Promise<Sandbox> {
  const existing = activeSandboxes.get(sessionId);
  if (existing) {
    try {
      await existing.commands.run("echo ok", { timeoutMs: 3000 });
      return existing;
    } catch {
      activeSandboxes.delete(sessionId);
      sandboxIds.delete(sessionId);
    }
  }

  const existingId = sandboxIds.get(sessionId);
  if (existingId) {
    try {
      const reconnected = await Sandbox.connect(existingId);
      activeSandboxes.set(sessionId, reconnected);
      return reconnected;
    } catch {
      sandboxIds.delete(sessionId);
    }
  }

  const sandbox = await Sandbox.create({ timeoutMs: SANDBOX_TIMEOUT * 1000 });
  await sandbox.commands.run("mkdir -p /home/user/workspace", { timeoutMs: 5000 });
  activeSandboxes.set(sessionId, sandbox);
  sandboxIds.set(sessionId, sandbox.sandboxId);
  return sandbox;
}

// ==================== LOCAL MODE ====================
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || "/tmp/vibe-workspaces";

function getLocalPath(sessionId: string, filePath?: string): string {
  const base = path.join(WORKSPACE_ROOT, sessionId);
  return filePath ? path.join(base, filePath) : base;
}

// ==================== UNIFIED API ====================

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileEntry[];
}

export async function ensureWorkspace(sessionId: string): Promise<void> {
  if (USE_E2B) {
    await getE2BSandbox(sessionId);
  } else {
    await fs.mkdir(getLocalPath(sessionId), { recursive: true });
  }
}

export async function readFile(sessionId: string, filePath: string): Promise<string> {
  if (USE_E2B) {
    const sandbox = await getE2BSandbox(sessionId);
    return await sandbox.files.read(`/home/user/workspace/${filePath}`);
  } else {
    return fs.readFile(getLocalPath(sessionId, filePath), "utf-8");
  }
}

export async function writeFile(sessionId: string, filePath: string, content: string): Promise<void> {
  if (USE_E2B) {
    const sandbox = await getE2BSandbox(sessionId);
    const fullPath = `/home/user/workspace/${filePath}`;
    const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
    if (dir) await sandbox.commands.run(`mkdir -p "${dir}"`, { timeoutMs: 5000 });
    await sandbox.files.write(fullPath, content);
  } else {
    const fullPath = getLocalPath(sessionId, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
  }
}

export async function deleteFile(sessionId: string, filePath: string): Promise<void> {
  if (USE_E2B) {
    const sandbox = await getE2BSandbox(sessionId);
    await sandbox.commands.run(`rm -f "/home/user/workspace/${filePath}"`, { timeoutMs: 5000 });
  } else {
    await fs.unlink(getLocalPath(sessionId, filePath));
  }
}

export async function listFiles(sessionId: string, dirPath: string = "."): Promise<FileEntry[]> {
  if (USE_E2B) {
    return listFilesE2B(sessionId, dirPath);
  } else {
    return listFilesLocal(sessionId, dirPath);
  }
}

async function listFilesE2B(sessionId: string, dirPath: string): Promise<FileEntry[]> {
  const sandbox = await getE2BSandbox(sessionId);
  const fullPath = `/home/user/workspace/${dirPath === "." ? "" : dirPath}`;
  try {
    const entries = await sandbox.files.list(fullPath);
    const result: FileEntry[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "__pycache__") continue;
      const entryPath = dirPath === "." ? entry.name : `${dirPath}/${entry.name}`;
      if (entry.type === "dir") {
        const children = await listFilesE2B(sessionId, entryPath);
        result.push({ name: entry.name, path: entryPath, type: "directory", children });
      } else {
        result.push({ name: entry.name, path: entryPath, type: "file" });
      }
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

async function listFilesLocal(sessionId: string, dirPath: string): Promise<FileEntry[]> {
  const fullPath = getLocalPath(sessionId, dirPath);
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const result: FileEntry[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const children = await listFilesLocal(sessionId, entryPath);
        result.push({ name: entry.name, path: entryPath, type: "directory", children });
      } else {
        result.push({ name: entry.name, path: entryPath, type: "file" });
      }
    }
    return result.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}

export async function runCommand(
  sessionId: string,
  command: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  if (USE_E2B) {
    const sandbox = await getE2BSandbox(sessionId);
    const workDir = cwd ? `/home/user/workspace/${cwd}` : "/home/user/workspace";
    try {
      const result = await sandbox.commands.run(command, {
        cwd: workDir,
        timeoutMs: 60000,
      });
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? 0,
      };
    } catch (err: unknown) {
      return { stdout: "", stderr: err instanceof Error ? err.message : String(err), exitCode: 1 };
    }
  } else {
    const execDir = cwd ? getLocalPath(sessionId, cwd) : getLocalPath(sessionId);
    return new Promise((resolve) => {
      exec(command, {
        cwd: execDir,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, HOME: getLocalPath(sessionId) },
      }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: error ? error.code ?? 1 : 0,
        });
      });
    });
  }
}

export async function searchFiles(
  sessionId: string,
  pattern: string,
  directory: string = "."
): Promise<string> {
  const { stdout } = await runCommand(
    sessionId,
    `grep -rn --include="*" "${pattern}" ${directory} 2>/dev/null | head -50`
  );
  return stdout || "No matches found.";
}

export async function destroySandbox(sessionId: string): Promise<void> {
  const sandbox = activeSandboxes.get(sessionId);
  if (sandbox) {
    try { await sandbox.kill(); } catch { /* already dead */ }
    activeSandboxes.delete(sessionId);
    sandboxIds.delete(sessionId);
  }
}
