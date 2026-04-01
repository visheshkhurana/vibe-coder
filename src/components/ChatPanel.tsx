"use client";
import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { useSession, ChatMessage } from "@/hooks/useSession";

// --- Tool Activity Card: shows what the agent is doing in real time ---
function ToolActivityCard({
  toolCall,
  result,
}: {
  toolCall: { name: string; input: Record<string, unknown>; id: string };
  result?: { toolCallId: string; toolName: string; output: string };
}) {
  const [expanded, setExpanded] = useState(true);

  const icons: Record<string, string> = {
    read_file: "📖",
    write_file: "✏️",
    run_command: "▶️",
    search_files: "🔍",
    list_files: "📂",
  };

  const icon = icons[toolCall.name] || "🔧";
  const isDone = !!result;

  // Friendly label
  let label = toolCall.name;
  if (toolCall.name === "write_file" && toolCall.input.path) {
    label = `Writing ${toolCall.input.path}`;
  } else if (toolCall.name === "read_file" && toolCall.input.path) {
    label = `Reading ${toolCall.input.path}`;
  } else if (toolCall.name === "run_command" && toolCall.input.command) {
    label = `Running: ${String(toolCall.input.command).slice(0, 60)}${String(toolCall.input.command).length > 60 ? "..." : ""}`;
  } else if (toolCall.name === "search_files") {
    label = `Searching for "${toolCall.input.pattern}"`;
  } else if (toolCall.name === "list_files") {
    label = "Listing files";
  }

  // Determine what content to show
  const getPreviewContent = () => {
    if (toolCall.name === "write_file" && toolCall.input.content) {
      return String(toolCall.input.content);
    }
    if (toolCall.name === "run_command" && toolCall.input.command) {
      return `$ ${toolCall.input.command}`;
    }
    if (toolCall.name === "read_file" && result?.output) {
      return result.output;
    }
    return null;
  };

  const preview = getPreviewContent();
  const resultOutput = result?.output;

  // Detect language for syntax coloring hint
  const getFileExt = () => {
    const path = String(toolCall.input.path || "");
    return path.split(".").pop()?.toLowerCase() || "";
  };

  return (
    <div className="rounded-md border border-[#3c3c3c] bg-[#1e1e1e] overflow-hidden text-xs mb-2">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-[#2a2d2e] transition-colors text-left"
      >
        <span>{icon}</span>
        <span className={`flex-1 font-mono truncate ${isDone ? "text-green-400" : "text-blue-400"}`}>
          {label}
        </span>
        {!isDone && (
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {isDone && <span className="text-green-500">✓</span>}
        <span className="text-gray-600">{expanded ? "▼" : "▶"}</span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#3c3c3c]">
          {/* Show code being written */}
          {toolCall.name === "write_file" && preview && (
            <div className="relative">
              <div className="absolute top-1 right-2 text-[10px] text-gray-600 font-mono">
                {getFileExt()}
              </div>
              <pre className="px-3 py-2 overflow-x-auto max-h-[300px] overflow-y-auto text-gray-300 leading-relaxed bg-[#0d1117]">
                <code>{preview}</code>
              </pre>
            </div>
          )}

          {/* Show command being run + output */}
          {toolCall.name === "run_command" && (
            <div className="bg-[#0d1117]">
              <div className="px-3 py-1.5 text-green-400 font-mono border-b border-[#3c3c3c]">
                $ {String(toolCall.input.command)}
              </div>
              {resultOutput && (
                <pre className="px-3 py-1.5 text-gray-400 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                  {resultOutput}
                </pre>
              )}
              {!resultOutput && !isDone && (
                <div className="px-3 py-1.5 text-gray-600 animate-pulse">
                  Running...
                </div>
              )}
            </div>
          )}

          {/* Show file read result */}
          {toolCall.name === "read_file" && isDone && resultOutput && (
            <pre className="px-3 py-2 overflow-x-auto max-h-[200px] overflow-y-auto text-gray-400 bg-[#0d1117]">
              <code>{resultOutput.slice(0, 2000)}{resultOutput.length > 2000 ? "\n..." : ""}</code>
            </pre>
          )}

          {/* Show search results */}
          {toolCall.name === "search_files" && isDone && resultOutput && (
            <pre className="px-3 py-2 max-h-[200px] overflow-y-auto text-gray-400 bg-[#0d1117] whitespace-pre-wrap">
              {resultOutput}
            </pre>
          )}

          {/* Show file listing */}
          {toolCall.name === "list_files" && isDone && resultOutput && (
            <pre className="px-3 py-2 max-h-[200px] overflow-y-auto text-gray-400 bg-[#0d1117] whitespace-pre-wrap">
              {resultOutput.slice(0, 1500)}
            </pre>
          )}

          {/* Reading in progress */}
          {toolCall.name === "read_file" && !isDone && (
            <div className="px-3 py-2 text-gray-600 animate-pulse bg-[#0d1117]">
              Reading file...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Message Bubble ---
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  // Pair tool calls with their results
  const toolPairs = (message.toolCalls || []).map((tc) => ({
    toolCall: tc,
    result: (message.toolResults || []).find((tr) => tr.toolCallId === tc.id),
  }));

  return (
    <div className={`${isUser ? "flex justify-end" : ""}`}>
      {isUser ? (
        <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-[#007acc] text-white">
          {message.content}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Text content (thinking / explanation) */}
          {message.content && (
            <div className="rounded-lg px-3 py-2 text-sm bg-[#2d2d2d] text-gray-200 border border-[#3c3c3c] whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          )}

          {/* Tool activity cards */}
          {toolPairs.length > 0 && (
            <div className="space-y-1">
              {toolPairs.map((pair) => (
                <ToolActivityCard
                  key={pair.toolCall.id}
                  toolCall={pair.toolCall}
                  result={pair.result}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel() {
  const {
    chatMessages,
    addChatMessage,
    updateLastAssistantMessage,
    isAgentRunning,
    setAgentRunning,
    sessionId,
    refreshFileTree,
    openFile,
  } = useSession();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!input.trim() || isAgentRunning) return;

    const userMessage: ChatMessage = {
      id: uuid(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    addChatMessage(userMessage);
    setInput("");
    setAgentRunning(true);

    // Create assistant placeholder
    const assistantMessage: ChatMessage = {
      id: uuid(),
      role: "assistant",
      content: "",
      toolCalls: [],
      toolResults: [],
      timestamp: Date.now(),
    };
    addChatMessage(assistantMessage);

    // Track files written so we can auto-open them
    const filesWritten: string[] = [];

    try {
      const apiMessages = [...chatMessages, userMessage]
        .filter((m) => m.role === "user" || m.role === "assistant")
        .filter((m) => m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, sessionId }),
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
                  ...prev,
                  content: prev.content + (event.content || ""),
                }));
                break;

              case "tool_call":
                updateLastAssistantMessage((prev) => ({
                  ...prev,
                  toolCalls: [
                    ...(prev.toolCalls || []),
                    { name: event.toolName, input: event.toolInput, id: event.toolCallId },
                  ],
                }));
                // Track files being written
                if (event.toolName === "write_file" && event.toolInput?.path) {
                  filesWritten.push(event.toolInput.path);
                }
                break;

              case "tool_result":
                updateLastAssistantMessage((prev) => ({
                  ...prev,
                  toolResults: [
                    ...(prev.toolResults || []),
                    {
                      toolCallId: event.toolCallId,
                      toolName: event.toolName,
                      output: event.content || "",
                    },
                  ],
                }));
                // Refresh file tree after each tool result
                refreshFileTree();
                break;

              case "error":
                updateLastAssistantMessage((prev) => ({
                  ...prev,
                  content: prev.content + `\n\n⚠️ Error: ${event.content}`,
                }));
                break;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      updateLastAssistantMessage((prev) => ({
        ...prev,
        content: prev.content + `\n\n⚠️ Error: ${err instanceof Error ? err.message : String(err)}`,
      }));
    } finally {
      setAgentRunning(false);
      refreshFileTree();
      // Auto-open the last file written in the editor
      if (filesWritten.length > 0) {
        openFile(filesWritten[filesWritten.length - 1]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] border-l border-[#3c3c3c]">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#3c3c3c] flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-300">⚡ Vibe Coder AI</span>
        {isAgentRunning && (
          <span className="text-xs text-yellow-400 animate-pulse flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Working...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-3 opacity-30">⚡</div>
            <p className="text-sm mb-4">What would you like to build?</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="cursor-pointer hover:text-gray-400" onClick={() => setInput("Build a React todo app with local storage")}>
                &quot;Build a React todo app&quot;
              </p>
              <p className="cursor-pointer hover:text-gray-400" onClick={() => setInput("Create a Python Flask API with CRUD endpoints")}>
                &quot;Create a Python Flask API&quot;
              </p>
              <p className="cursor-pointer hover:text-gray-400" onClick={() => setInput("Build a CLI tool in Node.js that converts CSV to JSON")}>
                &quot;Build a CSV to JSON CLI tool&quot;
              </p>
            </div>
          </div>
        )}
        {chatMessages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#3c3c3c] p-3">
        <div className="flex items-end gap-2 bg-[#2d2d2d] rounded-lg border border-[#3c3c3c] focus-within:border-[#007acc] transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build..."
            rows={1}
            className="flex-1 bg-transparent text-gray-200 outline-none resize-none px-3 py-2 text-sm placeholder-gray-500 min-h-[36px] max-h-[120px]"
            disabled={isAgentRunning}
            style={{
              height: "auto",
              overflow: "hidden",
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isAgentRunning}
            className="px-3 py-2 text-white bg-[#007acc] hover:bg-[#006bb3] disabled:opacity-30 disabled:cursor-not-allowed rounded-r-lg transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
