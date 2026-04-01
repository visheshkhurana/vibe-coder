"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";
import { useAppState, ChatMessage, AgentAction } from "@/hooks/useAppState";

// --- Collapsible Action Group ---
function ActionGroup({ actions }: { actions: AgentAction[] }) {
  const [expanded, setExpanded] = useState(false);
  const doneCount = actions.filter((a) => a.status === "done").length;
  const isAllDone = doneCount === actions.length;

  return (
    <div className="my-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isAllDone
            ? "bg-teal-900/20 text-teal-400 border border-teal-800/30"
            : "bg-yellow-900/20 text-yellow-400 border border-yellow-800/30 animate-pulse"
        }`}
      >
        <span>{isAllDone ? "✓" : "●"}</span>
        <span>{actions.length} action{actions.length !== 1 ? "s" : ""}</span>
        <span className="text-[10px] ml-1">{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="mt-1 space-y-1 ml-2 border-l-2 border-[#2a3447] pl-3">
          {actions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Single Action Card ---
function ActionCard({ action }: { action: AgentAction }) {
  const [showDetails, setShowDetails] = useState(false);
  const { openFile } = useAppState();

  const icons: Record<string, string> = {
    write_file: "✏️", read_file: "📖", run_command: "▶️",
    search_files: "🔍", list_files: "📂",
  };

  const statusColor = action.status === "done" ? "text-teal-400" : action.status === "error" ? "text-red-400" : "text-yellow-400";

  return (
    <div className="rounded-md bg-[#0e1525] border border-[#1c2333] overflow-hidden text-xs">
      <div className="flex items-center gap-2 px-2.5 py-1.5">
        <span>{icons[action.type] || "🔧"}</span>
        <span className={`flex-1 font-mono truncate ${statusColor}`}>{action.label}</span>
        {action.status === "running" && <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />}
        {action.status === "done" && <span className="text-teal-500 text-[10px]">✓</span>}
        {action.type === "write_file" && action.status === "done" && (
          <button
            onClick={() => openFile(String(action.input.path))}
            className="text-teal-500 hover:text-teal-300 text-[10px] transition-colors"
          >
            Open
          </button>
        )}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          {showDetails ? "▼" : "▶"}
        </button>
      </div>

      {showDetails ? (
        <div className="border-t border-[#1c2333]">
          {action.type === "write_file" && action.input.content ? (
            <pre className="px-3 py-2 text-gray-400 bg-[#080d19] max-h-[250px] overflow-auto leading-relaxed">
              <code>{String(action.input.content)}</code>
            </pre>
          ) : null}
          {action.type === "run_command" ? (
            <div className="bg-[#080d19]">
              <div className="px-3 py-1 text-green-400 font-mono border-b border-[#1c2333]">
                $ {String(action.input.command || "")}
              </div>
              {action.output ? (
                <pre className="px-3 py-1 text-gray-500 max-h-[150px] overflow-auto whitespace-pre-wrap">
                  {action.output}
                </pre>
              ) : null}
            </div>
          ) : null}
          {!["write_file", "run_command"].includes(action.type) && action.output ? (
            <pre className="px-3 py-2 text-gray-500 bg-[#080d19] max-h-[150px] overflow-auto whitespace-pre-wrap">
              {action.output}
            </pre>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// --- Checkpoint Badge ---
function CheckpointBadge({ timestamp }: { timestamp: number }) {
  const ago = getTimeAgo(timestamp);
  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 h-px bg-[#1c2333]" />
      <span className="flex items-center gap-1.5 text-[10px] text-teal-500 font-medium">
        <span className="w-3 h-3 rounded-full bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-[8px]">✓</span>
        Checkpoint made {ago}
      </span>
      <div className="flex-1 h-px bg-[#1c2333]" />
    </div>
  );
}

// --- Work Duration Badge ---
function WorkDurationBadge({ seconds }: { seconds: number }) {
  const mins = Math.round(seconds / 60);
  return (
    <div className="flex items-center gap-2 py-1 text-[10px] text-gray-500">
      <span>⏱ Worked for {mins} minute{mins !== 1 ? "s" : ""}</span>
    </div>
  );
}

// --- Message Bubble ---
function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.isCheckpoint) return <CheckpointBadge timestamp={message.timestamp} />;
  if (message.workDuration) return <WorkDurationBadge seconds={message.workDuration} />;

  const isUser = message.role === "user";

  return (
    <div className={`${isUser ? "flex justify-end" : ""}`}>
      {isUser ? (
        <div className="max-w-[85%] rounded-xl px-4 py-2.5 text-sm bg-teal-600 text-white">
          {message.content}
        </div>
      ) : (
        <div className="space-y-1">
          {message.content && (
            <div className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          )}
          {message.actions && message.actions.length > 0 && (
            <ActionGroup actions={message.actions} />
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Chat Component ---
export default function AgentChat() {
  const {
    chatMessages, addChatMessage, updateLastAssistantMessage,
    isAgentRunning, setAgentRunning, sessionId, refreshFileTree,
    openFile, planMode, togglePlanMode, agentMode,
  } = useAppState();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Auto-send first message if workspace just opened with a user message
  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (!hasAutoSent.current && chatMessages.length === 1 && chatMessages[0].role === "user" && !isAgentRunning) {
      hasAutoSent.current = true;
      sendAgentRequest(chatMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatMessages]);

  const sendAgentRequest = useCallback(async (messages: ChatMessage[]) => {
    setAgentRunning(true);
    startTimeRef.current = Date.now();

    const assistantMsg: ChatMessage = {
      id: uuid(), role: "assistant", content: "", actions: [], timestamp: Date.now(),
    };
    addChatMessage(assistantMsg);

    const filesWritten: string[] = [];

    try {
      const apiMessages = messages
        .filter((m) => m.role === "user" || (m.role === "assistant" && m.content))
        .map((m) => ({ role: m.role, content: m.content }));

      const systemSuffix = planMode ? "\n\nThe user has Plan mode enabled. Create a detailed plan first before executing." : "";

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          sessionId,
          agentMode,
          planMode,
          systemSuffix,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case "text":
                updateLastAssistantMessage((prev) => ({
                  ...prev, content: prev.content + (event.content || ""),
                }));
                break;

              case "tool_call": {
                const action: AgentAction = {
                  id: event.toolCallId,
                  type: event.toolName,
                  label: getActionLabel(event.toolName, event.toolInput),
                  input: event.toolInput,
                  status: "running",
                  timestamp: Date.now(),
                };
                updateLastAssistantMessage((prev) => ({
                  ...prev, actions: [...(prev.actions || []), action],
                }));
                if (event.toolName === "write_file" && event.toolInput?.path) {
                  filesWritten.push(event.toolInput.path);
                }
                break;
              }

              case "tool_result":
                updateLastAssistantMessage((prev) => ({
                  ...prev,
                  actions: (prev.actions || []).map((a) =>
                    a.id === event.toolCallId
                      ? { ...a, status: "done" as const, output: event.content || "" }
                      : a
                  ),
                }));
                refreshFileTree();
                break;

              case "error":
                updateLastAssistantMessage((prev) => ({
                  ...prev, content: prev.content + `\n\n⚠️ ${event.content}`,
                }));
                break;
            }
          } catch {
            /* skip */
          }
        }
      }
    } catch (err) {
      updateLastAssistantMessage((prev) => ({
        ...prev, content: prev.content + `\n\n⚠️ ${err instanceof Error ? err.message : String(err)}`,
      }));
    } finally {
      setAgentRunning(false);
      refreshFileTree();

      // Add work duration badge
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (duration > 5) {
        addChatMessage({ id: uuid(), role: "system", content: "", workDuration: duration, timestamp: Date.now() });
      }

      // Add checkpoint
      addChatMessage({ id: uuid(), role: "system", content: "", isCheckpoint: true, timestamp: Date.now() });

      // Auto-open last file
      if (filesWritten.length > 0) openFile(filesWritten[filesWritten.length - 1]);
    }
  }, [addChatMessage, updateLastAssistantMessage, setAgentRunning, sessionId, refreshFileTree, openFile, planMode, agentMode]);

  const handleSend = async () => {
    if (!input.trim() || isAgentRunning) return;
    const userMsg: ChatMessage = { id: uuid(), role: "user", content: input.trim(), timestamp: Date.now() };
    addChatMessage(userMsg);
    setInput("");
    await sendAgentRequest([...chatMessages, userMsg]);
  };

  return (
    <div className="h-full flex flex-col bg-[#0e1525]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#1c2333] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-200">Agent</span>
          {isAgentRunning && (
            <span className="flex items-center gap-1 text-xs text-yellow-400 animate-pulse">
              <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
              Working...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-500 hover:text-gray-300 text-xs transition-colors">↻</button>
          <button className="text-gray-500 hover:text-gray-300 text-xs transition-colors" onClick={() => useAppState.getState().clearChat()}>+</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#1c2333] p-3">
        <div className="bg-[#1c2333] border border-[#2a3447] rounded-xl overflow-hidden focus-within:border-teal-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Make, test, iterate..."
            rows={1}
            disabled={isAgentRunning}
            className="w-full bg-transparent text-gray-200 placeholder-gray-600 px-4 pt-3 pb-1 text-sm resize-none outline-none min-h-[36px] max-h-[100px] disabled:opacity-50"
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 100) + "px";
            }}
          />
          <div className="flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <button className="text-gray-600 hover:text-gray-400 text-sm transition-colors">+</button>
              <button
                onClick={togglePlanMode}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  planMode
                    ? "bg-teal-600/30 text-teal-300"
                    : "text-gray-600 hover:text-gray-400"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${planMode ? "bg-teal-400" : "bg-gray-700"}`} />
                Plan
              </button>
            </div>
            {isAgentRunning ? (
              <button
                onClick={() => setAgentRunning(false)}
                className="px-3 py-1 text-xs bg-red-600/80 hover:bg-red-500 text-white rounded-md transition-colors"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="w-7 h-7 rounded-lg bg-teal-500 hover:bg-teal-400 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <span className="text-white text-xs">↑</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getActionLabel(toolName: string, input: Record<string, unknown>): string {
  switch (toolName) {
    case "write_file": return `Wrote ${input.path || "file"}`;
    case "read_file": return `Read ${input.path || "file"}`;
    case "run_command": return `Executed: ${String(input.command || "").slice(0, 50)}`;
    case "search_files": return `Searched for "${input.pattern}"`;
    case "list_files": return "Listed files";
    default: return toolName;
  }
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.round((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return `${hours}h ago`;
}
