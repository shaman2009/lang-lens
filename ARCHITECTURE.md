# Architecture Documentation

This document provides a detailed technical overview of LangLens architecture, design patterns, and implementation details.

## Table of Contents

- [System Overview](#system-overview)
- [Technology Stack](#technology-stack)
- [Architecture Patterns](#architecture-patterns)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Type System](#type-system)
- [Performance Optimizations](#performance-optimizations)

## System Overview

LangLens is a **client-side only** Next.js application that connects to a LangGraph server. It does not have any backend API routes or server-side logic beyond Next.js's static generation and SSR capabilities.

```
┌─────────────────┐          ┌─────────────────┐
│   LangLens UI   │ ◄──────► │ LangGraph Server│
│  (Next.js App)  │   HTTP   │  (Port 2024)    │
└─────────────────┘          └─────────────────┘
       │
       │ Real-time Streaming
       │ (WebSocket/SSE)
       ▼
┌─────────────────┐
│  User Browser   │
└─────────────────┘
```

### Key Characteristics

- **Frontend-only**: No backend API routes, pure client-side application
- **Real-time**: WebSocket/SSE streaming for live updates
- **Stateless**: No server-side state, all state in browser
- **Type-safe**: Fully typed with TypeScript strict mode
- **Responsive**: Mobile-first, responsive design

## Technology Stack

### Core Framework

- **Next.js 15** (App Router)
  - Client-side rendering (CSR) for interactive pages
  - Static generation for layout components
  - No API routes or server components in workspace
  - Turbo mode support for faster development

- **React 19**
  - New concurrent features
  - Server components support (unused in this app)
  - Automatic batching
  - Transitions API

### Build & Development Tools

- **TypeScript 5.8** - Strict mode enabled
- **ESLint 9** - Next.js and TypeScript rules
- **Prettier 3.5** - Code formatting with Tailwind plugin
- **Tailwind CSS 4** - PostCSS-based utility-first styling
- **pnpm 10.20.0** - Fast, disk-efficient package manager

### UI Framework

- **Shadcn/ui** - Component library built on Radix UI
- **Radix UI** - Unstyled, accessible primitives
- **Lucide React** - Icon library (553 icons)
- **Framer Motion 12** - Animation library
- **class-variance-authority** - Component variants
- **tailwind-merge** - Conditional class merging

### Data & State Management

- **TanStack Query v5** - Server state, caching, and synchronization
- **LangGraph SDK** - LangGraph client and streaming hooks
- **Zod** - Runtime type validation
- **T3 Env** - Type-safe environment variables

## Architecture Patterns

### 1. LangGraph SDK Integration

LangLens uses the `@langchain/langgraph-sdk/react` package for real-time streaming.

```typescript
// Core streaming hook
const thread = useStream<MessageThreadValues>({
  client: apiClient,           // Singleton from src/lib/api/client.ts
  assistantId: assistantId,
  threadId: threadId,
  reconnectOnMount: true,      // Auto-reconnect on page mount
  fetchStateHistory: true,     // Load previous messages
});

// Accessing stream data
const messages = thread.values?.messages || [];
const isStreaming = thread.isStreaming;
const error = thread.error;
```

**Key Points:**
- Single client instance shared across the app
- Automatic reconnection on component mount
- Optimistic updates for better UX
- Error boundaries for stream failures

**Location**: `src/app/workspace/threads/[threadId]/page.tsx:39-48`

### 2. Thread ID Management

Threads use a dual-ID pattern to support both new and existing threads:

```typescript
// New thread flow
const params = await props.params;
const isNewThread = params.threadId === "new";

const [clientThreadId] = useState(() =>
  isNewThread ? nanoid() : params.threadId
);

// Pass undefined for new threads (created on first message)
const thread = useStream({
  threadId: isNewThread ? undefined : params.threadId,
  // ...
});
```

**Flow:**
1. User navigates to `/workspace/threads/new`
2. Generate UUID client-side with `nanoid()`
3. Don't pass `threadId` to `useStream` initially
4. On first message send, server creates thread
5. Client receives `thread_id` from server
6. Update URL to `/workspace/threads/{server-thread-id}`

**Location**: `src/app/workspace/threads/[threadId]/page.tsx:39-48`

### 3. TanStack Query Cache Management

Query keys follow a predictable, hierarchical pattern:

```typescript
// Query key patterns
["threads", "search", { limit, sortBy, sortOrder }]
["assistants", "search", { limit, sortBy, sortOrder }]
["thread", threadId]
["assistant", assistantId]
```

**Optimistic Updates:**

```typescript
// Creating a new thread
queryClient.setQueryData(
  ["threads", "search", params],
  (old) => [newThread, ...old]
);

// Deleting a thread
queryClient.setQueryData(
  ["threads", "search", params],
  (old) => old.filter(t => t.thread_id !== deletedId)
);
```

**Cache Invalidation:**
- Invalidate on mutations (`create`, `update`, `delete`)
- Stale time: 5 minutes for lists, 10 minutes for details
- Garbage collection: 15 minutes inactive

**Location**: `src/lib/api/hooks.ts`

### 4. Message Type System

Messages follow the LangChain message format from `@langchain/core/messages`:

```typescript
// Message types
type BaseMessage =
  | HumanMessage      // User input
  | AIMessage         // AI responses
  | ToolMessage       // Tool execution results
  | SystemMessage     // System prompts

// AI Message with tool calls
interface AIMessage {
  id: string;
  content: string;
  tool_calls?: ToolCall[];
  response_metadata?: {
    model: string;
    usage: TokenUsage;
  };
}

// Tool call structure
interface ToolCall {
  name: string;      // e.g., "write_todos", "search"
  args: unknown;     // Tool-specific arguments
  id: string;        // Unique call ID
  type: "tool_call";
}
```

**Processing Flow:**
1. User sends message → `HumanMessage`
2. AI processes → `AIMessage` (may include `tool_calls`)
3. Tools execute → `ToolMessage` (one per tool call)
4. AI responds → Final `AIMessage`

**Location**: `src/lib/thread/types.ts`, `@langchain/core/messages`

### 5. Todo Queue Extraction

Todos are extracted from AI message tool calls:

```typescript
// Extract todos from the LAST "write_todos" or "todo_write" tool call
const extractTodos = (messages: BaseMessage[]) => {
  const aiMessages = messages.filter(
    (m): m is AIMessage => m._getType() === "ai"
  );

  let lastTodoToolCall: ToolCall | undefined;

  for (const message of aiMessages) {
    const toolCalls = message.tool_calls || [];
    const todoCall = toolCalls.find(
      (tc) => tc.name === "write_todos" || tc.name === "todo_write"
    );
    if (todoCall) {
      lastTodoToolCall = todoCall;
    }
  }

  if (!lastTodoToolCall?.args) return [];

  const args = lastTodoToolCall.args as { todos?: Todo[] };
  return args.todos || [];
};

// Todo format
interface Todo {
  content: string;
  status: "pending" | "in_progress" | "completed";
  activeForm: string;  // Present continuous form
}
```

**Location**: `src/app/workspace/threads/[threadId]/page.tsx:58-80`

### 6. Component Registry System

LangLens uses multiple Shadcn registries for components:

```json
{
  "@ai-elements": "https://registry.ai-sdk.dev/{name}.json",
  "@magicui": "https://magicui.design/r/{name}.json"
}
```

**Adding components:**

```bash
# Standard shadcn component
npx shadcn@latest add button

# AI-specific component
npx shadcn@latest add @ai-elements/message

# Magic UI component
npx shadcn@latest add @magicui/animated-list
```

**Location**: `components.json`

## Data Flow

### Message Streaming Flow

```
┌──────────┐   1. Send Message    ┌──────────────┐
│  User    │ ──────────────────► │ LangGraph    │
│ (Client) │                      │   Server     │
└──────────┘                      └──────────────┘
     ▲                                    │
     │                                    │ 2. Process
     │                                    │    (Stream Events)
     │                                    ▼
     │                            ┌──────────────┐
     │ 4. Render Updates          │ Tool Calls   │
     │                            │ AI Responses │
     │                            └──────────────┘
     │                                    │
     │                                    │ 3. Stream to Client
     └────────────────────────────────────┘
              (WebSocket/SSE)
```

### Query State Flow

```
Component       TanStack Query      LangGraph SDK       Server
   │                  │                   │               │
   │  useThreads()    │                   │               │
   ├─────────────────►│                   │               │
   │                  │  Fetch if stale   │               │
   │                  ├──────────────────►│  GET /threads │
   │                  │                   ├──────────────►│
   │                  │                   │◄──────────────┤
   │                  │◄──────────────────┤   Response    │
   │◄─────────────────┤   Cached Data     │               │
   │  Render          │                   │               │
```

### Optimistic Update Flow

```
User Action     Component       QueryClient      Cache          Server
    │               │                │              │              │
    │ Delete Thread │                │              │              │
    ├──────────────►│                │              │              │
    │               │  Optimistic    │              │              │
    │               │  Update        │              │              │
    │               ├───────────────►│  Remove Item │              │
    │               │                ├─────────────►│              │
    │               │                │              │              │
    │               │  Mutation      │              │              │
    │               ├────────────────┼──────────────┼─────────────►│
    │               │                │              │   DELETE     │
    │               │                │              │              │
    │               │◄───────────────┼──────────────┼──────────────┤
    │               │  Success       │              │   200 OK     │
    │◄──────────────┤  UI Updated    │              │              │
```

## Component Architecture

### Directory Structure

```
src/
├── app/
│   ├── workspace/
│   │   ├── threads/
│   │   │   ├── [threadId]/
│   │   │   │   └── page.tsx        # Thread detail with streaming
│   │   │   └── page.tsx            # Thread list
│   │   ├── assistants/
│   │   │   └── page.tsx            # Assistant selection
│   │   └── layout.tsx              # QueryClient + Sidebar
│   ├── layout.tsx                  # Root layout + ThemeProvider
│   └── page.tsx                    # Root redirect
├── components/
│   ├── ai-elements/                # AI-specific UI components
│   │   ├── message.tsx             # Message rendering
│   │   ├── code-block.tsx          # Syntax-highlighted code
│   │   ├── tool.tsx                # Tool call display
│   │   ├── markdown.tsx            # Markdown rendering
│   │   └── ...                     # 33 more components
│   ├── ui/                         # Shadcn base components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...                     # 25+ components
│   ├── workspace-sidebar.tsx       # Main navigation
│   ├── messages.tsx                # Message list container
│   ├── todos.tsx                   # Todo queue display
│   └── ...
├── lib/
│   ├── api/
│   │   ├── client.ts               # LangGraph SDK client
│   │   └── hooks.ts                # TanStack Query hooks
│   ├── thread/
│   │   └── types.ts                # Thread type definitions
│   ├── message/
│   │   ├── types.ts                # Message type definitions
│   │   └── utils.ts                # Message processing
│   └── utils/
│       └── cn.ts                   # Class name merging
├── hooks/
│   ├── use-stick-to-bottom.ts     # Auto-scroll hook
│   └── ...
└── styles/
    └── globals.css                 # Global styles + CSS variables
```

### Component Hierarchy

```
RootLayout (ThemeProvider)
  └── WorkspaceLayout (QueryClientProvider, Sidebar)
      ├── ThreadsListPage
      │   └── ThreadsTable
      ├── AssistantsPage
      │   └── AssistantsGrid
      └── ThreadPage (useStream)
          ├── Messages
          │   └── Message
          │       ├── CodeBlock (Shiki)
          │       ├── ToolCallView
          │       └── Markdown
          ├── ChatInput
          └── Todos
```

## State Management

### State Categories

1. **Server State** (TanStack Query)
   - Threads list
   - Assistants list
   - Thread details
   - Message history

2. **Streaming State** (useStream)
   - Real-time messages
   - Streaming status
   - Connection state
   - Error state

3. **UI State** (React useState/useReducer)
   - Sidebar collapsed
   - Theme (dark/light)
   - Input text
   - Loading states

4. **URL State** (Next.js Router)
   - Current thread ID
   - Selected assistant ID
   - Search params

### State Location Strategy

```typescript
// ✅ Good: Server state in TanStack Query
const { data: threads } = useThreads({ limit: 50 });

// ✅ Good: Streaming state in useStream
const thread = useStream({ threadId });

// ✅ Good: UI state in component
const [inputText, setInputText] = useState("");

// ✅ Good: URL state in searchParams
const assistantId = searchParams.get("assistantId");

// ❌ Bad: Duplicating server state
const [threads, setThreads] = useState([]);  // Don't do this!
```

## API Integration

### Client Configuration

```typescript
// src/lib/api/client.ts
import { Client } from "@langchain/langgraph-sdk";

export const apiClient = new Client({
  apiUrl: "http://localhost:2024",
  // Additional config...
});
```

**To change the server URL:**
1. Edit `src/lib/api/client.ts`
2. Change `apiUrl` value
3. Restart dev server

### API Hooks

```typescript
// src/lib/api/hooks.ts

// List threads with caching
export function useThreads(params: ThreadsParams) {
  return useQuery({
    queryKey: ["threads", "search", params],
    queryFn: () => apiClient.threads.search(params),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  });
}

// Create thread with optimistic update
export function useCreateThread() {
  return useMutation({
    mutationFn: (data: CreateThreadData) =>
      apiClient.threads.create(data),
    onMutate: async (newThread) => {
      // Optimistically update cache
      await queryClient.cancelQueries(["threads"]);
      queryClient.setQueryData(
        ["threads", "search"],
        (old) => [newThread, ...old]
      );
    },
  });
}
```

## Type System

### Type Hierarchy

```typescript
// Core message types (from @langchain/core)
import type {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage
} from "@langchain/core/messages";

// Thread types
interface MessageThread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  status: "idle" | "busy" | "interrupted";
}

interface MessageThreadValues {
  messages: BaseMessage[];
  next?: string[];
}

// Component prop types
interface MessageProps {
  message: BaseMessage;
  isLast: boolean;
}
```

### Type Safety Patterns

```typescript
// Type guards
function isAIMessage(msg: BaseMessage): msg is AIMessage {
  return msg._getType() === "ai";
}

// Discriminated unions
type ThreadStatus =
  | { status: "idle" }
  | { status: "busy"; progress: number }
  | { status: "error"; error: Error };

// Generic constraints
function extractData<T extends BaseMessage>(
  messages: T[]
): T[] {
  return messages.filter(m => m.content);
}
```

## Performance Optimizations

### 1. Code Splitting

```typescript
// Dynamic imports for heavy components
const GraphVisualization = dynamic(
  () => import("@/components/graph-visualization"),
  { loading: () => <Skeleton /> }
);
```

### 2. Query Optimization

- **Stale time**: 5 minutes for lists, 10 minutes for details
- **Cache time**: 15 minutes
- **Refetch on window focus**: Disabled for performance
- **Pagination**: 50 items per page

### 3. Rendering Optimization

```typescript
// Memoization for expensive components
const MemoizedMessage = memo(Message, (prev, next) => {
  return prev.message.id === next.message.id;
});

// Virtual scrolling for long lists
import { useVirtualizer } from "@tanstack/react-virtual";
```

### 4. Bundle Optimization

- **Tree shaking**: Enabled in production build
- **Code splitting**: Automatic with Next.js
- **CSS purging**: Tailwind removes unused styles
- **Image optimization**: Next.js Image component

### 5. Streaming Optimization

- **Incremental updates**: Messages update as they stream
- **Auto-scroll**: Only when at bottom of page
- **Batching**: Group rapid updates together

## Security Considerations

### 1. XSS Prevention

- All user content sanitized before rendering
- Markdown uses `rehype-sanitize`
- Code blocks use syntax highlighting (not `eval`)

### 2. CORS

- LangGraph server must allow requests from frontend origin
- Configure CORS headers on server if needed

### 3. Environment Variables

- Validated with Zod schemas
- Client vars must be prefixed with `NEXT_PUBLIC_`
- No secrets in client-side code

### 4. Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
];
```

## Testing Strategy

### Recommended Testing Layers

1. **Unit Tests** - Individual utility functions
2. **Component Tests** - React Testing Library
3. **Integration Tests** - API hooks and data flow
4. **E2E Tests** - Playwright or Cypress

### Type Checking

```bash
pnpm typecheck  # Catch type errors before runtime
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Build Output

```bash
pnpm build

# Output:
# .next/              - Build output
# .next/static/       - Static assets
# .next/server/       - Server code (minimal)
```

### Environment Variables

```bash
# Production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-langgraph-server.com
```

## Debugging

### Development Tools

1. **React DevTools** - Component inspection
2. **TanStack Query DevTools** - Query cache inspection
3. **Next.js DevTools** - Build and route debugging
4. **Browser DevTools** - Network and console

### Logging

```typescript
// Enable query logging
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});
```

### Common Debug Points

- `src/lib/api/client.ts` - API configuration
- `src/app/workspace/threads/[threadId]/page.tsx` - Streaming logic
- `src/lib/api/hooks.ts` - Query configuration
- `src/components/messages.tsx` - Message rendering

## Further Reading

- [FRAMEWORKS.md](./FRAMEWORKS.md) - Detailed framework documentation
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [Next.js Documentation](https://nextjs.org/docs)
- [LangGraph SDK Documentation](https://langchain-ai.github.io/langgraph/)
