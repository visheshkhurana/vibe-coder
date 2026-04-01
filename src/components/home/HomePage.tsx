"use client";
import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";

const CATEGORIES = [
  { label: "Website", icon: "🌐" },
  { label: "API", icon: "⚡" },
  { label: "Mobile", icon: "📱" },
  { label: "CLI Tool", icon: "⌨️" },
  { label: "Game", icon: "🎮" },
  { label: "Data App", icon: "📊" },
];

const EXAMPLES = [
  "Build a freelance client portal with invoicing",
  "Create a real-time chat app with rooms",
  "Build a Kanban board with drag and drop",
  "Create a REST API with authentication",
  "Build a weather dashboard with charts",
  "Create a markdown blog with syntax highlighting",
];

export default function HomePage() {
  const { setView, setProjectName } = useAppState();
  const [input, setInput] = useState("");
  const [planMode, setPlanMode] = useState(false);

  const handleSubmit = () => {
    if (!input.trim()) return;
    const name = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
    setProjectName(name || "my-project");
    setView("workspace");
    // The workspace will pick up the input from state to send as first message
    useAppState.setState({
      chatMessages: [{
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim(),
        timestamp: Date.now(),
      }],
    });
  };

  const handleCategoryClick = (category: string) => {
    setInput(`Build a ${category.toLowerCase()} `);
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  const randomExamples = EXAMPLES.sort(() => Math.random() - 0.5).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#0e1525] text-white flex">
      {/* Left Sidebar */}
      <div className="w-56 border-r border-[#1c2333] flex flex-col py-4 shrink-0">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">⚡ Vibe Coder</span>
          </div>
        </div>

        <div className="px-3 space-y-1">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-600/20 border border-teal-500/30 text-teal-300 text-sm hover:bg-teal-600/30 transition-colors">
            <span>+</span> Create something new
          </button>
        </div>

        <nav className="mt-4 px-3 space-y-0.5 flex-1">
          <SidebarItem icon="🏠" label="Home" active />
          <SidebarItem icon="📁" label="Projects" />
          <SidebarItem icon="🚀" label="Published" />
          <SidebarItem icon="🔗" label="Integrations" />
          <SidebarItem icon="⚙️" label="Settings" />
        </nav>

        <div className="px-3 mt-auto space-y-2">
          <div className="p-3 rounded-lg bg-[#1c2333] border border-[#2a3447] text-xs">
            <p className="text-teal-400 font-medium mb-1">Free Tier</p>
            <p className="text-gray-400">100 hrs sandbox time</p>
          </div>
          <a href="https://github.com/visheshkhurana/vibe-coder" target="_blank" className="block text-xs text-gray-500 hover:text-gray-300 px-3 transition-colors">
            GitHub Repo →
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-2xl">
          {/* Greeting */}
          <h1 className="text-3xl font-light text-gray-200 mb-8">
            Hi Vishesh, <span className="text-white font-normal">what do you want to make?</span>
          </h1>

          {/* Main Input */}
          <div className="relative mb-6">
            <div className="bg-[#1c2333] border border-[#2a3447] rounded-xl overflow-hidden focus-within:border-teal-500/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Describe your idea, Agent will bring it to life..."
                rows={3}
                className="w-full bg-transparent text-gray-200 placeholder-gray-500 px-4 pt-4 pb-2 text-sm resize-none outline-none"
              />
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#2a3447]">
                <div className="flex items-center gap-3">
                  <button className="text-gray-500 hover:text-gray-300 transition-colors text-lg">+</button>
                  <button
                    onClick={() => setPlanMode(!planMode)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      planMode
                        ? "bg-teal-600/30 text-teal-300 border border-teal-500/40"
                        : "text-gray-500 hover:text-gray-300 border border-transparent"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${planMode ? "bg-teal-400" : "bg-gray-600"}`} />
                    Plan
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <span className="text-white text-sm">↑</span>
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1c2333] border border-[#2a3447] text-sm text-gray-300 hover:border-teal-500/40 hover:text-teal-300 transition-colors"
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Example Prompts */}
          <div className="mb-8">
            <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
              Try an example prompt
              <button
                onClick={() => useAppState.setState({})}
                className="text-gray-600 hover:text-gray-400 transition-colors"
              >
                ↻
              </button>
            </p>
            <div className="space-y-2">
              {randomExamples.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="block w-full text-left px-4 py-2.5 rounded-lg bg-[#1c2333]/50 border border-[#2a3447]/50 text-sm text-gray-400 hover:text-gray-200 hover:border-[#2a3447] transition-colors"
                >
                  &quot;{example}&quot;
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active }: { icon: string; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-[#1c2333] text-white"
          : "text-gray-400 hover:bg-[#1c2333]/50 hover:text-gray-200"
      }`}
    >
      <span>{icon}</span>
      {label}
    </button>
  );
}
