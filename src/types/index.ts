// ============================================================
// Vibe Coder — Type definitions
// ============================================================

// --- File System ---
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

// --- Chat / Agent ---
export type MessageRole = "user" | "assistant";

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  isError?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

// --- Terminal ---
export interface TerminalOutput {
  id: string;
  command: string;
  output: string;
  exitCode: number | null;
  timestamp: number;
}

// --- Editor ---
export interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

// --- API payloads ---
export interface ChatRequest {
  messages: { role: string; content: string }[];
  sessionId: string;
}

export interface FileWriteRequest {
  path: string;
  content: string;
}

export interface TerminalRequest {
  command: string;
  cwd?: string;
}
