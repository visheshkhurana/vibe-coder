"use client";
import { create } from "zustand";
import { v4 as uuid } from "uuid";

// ============================================================
// App-wide state management — Replit-style architecture
// ============================================================

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

export interface AgentAction {
  id: string;
  type: "write_file" | "read_file" | "run_command" | "search_files" | "list_files";
  label: string;
  input: Record<string, unknown>;
  output?: string;
  status: "running" | "done" | "error";
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  actions?: AgentAction[];
  isCheckpoint?: boolean;
  workDuration?: number; // seconds
  timestamp: number;
}

export interface TerminalEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: number;
}

export type AppView = "home" | "workspace";
export type RightPanel = "preview" | "publishing" | "tools";
export type AgentMode = "lite" | "autonomous" | "max";

interface AppState {
  // Navigation
  view: AppView;
  setView: (v: AppView) => void;
  projectName: string;
  setProjectName: (name: string) => void;

  // Session
  sessionId: string;

  // Agent
  agentMode: AgentMode;
  setAgentMode: (m: AgentMode) => void;
  planMode: boolean;
  togglePlanMode: () => void;
  isAgentRunning: boolean;
  setAgentRunning: (v: boolean) => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (updater: (prev: ChatMessage) => ChatMessage) => void;
  clearChat: () => void;

  // File tree
  fileTree: FileNode[];
  refreshFileTree: () => Promise<void>;

  // Editor
  openFiles: OpenFile[];
  activeFilePath: string | null;
  openFile: (path: string) => Promise<void>;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
  saveFile: (path: string) => Promise<void>;

  // Terminal
  terminalHistory: TerminalEntry[];
  addTerminalEntry: (entry: TerminalEntry) => void;
  runTerminalCommand: (command: string) => Promise<void>;

  // Panels
  rightPanel: RightPanel;
  setRightPanel: (p: RightPanel) => void;
  showLeftSidebar: boolean;
  toggleLeftSidebar: () => void;
  showTerminal: boolean;
  toggleTerminal: () => void;

  // Tabs
  activeTabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  addTab: (tab: string) => void;
  removeTab: (tab: string) => void;
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

export const useAppState = create<AppState>((set, get) => ({
  // Navigation
  view: "home",
  setView: (v) => set({ view: v }),
  projectName: "my-project",
  setProjectName: (name) => set({ projectName: name }),

  // Session
  sessionId: uuid(),

  // Agent
  agentMode: "autonomous",
  setAgentMode: (m) => set({ agentMode: m }),
  planMode: false,
  togglePlanMode: () => set((s) => ({ planMode: !s.planMode })),
  isAgentRunning: false,
  setAgentRunning: (v) => set({ isAgentRunning: v }),

  // Chat
  chatMessages: [],
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
  clearChat: () => set({ chatMessages: [] }),

  // File tree
  fileTree: [],
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

  // Editor
  openFiles: [],
  activeFilePath: null,
  openFile: async (path: string) => {
    const { sessionId, openFiles, addTab, setActiveTab } = get();
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      set({ activeFilePath: path });
      setActiveTab(path);
      return;
    }
    try {
      const res = await fetch(`/api/files?sessionId=${sessionId}&action=read&path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.error) return;
      const file: OpenFile = { path, content: data.content, language: detectLanguage(path), isDirty: false };
      set({ openFiles: [...openFiles, file], activeFilePath: path });
      addTab(path);
      setActiveTab(path);
    } catch (e) {
      console.error("Failed to open file:", e);
    }
  },
  closeFile: (path: string) => {
    const { openFiles, activeFilePath, removeTab } = get();
    const remaining = openFiles.filter((f) => f.path !== path);
    set({
      openFiles: remaining,
      activeFilePath: activeFilePath === path
        ? remaining.length > 0 ? remaining[remaining.length - 1].path : null
        : activeFilePath,
    });
    removeTab(path);
  },
  setActiveFile: (path: string) => set({ activeFilePath: path }),
  updateFileContent: (path: string, content: string) => {
    set((s) => ({
      openFiles: s.openFiles.map((f) => f.path === path ? { ...f, content, isDirty: true } : f),
    }));
  },
  saveFile: async (path: string) => {
    const { sessionId, openFiles, refreshFileTree } = get();
    const file = openFiles.find((f) => f.path === path);
    if (!file) return;
    await fetch("/api/files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, path, content: file.content }),
    });
    set({ openFiles: openFiles.map((f) => f.path === path ? { ...f, isDirty: false } : f) });
    await refreshFileTree();
  },

  // Terminal
  terminalHistory: [],
  showTerminal: false,
  toggleTerminal: () => set((s) => ({ showTerminal: !s.showTerminal })),
  addTerminalEntry: (entry) => set((s) => ({ terminalHistory: [...s.terminalHistory, entry] })),
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
        id: uuid(), command,
        output: [data.stdout, data.stderr].filter(Boolean).join("\n"),
        exitCode: data.exitCode ?? 0, timestamp: Date.now(),
      });
      await refreshFileTree();
    } catch (e) {
      addTerminalEntry({ id: uuid(), command, output: `Error: ${e}`, exitCode: 1, timestamp: Date.now() });
    }
  },

  // Panels
  rightPanel: "preview",
  setRightPanel: (p) => set({ rightPanel: p }),
  showLeftSidebar: true,
  toggleLeftSidebar: () => set((s) => ({ showLeftSidebar: !s.showLeftSidebar })),

  // Tabs
  activeTabs: ["Preview"],
  activeTab: "Preview",
  setActiveTab: (tab) => set({ activeTab: tab }),
  addTab: (tab) => set((s) => ({
    activeTabs: s.activeTabs.includes(tab) ? s.activeTabs : [...s.activeTabs, tab],
  })),
  removeTab: (tab) => set((s) => {
    const remaining = s.activeTabs.filter((t) => t !== tab);
    return {
      activeTabs: remaining,
      activeTab: s.activeTab === tab ? (remaining[remaining.length - 1] || "Preview") : s.activeTab,
    };
  }),
}));
