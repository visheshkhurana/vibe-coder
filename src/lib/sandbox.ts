// ============================================================
// Sandbox — file system & command execution in an isolated workspace
// ============================================================
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";

// Each session gets its own workspace directory
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || "/tmp/vibe-workspaces";

export function getWorkspacePath(sessionId: string): string {
  return path.join(WORKSPACE_ROOT, sessionId);
}

export async function ensureWorkspace(sessionId: string): Promise<string> {
  const dir = getWorkspacePath(sessionId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// --- File operations ---

export async function readFile(sessionId: string, filePath: string): Promise<string> {
  const fullPath = path.join(getWorkspacePath(sessionId), filePath);
  return fs.readFile(fullPath, "utf-8");
}

export async function writeFile(sessionId: string, filePath: string, content: string): Promise<void> {
  const fullPath = path.join(getWorkspacePath(sessionId), filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, content, "utf-8");
}

export async function deleteFile(sessionId: string, filePath: string): Promise<void> {
  const fullPath = path.join(getWorkspacePath(sessionId), filePath);
  await fs.unlink(fullPath);
}

export async function listFiles(sessionId: string, dirPath: string = "."): Promise<FileEntry[]> {
  const fullPath = path.join(getWorkspacePath(sessionId), dirPath);
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const result: FileEntry[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const entryPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const children = await listFiles(sessionId, entryPath);
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

export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileEntry[];
}

// --- Command execution ---

export async function runCommand(
  sessionId: string,
  command: string,
  cwd?: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const workspacePath = getWorkspacePath(sessionId);
  const execDir = cwd ? path.join(workspacePath, cwd) : workspacePath;

  return new Promise((resolve) => {
    exec(
      command,
      {
        cwd: execDir,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        env: { ...process.env, HOME: workspacePath },
      },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout || "",
          stderr: stderr || "",
          exitCode: error ? error.code ?? 1 : 0,
        });
      }
    );
  });
}

// --- Search ---

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
