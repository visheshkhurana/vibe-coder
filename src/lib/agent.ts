// ============================================================
// AI Agent — Anthropic Claude with tool use for coding tasks
// ============================================================
import Anthropic from "@anthropic-ai/sdk";
import { readFile, writeFile, runCommand, searchFiles, listFiles } from "./sandbox";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "" });

// Tool definitions for the agent
const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description: "Read the contents of a file at a given path in the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path relative to workspace root" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file. Creates the file and any parent directories if they don't exist. Overwrites if the file already exists.",
    input_schema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "File path relative to workspace root" },
        content: { type: "string", description: "Full file content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_command",
    description:
      "Execute a shell command in the workspace. Use for installing packages, running scripts, compiling code, running tests, etc.",
    input_schema: {
      type: "object" as const,
      properties: {
        command: { type: "string", description: "Shell command to execute" },
        cwd: { type: "string", description: "Working directory relative to workspace (optional)" },
      },
      required: ["command"],
    },
  },
  {
    name: "search_files",
    description: "Search for a pattern (regex or string) across files in the workspace.",
    input_schema: {
      type: "object" as const,
      properties: {
        pattern: { type: "string", description: "Search pattern" },
        directory: { type: "string", description: "Directory to search in (default: .)" },
      },
      required: ["pattern"],
    },
  },
  {
    name: "list_files",
    description: "List all files and directories in the workspace, recursively.",
    input_schema: {
      type: "object" as const,
      properties: {
        directory: { type: "string", description: "Directory to list (default: .)" },
      },
      required: [],
    },
  },
];

const SYSTEM_PROMPT = `You are Vibe Coder, an expert AI coding assistant running inside a browser-based IDE. You help users build software by writing code, running commands, and managing files in their workspace.

You have access to a workspace directory where you can create, read, and edit files, and run shell commands. When the user asks you to build something, you should:

1. Plan the approach briefly
2. Create the necessary files using write_file
3. Install dependencies using run_command
4. Test the code using run_command
5. Explain what you did

Be proactive — write complete, working code. Don't just explain what to do, actually do it.
When writing code, always write the complete file contents. Never use placeholder comments like "// rest of code here".
Prefer modern best practices and clean code.`;

// Execute a tool call against the sandbox
async function executeTool(
  sessionId: string,
  toolName: string,
  toolInput: Record<string, string>
): Promise<string> {
  try {
    switch (toolName) {
      case "read_file":
        return await readFile(sessionId, toolInput.path);
      case "write_file":
        await writeFile(sessionId, toolInput.path, toolInput.content);
        return `File written: ${toolInput.path}`;
      case "run_command": {
        const result = await runCommand(sessionId, toolInput.command, toolInput.cwd);
        const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
        return output || `Command completed with exit code ${result.exitCode}`;
      }
      case "search_files":
        return await searchFiles(sessionId, toolInput.pattern, toolInput.directory);
      case "list_files": {
        const files = await listFiles(sessionId, toolInput.directory || ".");
        return JSON.stringify(files, null, 2);
      }
      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error: ${message}`;
  }
}

// Streaming agent types
export interface AgentEvent {
  type: "text" | "tool_call" | "tool_result" | "done" | "error";
  content?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolCallId?: string;
}

// Run the agentic loop — yields events as they happen
export async function* runAgentLoop(
  sessionId: string,
  messages: Anthropic.MessageParam[]
): AsyncGenerator<AgentEvent> {
  const conversationMessages: Anthropic.MessageParam[] = [...messages];

  // Loop to handle multi-turn tool use
  for (let turn = 0; turn < 20; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages: conversationMessages,
    });

    // Process content blocks
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let hasToolUse = false;

    for (const block of response.content) {
      if (block.type === "text") {
        yield { type: "text", content: block.text };
      } else if (block.type === "tool_use") {
        hasToolUse = true;
        const input = block.input as Record<string, string>;

        yield {
          type: "tool_call",
          toolName: block.name,
          toolInput: block.input as Record<string, unknown>,
          toolCallId: block.id,
        };

        // Execute the tool
        const result = await executeTool(sessionId, block.name, input);

        yield {
          type: "tool_result",
          toolCallId: block.id,
          toolName: block.name,
          content: result,
        };

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    // If no tool use, we're done
    if (!hasToolUse || response.stop_reason === "end_turn") {
      yield { type: "done" };
      return;
    }

    // Add assistant response and tool results for next turn
    conversationMessages.push({ role: "assistant", content: response.content });
    conversationMessages.push({ role: "user", content: toolResults });
  }

  yield { type: "error", content: "Agent loop exceeded maximum turns." };
}
