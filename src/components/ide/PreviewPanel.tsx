"use client";
import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";

export default function PreviewPanel() {
  const { rightPanel, projectName, sessionId } = useAppState();
  const [previewPath, setPreviewPath] = useState("/");
  const [refreshKey, setRefreshKey] = useState(0);

  if (rightPanel === "publishing") return <PublishingPanel />;

  return (
    <div className="h-full flex flex-col bg-[#0e1525]">
      {/* Browser bar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1c2333] bg-[#0e1525]">
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="px-1.5 py-0.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          ↻
        </button>
        <div className="flex-1 flex items-center bg-[#1c2333] rounded px-2 py-1 text-xs">
          <span className="text-gray-600 mr-1">{projectName}.replit.dev</span>
          <input
            type="text"
            value={previewPath}
            onChange={(e) => setPreviewPath(e.target.value)}
            className="flex-1 bg-transparent text-gray-400 outline-none"
          />
        </div>
        <button className="px-1.5 py-0.5 text-gray-500 hover:text-gray-300 text-xs transition-colors">
          ↗
        </button>
      </div>

      {/* Preview content */}
      <div className="flex-1 flex items-center justify-center bg-[#080d19] relative">
        <div key={refreshKey} className="text-center text-gray-600 px-8">
          <div className="text-6xl mb-4 opacity-10">🌐</div>
          <p className="text-sm mb-2 text-gray-500">App Preview</p>
          <p className="text-xs text-gray-600">
            Ask the agent to build a web app, then it will appear here.
          </p>
          <p className="text-xs text-gray-700 mt-4">
            Session: {sessionId.slice(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  );
}

function PublishingPanel() {
  const { projectName } = useAppState();

  return (
    <div className="h-full flex flex-col bg-[#0e1525] overflow-y-auto">
      {/* Sub-tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#1c2333] text-xs">
        {["Overview", "Logs", "Analytics", "Resources", "Domains", "Manage"].map((tab, i) => (
          <button
            key={tab}
            className={`px-2.5 py-1 rounded transition-colors ${
              i === 0 ? "bg-[#1c2333] text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <button className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors">
          Republish
        </button>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[#1c2333] border border-[#2a3447]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Production</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-teal-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                  Published
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Visibility</span>
                <span className="text-gray-300">Public</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Domain</span>
                <span className="text-teal-400">{projectName}.vercel.app</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-gray-300">Autoscale</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sandbox</span>
                <span className="text-gray-300">E2B Cloud VM</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#1c2333] border border-[#2a3447]">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Quick Actions</h3>
            <div className="space-y-1.5">
              <button className="w-full text-left px-3 py-2 rounded text-xs text-gray-400 hover:bg-[#2a3447] hover:text-gray-200 transition-colors">
                🔒 Run security scan
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-xs text-gray-400 hover:bg-[#2a3447] hover:text-gray-200 transition-colors">
                ⚙️ Adjust settings
              </button>
              <button className="w-full text-left px-3 py-2 rounded text-xs text-gray-400 hover:bg-[#2a3447] hover:text-gray-200 transition-colors">
                🌐 Buy a custom domain
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
