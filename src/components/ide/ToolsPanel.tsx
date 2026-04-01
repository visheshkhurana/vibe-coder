"use client";
import { useState, useEffect } from "react";
import { useAppState, FileNode } from "@/hooks/useAppState";

function FileIcon({ type, name }: { type: string; name: string }) {
  if (type === "directory") return <span className="text-yellow-400/70">📁</span>;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const icons: Record<string, string> = {
    ts: "🟦", tsx: "⚛️", js: "🟨", jsx: "⚛️", py: "🐍", rs: "🦀",
    html: "🌐", css: "🎨", json: "📋", md: "📝", toml: "⚙️",
  };
  return <span className="text-xs">{icons[ext] || "📄"}</span>;
}

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const { openFile, activeFilePath, setActiveTab, addTab } = useAppState();
  const isActive = activeFilePath === node.path;

  const handleClick = () => {
    if (node.type === "directory") {
      setExpanded(!expanded);
    } else {
      openFile(node.path);
      addTab(node.path);
      setActiveTab(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 w-full px-2 py-0.5 text-xs transition-colors ${
          isActive ? "bg-teal-900/20 text-teal-300" : "text-gray-400 hover:bg-[#1c2333] hover:text-gray-200"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === "directory" && (
          <span className="text-[10px] text-gray-600">{expanded ? "▼" : "▶"}</span>
        )}
        <FileIcon type={node.type} name={node.name} />
        <span className="truncate">{node.name}</span>
      </button>
      {expanded && node.children?.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function ToolsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { fileTree, refreshFileTree, sessionId } = useAppState();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isOpen) refreshFileTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const tools = [
    { icon: "🗄️", label: "Database", desc: "PostgreSQL storage" },
    { icon: "🚀", label: "Publishing", desc: "Deploy your app" },
    { icon: "🔗", label: "Integrations", desc: "Connect services" },
    { icon: "📦", label: "App Storage", desc: "Object storage" },
    { icon: "🔑", label: "Secrets", desc: "API keys & env vars" },
    { icon: "🔒", label: "Security Scanner", desc: "Vulnerability scan" },
    { icon: "📊", label: "Analytics", desc: "Traffic & usage" },
  ];

  const advancedTools = [
    { icon: "🔍", label: "Code Search", desc: "Search codebase" },
    { icon: "📟", label: "Console", desc: "Terminal output" },
    { icon: "⌨️", label: "Shell", desc: "Command line" },
    { icon: "🔀", label: "Git", desc: "Version control" },
  ];

  const filteredTools = search
    ? tools.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()))
    : tools;

  const filteredAdvanced = search
    ? advancedTools.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()))
    : advancedTools;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-80 h-full bg-[#0e1525] border-l border-[#1c2333] shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3 border-b border-[#1c2333]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-200">Tools & Files</span>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">×</button>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for tools & files..."
            className="w-full bg-[#1c2333] border border-[#2a3447] rounded-lg px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 outline-none focus:border-teal-500/50"
          />
        </div>

        {/* Suggested Tools */}
        <div className="p-3">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">Suggested</p>
          <div className="space-y-0.5">
            {filteredTools.map((tool) => (
              <button key={tool.label} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:bg-[#1c2333] hover:text-gray-200 transition-colors">
                <span>{tool.icon}</span>
                <div className="text-left">
                  <div className="text-gray-300">{tool.label}</div>
                  <div className="text-[10px] text-gray-600">{tool.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced */}
        <div className="p-3 pt-0">
          <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold mb-2">Advanced</p>
          <div className="space-y-0.5">
            {filteredAdvanced.map((tool) => (
              <button key={tool.label} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:bg-[#1c2333] hover:text-gray-200 transition-colors">
                <span>{tool.icon}</span>
                <div className="text-left">
                  <div className="text-gray-300">{tool.label}</div>
                  <div className="text-[10px] text-gray-600">{tool.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Files */}
        <div className="p-3 pt-0 border-t border-[#1c2333] mt-2">
          <div className="flex items-center justify-between mb-2 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">Files</p>
            <button onClick={refreshFileTree} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">↻</button>
          </div>
          {fileTree.length === 0 ? (
            <p className="text-xs text-gray-600 py-4 text-center">No files yet</p>
          ) : (
            <div className="space-y-0.5">
              {fileTree.map((node) => <TreeNode key={node.path} node={node} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
