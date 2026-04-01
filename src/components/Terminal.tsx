"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "@/hooks/useSession";

export default function Terminal() {
  const { terminalHistory, runTerminalCommand, showTerminal } = useSession();
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory]);

  if (!showTerminal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRunning) return;

    const cmd = input.trim();
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");
    setIsRunning(true);
    await runTerminalCommand(cmd);
    setIsRunning(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div className="h-full bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col font-mono text-sm">
      <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-[#3c3c3c] flex items-center gap-2">
        <span>Terminal</span>
        {isRunning && <span className="text-yellow-400 animate-pulse">●</span>}
      </div>
      <div
        className="flex-1 overflow-y-auto px-3 py-2 space-y-2"
        onClick={() => inputRef.current?.focus()}
      >
        {terminalHistory.map((entry) => (
          <div key={entry.id}>
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-green-400">$</span>
              <span>{entry.command}</span>
            </div>
            {entry.output && (
              <pre className="text-gray-400 whitespace-pre-wrap text-xs mt-0.5 ml-4 max-h-60 overflow-y-auto">
                {entry.output}
              </pre>
            )}
            {entry.exitCode !== 0 && (
              <div className="text-red-400 text-xs ml-4">
                Exit code: {entry.exitCode}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-[#3c3c3c] px-3 py-2 flex items-center gap-2">
        <span className="text-green-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRunning ? "Running..." : "Type a command..."}
          disabled={isRunning}
          className="flex-1 bg-transparent text-gray-200 outline-none placeholder-gray-600 disabled:opacity-50"
          autoFocus
        />
      </form>
    </div>
  );
}
