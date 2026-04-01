# Vibe Coder — AI-Powered Browser IDE

A Replit-style browser-based coding environment powered by Claude. Type what you want to build in the chat panel and watch the AI agent write code, create files, and run commands in real time.

## Features

- **AI Agent Chat** — Describe what you want; Claude writes the code, creates files, installs packages, and runs commands autonomously
- **Monaco Code Editor** — VS Code's editor in the browser with syntax highlighting, multi-tab support, and Ctrl+S save
- **Integrated Terminal** — Run shell commands directly, with command history (arrow keys)
- **File Explorer** — Browse your project's file tree, click to open files
- **Streaming Responses** — Watch the agent work in real time via Server-Sent Events
- **Tool Use Loop** — The agent can chain multiple tool calls (read/write files, run commands, search) across up to 20 turns per prompt
- **Sandboxed Workspaces** — Each session gets an isolated workspace directory

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Next.js)                     │
│  ┌──────────┬──────────────────┬───────────────────┐    │
│  │  File    │  Monaco Editor   │   AI Chat Panel   │    │
│  │ Explorer │  (multi-tab)     │   (streaming)     │    │
│  │          ├──────────────────┤                   │    │
│  │          │  Terminal        │                   │    │
│  └──────────┴──────────────────┴───────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / SSE
┌────────────────────────┴────────────────────────────────┐
│              Next.js API Routes (Node.js)                │
│  ┌────────────┬────────────────┬──────────────────┐     │
│  │ /api/chat  │  /api/files    │  /api/terminal   │     │
│  │ (SSE)      │  (CRUD)        │  (exec)          │     │
│  └─────┬──────┴───────┬────────┴────────┬─────────┘     │
│        │              │                 │               │
│  ┌─────┴──────┐ ┌─────┴──────┐  ┌──────┴──────┐       │
│  │ Agent Loop │ │  Sandbox   │  │   Sandbox   │       │
│  │ (Claude    │ │  File I/O  │  │   exec()    │       │
│  │  tool use) │ │            │  │             │       │
│  └────────────┘ └────────────┘  └─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Setup

```bash
# 1. Install dependencies
cd vibe-coder
npm install

# 2. Create your environment file
cp .env.local.example .env.local

# 3. Add your Anthropic API key to .env.local:
#   ANTHROPIC_API_KEY=sk-ant-your-key-here

# 4. Run the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

1. **Chat with the AI** — Type a prompt like "Build a React todo app" in the right panel
2. **Watch it work** — The agent creates files, installs packages, and runs commands
3. **Browse files** — Click files in the left sidebar to open them in the editor
4. **Edit code** — Make changes in Monaco Editor, press Ctrl+S to save
5. **Run commands** — Use the terminal at the bottom to run any shell command

## Project Structure

```
vibe-coder/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts      # SSE streaming endpoint — runs the agent loop
│   │   │   ├── files/route.ts     # File CRUD (read, write, list, delete)
│   │   │   └── terminal/route.ts  # Shell command execution
│   │   ├── globals.css            # Global styles (dark theme)
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Main IDE layout
│   ├── components/
│   │   ├── ChatPanel.tsx          # AI chat with streaming + tool call display
│   │   ├── CodeEditor.tsx         # Monaco Editor with tabs
│   │   ├── FileExplorer.tsx       # Recursive file tree sidebar
│   │   └── Terminal.tsx           # Interactive terminal with history
│   ├── hooks/
│   │   └── useSession.ts         # Zustand store — all app state
│   ├── lib/
│   │   ├── agent.ts              # Anthropic Claude agent with tool-use loop
│   │   └── sandbox.ts            # Sandboxed file I/O and command execution
│   └── types/
│       └── index.ts              # Shared TypeScript types
├── .env.local.example            # Environment variable template
├── package.json
└── README.md
```

## How the AI Agent Works

The agent uses Claude's **tool use** capability to interact with the workspace:

| Tool | Description |
|------|-------------|
| `read_file` | Read a file from the workspace |
| `write_file` | Create or overwrite a file |
| `run_command` | Execute a shell command (npm install, python, etc.) |
| `search_files` | Grep across workspace files |
| `list_files` | List the workspace directory tree |

The agent loop runs up to 20 turns per prompt — it can plan, write code, install dependencies, run tests, and fix errors all in one go.

## Integration with Claw Code Rust Backend

This frontend is designed to work standalone with the Anthropic API, but can be extended to use the [Claw Code Rust backend](https://github.com/visheshkhurana/claw-code/tree/main/rust) as a drop-in replacement for the agent loop. To integrate:

1. Build the Rust binary: `cd rust && cargo build --release`
2. Replace `/api/chat/route.ts` to spawn the Rust binary as a subprocess
3. Pipe prompts via stdin/stdout and stream responses back as SSE
4. The Rust backend provides its own tool execution, MCP server lifecycle, and session management

## Tech Stack

- **Next.js 16** — React framework with API routes
- **TypeScript** — End-to-end type safety
- **Tailwind CSS** — Utility-first styling (VS Code dark theme)
- **Monaco Editor** — The same editor that powers VS Code
- **Zustand** — Lightweight state management
- **Anthropic SDK** — Claude API with tool use
- **SSE** — Server-Sent Events for real-time streaming

## Roadmap

- [ ] Panel resizing (drag to resize editor/chat/terminal)
- [ ] File creation/deletion from the explorer UI
- [ ] Live preview pane for web apps (iframe)
- [ ] WebSocket terminal with persistent shell session
- [ ] User auth (Clerk / NextAuth)
- [ ] Cloud sandboxing (E2B / Docker / Firecracker)
- [ ] Project persistence (PostgreSQL + S3)
- [ ] Collaborative editing
- [ ] Deploy to Vercel / Railway

## License

MIT
