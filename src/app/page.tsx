"use client";
import { useState } from "react";
import FileExplorer from "@/components/FileExplorer";
import CodeEditor from "@/components/CodeEditor";
import Terminal from "@/components/Terminal";
import ChatPanel from "@/components/ChatPanel";
import { useSession } from "@/hooks/useSession";

export default function Home() {
  const { showTerminal, toggleTerminal } = useSession();
  const [sidebarWidth] = useState(220);
  const [chatWidth] = useState(380);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden">
      {/* Title bar */}
      <header className="h-9 bg-[#323233] border-b border-[#3c3c3c] flex items-center px-4 justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ Vibe Coder
          </span>
          <span className="text-xs text-gray-500">AI-Powered IDE</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <button
            onClick={toggleTerminal}
            className={`hover:text-gray-200 transition-colors ${
              showTerminal ? "text-gray-200" : ""
            }`}
            title="Toggle Terminal"
          >
            ⌨ Terminal
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar — File Explorer */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: `${sidebarWidth}px` }}
        >
          <FileExplorer />
        </div>

        {/* Center — Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Code Editor */}
          <div className={showTerminal ? "flex-1 min-h-0" : "flex-1"}>
            <CodeEditor />
          </div>

          {/* Terminal */}
          {showTerminal && (
            <div className="h-[200px] shrink-0">
              <Terminal />
            </div>
          )}
        </div>

        {/* Right — Chat Panel */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ width: `${chatWidth}px` }}
        >
          <ChatPanel />
        </div>
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-[#007acc] flex items-center px-3 text-xs text-white justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span>⚡ Vibe Coder</span>
          <span className="opacity-70">TypeScript</span>
        </div>
        <div className="flex items-center gap-4 opacity-70">
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>
      </footer>
    </div>
  );
}
