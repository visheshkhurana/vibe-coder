"use client";
import { useAppState } from "@/hooks/useAppState";

export default function Toolbar() {
  const {
    projectName, setView, activeTabs, activeTab, setActiveTab, removeTab,
    setRightPanel, toggleLeftSidebar, agentMode, setAgentMode, toggleTerminal,
  } = useAppState();

  const modeLabels: Record<string, string> = {
    lite: "Lite", autonomous: "Auto", max: "Max",
  };

  return (
    <div className="h-10 bg-[#0e1525] border-b border-[#1c2333] flex items-center px-2 shrink-0 select-none">
      {/* Left: Logo + Project */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setView("home")} className="text-teal-400 hover:text-teal-300 transition-colors px-1">
          ⚡
        </button>
        <span className="text-sm text-gray-300 font-medium truncate max-w-[160px]">{projectName}</span>

        {/* Agent mode badge */}
        <div className="relative group">
          <button className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1c2333] border border-[#2a3447] text-xs text-gray-400 hover:text-gray-200 transition-colors">
            Agent {modeLabels[agentMode]}
            <span className="text-[10px]">▼</span>
          </button>
          <div className="absolute top-full left-0 mt-1 w-36 bg-[#1c2333] border border-[#2a3447] rounded-lg shadow-xl z-50 hidden group-hover:block">
            {(["lite", "autonomous", "max"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setAgentMode(mode)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-[#2a3447] transition-colors ${
                  agentMode === mode ? "text-teal-400" : "text-gray-400"
                }`}
              >
                {mode === "lite" && "⚡ Lite — Fast"}
                {mode === "autonomous" && "🤖 Autonomous"}
                {mode === "max" && "🚀 Max — Full power"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Tabs */}
      <div className="flex-1 flex items-center gap-0.5 mx-4 overflow-x-auto min-w-0">
        {activeTabs.map((tab) => {
          const isActive = activeTab === tab;
          const isFile = tab.includes(".");
          const label = isFile ? tab.split("/").pop() : tab;
          return (
            <div
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Preview") setRightPanel("preview");
                else if (tab === "Publishing") setRightPanel("publishing");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer rounded-t-md transition-colors shrink-0 group ${
                isActive
                  ? "bg-[#1c2333] text-white border-t-2 border-t-teal-500"
                  : "text-gray-500 hover:text-gray-300 hover:bg-[#1c2333]/50 border-t-2 border-t-transparent"
              }`}
            >
              <span className="truncate max-w-[100px]">{label}</span>
              {tab !== "Preview" && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeTab(tab); }}
                  className="text-gray-600 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={toggleTerminal}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1c2333] rounded transition-colors"
          title="Toggle Terminal"
        >
          ⌨ Shell
        </button>
        <button
          onClick={toggleLeftSidebar}
          className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1c2333] rounded transition-colors"
        >
          ☰
        </button>
        <button className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300 hover:bg-[#1c2333] rounded transition-colors">
          🔍
        </button>
        <button
          onClick={() => { setRightPanel("publishing"); setActiveTab("Publishing"); useAppState.getState().addTab("Publishing"); }}
          className="ml-1 px-3 py-1 text-xs bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors font-medium"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
