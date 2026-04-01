// ============================================================
// useSession — global state management for the IDE
// ============================================================
"use client";
import { create } from "zustand";
import { v4 as uuid } from "uuid";

// --- Types ---
export interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  toolCalls?: { name: string; input: Record<string, unknown>; id: string }[];
  toolResults?: { toolCallId: string; toolName: string; output: string }[];
  timestamp: number;
}

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}

interface SessionState {
  sessionId: string;

  // File tree
  fileTree: FileNode[];
  setFileTree: (tree: FileNode[]) => void;
  refreshFileTree: () => Promise<void>;

  // Open files / editor
  openFiles: OpenFile[];
  activeFilePath: string | null;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (updater: (prev: ChatMessage) => ChatMessage) => void;
  isAgentRunning: boolean;
  setAgentRunning: (v: boolean) => void;

  // Terminal
  terminalHistory: TerminalEntry[];
  addTerminalEntry: (entry: TerminalEntry) => void;
  runTerminalCommand: (command: string) => Promise<void>;

  // Layout
  showTerminal: boolean;
  toggleTerminal: () => void;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    py: "python", rs: "rust", go: "go", java: "java", c: "c", cpp: "cpp",
    html: "html", css: "css", scss: "scss", json: "json", md: "markdown",
    yaml: "yaml", yml: "yaml", toml: "toml", sql: "sql", sh: "shell",
    bash: "shell", dockerfile: "dockerfile", xml: "xml", svg: "xml",
  };
  return map[ext] || "plaintext";
}

export const useSession = create<SessionState>((set, get) => ({
  sessionId: uuid(),

  // --- File tree ---
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),
  refreshFileTree: async () => {
    const { sessionId } = get();
    try {
      const res = await fetch(`/api/files?sessionId=${sessionId}&action=list&path=.`);
      const data = await res.json();
      set({ fileTree: data.files || [] });
    } catch (e) {
      console.error("Failed to refresh file tree:", e);
    }
  },

  // --- Editor ---
  openFiles: [],
  activeFilePath: null,

  openFile: async (path: string) => {
    const { sessionId, openFiles } = get();
    // Already open?
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      set({ activeFilePath: path });
      return;
    }
    try {
      const res = await fetch(`/api/files?sessionId=${sessionId}&action=read&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.error) return;
      const file: OpenFile = {
        path,
        content: data.content,
        language: detectLanguage(path),
        isDirty: false,
      };
      set({ openFiles: [...openFiles, file], activeFilePath: path });
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  },

  closeFile: (path: string) => {
    const { openFiles, activeFilePath } = get();
    const remaining = openFiles.filter((f) => f.path !== path);
    set({
      openFiles: remaining,
      activeFilePath:
        activeFilePath === path
          ? remaining.length > 0
            ? remaining[remaining.length - 1].path
            : null
          : activeFilePath,
    });
  },

  setActiveFile: (path: string) => set({ activeFilePath: path }),

  updateFileContent: (path: string, content: string) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === path ? { ...f, content, isDirty: true } : f
      ),
    });
  },

  saveFile: async (path: string) => {
    const { sessionId, openFiles, refreshFileTree } = get();
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, path, content: file.content }),
      });
      set({
        openFiles: openFiles.map((f) =>
          f.path === path ? { ...f, isDirty: false } : f
        ),
      });
      await refreshFileTree();
    } catch (e) {
      console.error("Failed to save file:", e);
    }
  },

  // --- Chat ---
  chatMessages: [],
  isAgentRunning: false,
  setAgentRunning: (v) => set({ isAgentRunning: v }),

  addChatMessage: (msg) => set((s) => ({ chatMessages: [...s.chatMessages, msg] })),

  updateLastAssistantMessage: (updater) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") {
          msgs[i] = updater(msgs[i]);
          break;
        }
      }
      return { chatMessages: msgs };
    }),

  // --- Terminal ---
  terminalHistory: [],
  showTerminal: true,
  toggleTerminal: () => set((s) => ({ showTerminal: !s.showTerminal })),

  addTerminalEntry: (entry) =>
    set((s) => ({ terminalHistory: [...s.terminalHistory, entry] })),

  runTerminalCommand: async (command: string) => {
    const { sessionId, addTerminalEntry, refreshFileTree } = get();
    try {
      const res = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, command }),
      });
      const data = await res.json();
      addTerminalEntry({
        id: uuid(),
        command,
        output: [data.stdout, data.stderr].filter(Boolean).join("\n"),
        exitCode: data.exitCode ?? 0,
        timestamp: Date.now(),
      });
      await refreshFileTree();
    } catch (e) {
      addTerminalEntry({
        id: uuid(),
        command,
        output: `Error: ${e}`,
        exitCode: 1,
        timestamp: Date.now(),
      });
    }
  },
}));
