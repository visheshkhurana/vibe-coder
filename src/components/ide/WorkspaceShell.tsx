"use client";
import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import Toolbar from "./Toolbar";
import AgentChat from "./AgentChat";
import PreviewPanel from "./PreviewPanel";
import ToolsPanel from "./ToolsPanel";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

function EditorPanel() {
  const { openFiles, activeFilePath, updateFileContent, saveFile, activeTab } = useAppState();

  // If active tab is Preview or Publishing, don't show editor
  if (activeTab === "Preview" || activeTab === "Publishing") return null;

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  if (!activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-[#080d19] text-gray-600">
        <div className="text-center">
          <div className="text-5xl mb-3 opacity-10">📝</div>
          <p className="text-sm">Select a file to edit</p>
        </div>
      </div>
    );
  }

  return (
    <MonacoEditor
      language={activeFile.language}
      theme="vs-dark"
      value={activeFile.content}
      onChange={(value) => {
        if (value !== undefined && activeFilePath) updateFileContent(activeFilePath, value);
      }}
      onMount={(editor) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editor.addCommand((window as any).monaco?.KeyMod.CtrlCmd | (window as any).monaco?.KeyCode.KeyS, () => {
          if (activeFilePath) saveFile(activeFilePath);
        });
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 8 },
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        smoothScrolling: true,
      }}
    />
  );
}

function TerminalPanel() {
  const { terminalHistory, runTerminalCommand, showTerminal } = useAppState();
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  if (!showTerminal) return null;

  return (
    <div className="h-[180px] shrink-0 bg-[#080d19] border-t border-[#1c2333] flex flex-col font-mono text-xs">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-gray-600 border-b border-[#1c2333] flex items-center gap-2">
        Shell
        {isRunning && <span className="text-yellow-400 animate-pulse">●</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {terminalHistory.map((entry) => (
          <div key={entry.id}>
            <div className="text-gray-400"><span className="text-green-500">$</span> {entry.command}</div>
            {entry.output && <pre className="text-gray-600 whitespace-pre-wrap ml-3 max-h-40 overflow-y-auto">{entry.output}</pre>}
            {entry.exitCode !== 0 && <span className="text-red-500 ml-3">exit {entry.exitCode}</span>}
          </div>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!input.trim() || isRunning) return;
          const cmd = input.trim();
          setInput("");
          setIsRunning(true);
          await runTerminalCommand(cmd);
          setIsRunning(false);
        }}
        className="border-t border-[#1c2333] px-3 py-1.5 flex items-center gap-2"
      >
        <span className="text-green-500">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-transparent text-gray-300 outline-none placeholder-gray-700"
          disabled={isRunning}
        />
      </form>
    </div>
  );
}

export default function WorkspaceShell() {
  const { showLeftSidebar, activeTab } = useAppState();
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

  const showCenterAsPreview = activeTab === "Preview" || activeTab === "Publishing";

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0e1525] text-white overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Agent Chat */}
        {showLeftSidebar && (
          <div className="w-[380px] shrink-0 border-r border-[#1c2333] overflow-hidden">
            <AgentChat />
          </div>
        )}

        {/* Center: Editor or Preview */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 min-h-0">
            {showCenterAsPreview ? (
              <PreviewPanel />
            ) : (
              <EditorPanel />
            )}
          </div>
          <TerminalPanel />
        </div>

        {/* Right: Preview (when editing code, show preview on right) */}
        {!showCenterAsPreview && (
          <div className="w-[400px] shrink-0 border-l border-[#1c2333] overflow-hidden hidden xl:block">
            <PreviewPanel />
          </div>
        )}
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-teal-700 flex items-center px-3 text-[11px] text-white/80 justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>⚡ Vibe Coder</span>
          <span className="opacity-60">E2B Sandbox</span>
        </div>
        <div className="flex items-center gap-3 opacity-60">
          <button onClick={() => setToolsPanelOpen(true)} className="hover:text-white transition-colors">
            Tools & Files
          </button>
          <span>UTF-8</span>
        </div>
      </footer>

      <ToolsPanel isOpen={toolsPanelOpen} onClose={() => setToolsPanelOpen(false)} />
    </div>
  );
}
