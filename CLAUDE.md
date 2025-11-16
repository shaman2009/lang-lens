# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LangLens is a Next.js 15 web application for debugging and visualizing LangGraph applications. It's a **frontend-only** application that connects to a LangGraph server (default: `http://localhost:2024`).

## Development Commands

```bash
# Development
pnpm dev --turbo          # Start dev server on port 3000 with Turbo mode

# Quality Checks
pnpm check                # Run linting + TypeScript checks
pnpm typecheck            # TypeScript validation only
pnpm lint                 # ESLint
pnpm lint:fix             # Auto-fix linting issues

# Formatting
pnpm format:check         # Check Prettier formatting
pnpm format:write         # Auto-format with Prettier

# Build
pnpm build                # Production build
pnpm preview              # Build and start production server
pnpm start                # Start production server (after build)
```

**Required:** Node.js 18+, pnpm 10.20.0

## Architecture

### Core Stack
- **Next.js 15** with App Router (client-side only, no API routes)
- **React 19** with TypeScript 5 (strict mode)
- **TanStack Query v5** for server state management
- **LangGraph SDK** for real-time streaming via `useStream` hook
- **Shadcn/ui + Radix UI** for components
- **Tailwind CSS 4** for styling

### Key Architectural Patterns

#### 1. LangGraph SDK Integration
The app uses the `@langchain/langgraph-sdk/react` hook `useStream` for real-time conversation streaming:

```typescript
const thread = useStream<MessageThreadValues>({
  client: apiClient,           // Shared client from src/lib/api/client.ts
  assistantId: assistantId,
  threadId: threadId,
  reconnectOnMount: true,      // Auto-reconnect on component mount
  fetchStateHistory: true,     // Load previous messages
});
```

**Important:** The `apiClient` is a singleton defined in `src/lib/api/client.ts`. To change the LangGraph server URL, modify this file.

#### 2. Thread ID System
Threads use a dual-ID pattern:
- **Path = "new"**: Generate UUID client-side, don't pass to `useStream` initially
- **Path = existing ID**: Use existing thread ID immediately

See `src/app/workspace/threads/[threadId]/page.tsx:39-48` for implementation.

#### 3. TanStack Query Cache Management
Query keys follow a consistent pattern:

```typescript
["threads", "search", { limit, sortBy, sortOrder }]
["assistants", "search", { limit, sortBy, sortOrder }]
```

Thread mutations use optimistic updates via `queryClient.setQueryData`. When creating new threads, prepend to the cached array. When deleting, filter out by `thread_id`.

#### 4. Message Types (LangChain Core)
Messages follow the LangChain message format:
- `HumanMessage`: User input
- `AIMessage`: AI responses (may include `tool_calls` array)
- `ToolMessage`: Tool execution results

All messages flow through `MessageThreadValues.messages: BaseMessage[]`.

#### 5. Todo Queue Extraction
Todos are extracted from tool calls in AI messages:

```typescript
// Filter for AI messages with tool_calls named "write_todos" or "todo_write"
// Extract args.todos from the LAST matching tool call
// Format: { content, status: "pending" | "completed" }
```

See `src/app/workspace/threads/[threadId]/page.tsx:58-80`.

#### 6. Component Registry System
This project uses custom Shadcn registries for AI-specific components:

```json
{
  "@ai-elements": "https://registry.ai-sdk.dev/{name}.json",
  "@magicui": "https://magicui.design/r/{name}.json"
}
```

When adding AI elements, use: `npx shadcn@latest add @ai-elements/<component-name>`

### Directory Structure

```
src/
├── app/
│   ├── workspace/
│   │   ├── threads/[threadId]/page.tsx  # Main thread view with useStream
│   │   ├── threads/page.tsx              # Thread list
│   │   ├── assistants/page.tsx           # Assistant selection
│   │   └── layout.tsx                    # QueryClient + Sidebar setup
│   ├── layout.tsx                        # Root layout with ThemeProvider
│   └── page.tsx                          # Root redirect
├── components/
│   ├── ai-elements/          # AI-specific UI (message, code-block, tool, etc.)
│   ├── ui/                   # Shadcn/Radix base components
│   └── [workspace].tsx       # Workspace-level components
├── lib/
│   ├── api/
│   │   ├── client.ts         # LangGraph SDK client singleton
│   │   └── hooks.ts          # TanStack Query hooks (useThreads, useAssistants)
│   ├── thread/types.ts       # MessageThread, MessageThreadValues
│   ├── message/              # Message processing utilities
│   └── utils/                # Common utilities (cn, etc.)
├── hooks/                    # Custom React hooks
└── env.js                    # T3 Env validation with Zod
```

### Environment Variables

Environment validation uses `@t3-oss/env-nextjs` with Zod schemas in `src/env.js`.

Currently only `NODE_ENV` is required. To add new variables:
1. Add to appropriate schema (`server` or `client`)
2. Client vars must be prefixed with `NEXT_PUBLIC_`
3. Add to `runtimeEnv` mapping
4. Add to `.env.example`

To skip validation (e.g., in Docker): `SKIP_ENV_VALIDATION=1 pnpm build`

## Important Patterns

### Styling
- Use Tailwind utility classes exclusively
- Theme colors defined as CSS variables in `src/styles/globals.css`
- Use `cn()` from `@/lib/utils` for conditional classes
- Component variants use `class-variance-authority`

### Type Safety
- All components are TypeScript
- LangChain message types imported from `@langchain/core/messages`
- Thread types from `@/lib/thread`
- Strict mode enabled, no implicit any

### State Management
- **Server state**: TanStack Query (threads, assistants)
- **Local state**: React hooks (useState, useReducer)
- **URL state**: Next.js searchParams for assistantId, thread selection
- **No global state library** (no Redux, Zustand, etc.)

### Code Organization
- Client components: Mark with `"use client"` at top
- Server components: Default (rare in this app since it's interactive)
- Import aliases: `@/` maps to `src/`

## Testing the App

**Prerequisites:**
1. Start a LangGraph server: `http://localhost:2024`
2. Server must have at least one assistant available

**Workflow:**
1. `pnpm dev`
2. Open `http://localhost:3000`
3. Navigate to Assistants → Select an assistant
4. Creates new thread with streaming enabled
5. Send messages and watch real-time responses

**Common Issues:**
- **Blank assistant list**: LangGraph server not running or has no assistants
- **Connection errors**: Check `src/lib/api/client.ts` apiUrl matches your server
- **Type errors**: Run `pnpm typecheck` to catch before runtime
