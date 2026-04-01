"use client";
import { useEffect, useState } from "react";
import { useSession, FileNode } from "@/hooks/useSession";

function FileIcon({ type, name }: { type: string; name: string }) {
  if (type === "directory") {
    return <span className="text-yellow-400 mr-1.5">📁</span>;
  }
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, string> = {
    ts: "🟦", tsx: "⚛️", js: "🟨", jsx: "⚛️", py: "🐍", rs: "🦀",
    html: "🌐", css: "🎨", json: "📋", md: "📝", toml: "⚙️",
  };
  return <span className="mr-1.5 text-xs">{iconMap[ext] || "📄"}</span>;
}

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { openFile, activeFilePath } = useSession();
  const isActive = activeFilePath === node.path;

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center w-full px-2 py-0.5 text-sm hover:bg-[#2a2d2e] text-gray-300 transition-colors"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="mr-1 text-xs text-gray-500">{expanded ? "▼" : "▶"}</span>
          <FileIcon type="directory" name={node.name} />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded &&
          node.children?.map((child) => (
            <TreeNode key={child.path} node={child} depth={depth + 1} />
          ))}
      </div>
    );
  }

  return (
    <button
      onClick={() => openFile(node.path)}
      className={`flex items-center w-full px-2 py-0.5 text-sm transition-colors truncate ${
        isActive
          ? "bg-[#37373d] text-white"
          : "text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200"
      }`}
      style={{ paddingLeft: `${depth * 12 + 20}px` }}
    >
      <FileIcon type="file" name={node.name} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function FileExplorer() {
  const { fileTree, refreshFileTree, sessionId } = useSession();

  useEffect(() => {
    refreshFileTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="h-full bg-[#252526] border-r border-[#3c3c3c] flex flex-col">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-[#3c3c3c] flex items-center justify-between">
        <span>Explorer</span>
        <button
          onClick={refreshFileTree}
          className="text-gray-500 hover:text-gray-300 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500 text-xs">
            <p className="mb-2">No files yet</p>
            <p>Ask the AI to build something!</p>
          </div>
        ) : (
          fileTree.map((node) => <TreeNode key={node.path} node={node} />)
        )}
      </div>
    </div>
  );
}
