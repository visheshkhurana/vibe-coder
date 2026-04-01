"use client";
import { useCallback } from "react";
import dynamic from "next/dynamic";
import { useSession } from "@/hooks/useSession";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

function EditorTabs() {
  const { openFiles, activeFilePath, setActiveFile, closeFile } = useSession();

  if (openFiles.length === 0) return null;

  return (
    <div className="flex bg-[#252526] border-b border-[#3c3c3c] overflow-x-auto">
      {openFiles.map((file) => {
        const isActive = file.path === activeFilePath;
        const fileName = file.path.split("/").pop() || file.path;
        return (
          <div
            key={file.path}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm cursor-pointer border-r border-[#3c3c3c] min-w-0 group ${
              isActive
                ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                : "bg-[#2d2d2d] text-gray-400 hover:bg-[#2a2d2e] border-t-2 border-t-transparent"
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="truncate max-w-[120px]">
              {file.isDirty && <span className="text-white mr-0.5">●</span>}
              {fileName}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
              className="ml-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function CodeEditor() {
  const { openFiles, activeFilePath, updateFileContent, saveFile } = useSession();
  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  const handleSave = useCallback(() => {
    if (activeFilePath) saveFile(activeFilePath);
  }, [activeFilePath, saveFile]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <EditorTabs />
      <div className="flex-1 relative">
        {activeFile ? (
          <MonacoEditor
            language={activeFile.language}
            theme="vs-dark"
            value={activeFile.content}
            onChange={(value) => {
              if (value !== undefined && activeFilePath) {
                updateFileContent(activeFilePath, value);
              }
            }}
            onMount={(editor) => {
              // Ctrl+S / Cmd+S to save
              editor.addCommand(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (window as any).monaco?.KeyMod.CtrlCmd | (window as any).monaco?.KeyCode.KeyS,
                handleSave
              );
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
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-20">⚡</div>
              <h2 className="text-xl font-light mb-2 text-gray-400">Vibe Coder</h2>
              <p className="text-sm">Open a file or ask the AI to build something</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
