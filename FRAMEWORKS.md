# Frameworks & Dependencies Guide

This document provides detailed information about all frameworks, libraries, and dependencies used in LangLens, including their purpose, usage patterns, and best practices.

## Table of Contents

- [Core Frameworks](#core-frameworks)
- [UI & Styling](#ui--styling)
- [Data Management](#data-management)
- [AI & LangGraph Integration](#ai--langgraph-integration)
- [Developer Tools](#developer-tools)
- [Utilities](#utilities)
- [Build & Deployment](#build--deployment)

## Core Frameworks

### Next.js 15 (^15.2.3)

**Purpose**: React framework for production with App Router

**Why We Use It:**
- Modern App Router with server/client components
- Built-in routing with file-system based navigation
- Excellent TypeScript support
- Production-ready optimizations out of the box
- Turbo mode for faster development

**Key Features Used:**
- App Router (`src/app/`)
- Client Components (`"use client"`)
- Dynamic Routes (`[threadId]`)
- Metadata API
- Image optimization (Next/Image)

**Usage Example:**
```typescript
// src/app/workspace/threads/[threadId]/page.tsx
export default async function ThreadPage(props: {
  params: Promise<{ threadId: string }>;
}) {
  const params = await props.params;
  return <ThreadView threadId={params.threadId} />;
}
```

**Configuration:** `next.config.js`

**Documentation:** https://nextjs.org/docs

---

### React 19 (^19.0.0)

**Purpose**: UI library for building user interfaces

**Why We Use It:**
- Latest concurrent features for better performance
- Automatic batching for state updates
- Improved TypeScript support
- Server component support (future use)
- Better error boundaries

**Key Features Used:**
- Hooks (useState, useEffect, useMemo, useCallback)
- Context API (Theme, QueryClient)
- Error boundaries
- Suspense (lazy loading)
- Transitions API

**Usage Example:**
```typescript
import { useState, useEffect } from "react";

function ChatInput() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Side effects
  }, []);

  return <input value={message} onChange={e => setMessage(e.target.value)} />;
}
```

**Documentation:** https://react.dev/

---

### TypeScript 5.8 (^5.8.2)

**Purpose**: Type-safe JavaScript with static typing

**Why We Use It:**
- Catch errors at compile time
- Better IDE support and autocomplete
- Self-documenting code
- Refactoring confidence
- Strict mode for maximum safety

**Configuration:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "moduleResolution": "bundler"
  }
}
```

**Best Practices:**
- Always define types for props and state
- Use type inference where obvious
- Create reusable type definitions in `types.ts` files
- Use strict mode (no `any`, null checks)

**Documentation:** https://www.typescriptlang.org/

## UI & Styling

### Tailwind CSS 4 (^4.0.15)

**Purpose**: Utility-first CSS framework

**Why We Use It:**
- Rapid UI development with utility classes
- Consistent design system
- Tree-shaking removes unused CSS
- Dark mode support
- Responsive design utilities

**Configuration:** `tailwind.config.ts`, `postcss.config.js`

**Theme Customization:**
```css
/* src/styles/globals.css */
@theme {
  --color-primary: #3b82f6;
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
}

@theme dark {
  --color-background: #0a0a0a;
  --color-foreground: #fafafa;
}
```

**Usage Example:**
```tsx
<div className="flex items-center gap-4 rounded-lg bg-background p-4 shadow-md">
  <Button className="bg-primary text-white hover:bg-primary/90">
    Click Me
  </Button>
</div>
```

**Best Practices:**
- Use `cn()` utility for conditional classes
- Define colors in CSS variables
- Use responsive prefixes (`sm:`, `md:`, `lg:`)
- Leverage dark mode (`dark:` prefix)

**Documentation:** https://tailwindcss.com/

---

### Shadcn/ui

**Purpose**: Copy-paste component library built on Radix UI

**Why We Use It:**
- Own the code (not a dependency)
- Fully customizable components
- Accessible out of the box
- Beautiful default styling
- TypeScript-first

**Installed Components:**
- `button`, `input`, `select`, `dialog`
- `dropdown-menu`, `tooltip`, `card`
- `table`, `skeleton`, `badge`
- `sidebar`, `scroll-area`, `separator`
- And 15+ more...

**Adding Components:**
```bash
# Add a new component
npx shadcn@latest add dialog

# Add from AI registry
npx shadcn@latest add @ai-elements/message
```

**Configuration:** `components.json`

**Customization:**
```tsx
// Customize in src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        outline: "border border-input",
        ghost: "hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
  }
);
```

**Documentation:** https://ui.shadcn.com/

---

### Radix UI

**Purpose**: Unstyled, accessible UI primitives

**Why We Use It:**
- WAI-ARIA compliant
- Keyboard navigation
- Focus management
- Screen reader support
- Headless (style however you want)

**Installed Primitives:**
- `@radix-ui/react-dialog` - Modal dialogs
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-tooltip` - Tooltips
- `@radix-ui/react-scroll-area` - Custom scrollbars
- `@radix-ui/react-select` - Custom selects
- `@radix-ui/react-avatar` - Avatar component
- `@radix-ui/react-progress` - Progress bars
- And more...

**Usage Example:**
```tsx
import * as Dialog from "@radix-ui/react-dialog";

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Documentation:** https://www.radix-ui.com/

---

### Lucide React (^0.553.0)

**Purpose**: Beautiful, consistent icon library

**Why We Use It:**
- 553+ icons
- Tree-shakeable (import only what you use)
- Consistent design
- Accessible SVGs
- TypeScript support

**Usage Example:**
```tsx
import { Send, Trash2, Settings } from "lucide-react";

<Button>
  <Send className="h-4 w-4" />
  Send Message
</Button>
```

**Best Practices:**
- Use consistent sizing (`h-4 w-4`, `h-5 w-5`)
- Add `aria-label` for icon-only buttons
- Use semantic icons

**Documentation:** https://lucide.dev/

---

### Framer Motion (^12.23.24)

**Purpose**: Production-ready animation library

**Why We Use It:**
- Declarative animations
- Gesture support
- Layout animations
- Spring physics
- Server-side rendering support

**Usage Example:**
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

**Best Practices:**
- Use `AnimatePresence` for exit animations
- Prefer `layout` animations for smooth transitions
- Use `whileHover` and `whileTap` for interactions
- Keep animations subtle and fast (<300ms)

**Documentation:** https://www.framer.com/motion/

---

### Class Variance Authority (^0.7.1)

**Purpose**: Type-safe component variants

**Why We Use It:**
- Define component variants with types
- Automatic TypeScript inference
- Works perfectly with Tailwind
- Used by Shadcn/ui

**Usage Example:**
```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "rounded-md font-medium",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white",
        secondary: "bg-gray-200 text-gray-900",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants>;
```

**Documentation:** https://cva.style/docs

## Data Management

### TanStack Query v5 (^5.90.7)

**Purpose**: Powerful data synchronization for React

**Why We Use It:**
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

**Key Features Used:**
- `useQuery` - Fetch data
- `useMutation` - Modify data
- `useQueryClient` - Cache manipulation
- Query invalidation
- Optimistic updates

**Configuration:**
```tsx
// src/app/workspace/layout.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 15 * 60 * 1000,         // 15 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

**Usage Example:**
```tsx
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ["threads", { limit: 50 }],
  queryFn: () => apiClient.threads.search({ limit: 50 }),
});

// Mutate data
const mutation = useMutation({
  mutationFn: (thread: Thread) => apiClient.threads.create(thread),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["threads"] });
  },
});
```

**Best Practices:**
- Use descriptive query keys
- Set appropriate stale times
- Implement optimistic updates for better UX
- Handle loading and error states
- Invalidate queries after mutations

**Documentation:** https://tanstack.com/query/latest

---

### Zod (^3.24.2)

**Purpose**: TypeScript-first schema validation

**Why We Use It:**
- Runtime type validation
- Parse and validate API responses
- Environment variable validation
- Form validation
- Type inference

**Usage Example:**
```tsx
import { z } from "zod";

// Define schema
const threadSchema = z.object({
  thread_id: z.string(),
  created_at: z.string().datetime(),
  metadata: z.record(z.unknown()),
  status: z.enum(["idle", "busy", "interrupted"]),
});

// Infer type
type Thread = z.infer<typeof threadSchema>;

// Parse data
const thread = threadSchema.parse(apiResponse);
```

**Best Practices:**
- Define schemas for all external data
- Use `.parse()` for validation with errors
- Use `.safeParse()` for graceful error handling
- Leverage type inference with `z.infer`

**Documentation:** https://zod.dev/

---

### T3 Env (@t3-oss/env-nextjs ^0.12.0)

**Purpose**: Type-safe environment variables

**Why We Use It:**
- Runtime validation of env vars
- TypeScript autocomplete
- Clear error messages
- Prevents missing env vars in production

**Configuration:**
```typescript
// src/env.js
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
  },
  client: {
    // NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

**Best Practices:**
- Prefix client vars with `NEXT_PUBLIC_`
- Validate all required env vars
- Use appropriate Zod schemas
- Add to `.env.example`

**Documentation:** https://env.t3.gg/

## AI & LangGraph Integration

### @langchain/langgraph-sdk (^1.0.0)

**Purpose**: Official LangGraph SDK for JavaScript/TypeScript

**Why We Use It:**
- Type-safe LangGraph client
- Real-time streaming support
- React hooks for streaming
- Automatic reconnection
- State management

**Key Features:**
- `Client` - Main API client
- `useStream` - React hook for streaming
- Thread management
- Assistant management
- State history

**Usage Example:**
```tsx
import { Client } from "@langchain/langgraph-sdk";
import { useStream } from "@langchain/langgraph-sdk/react";

// Create client
const client = new Client({
  apiUrl: "http://localhost:2024",
});

// Use streaming hook
const thread = useStream({
  client: client,
  assistantId: "my-assistant",
  threadId: "thread-123",
  reconnectOnMount: true,
  fetchStateHistory: true,
});

// Access data
const messages = thread.values?.messages || [];
const isStreaming = thread.isStreaming;
```

**Best Practices:**
- Create single client instance (singleton)
- Enable `reconnectOnMount` for better UX
- Handle loading and error states
- Use optimistic updates for sent messages

**Documentation:** https://langchain-ai.github.io/langgraph/

---

### @langchain/core (^1.0.3)

**Purpose**: Core LangChain types and utilities

**Why We Use It:**
- Message type definitions
- Serialization utilities
- Base classes
- Type safety with LangGraph

**Key Types:**
```typescript
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
  SystemMessage,
} from "@langchain/core/messages";
```

**Documentation:** https://js.langchain.com/docs/

---

### AI SDK (^5.0.89)

**Purpose**: Vercel AI SDK for additional AI utilities

**Why We Use It:**
- Streaming utilities
- Message formatting
- Additional AI integrations
- Type definitions

**Usage:** Used selectively for utility functions and types.

**Documentation:** https://sdk.vercel.ai/docs

## Developer Tools

### ESLint (^9.23.0)

**Purpose**: JavaScript/TypeScript linting

**Why We Use It:**
- Catch code issues early
- Enforce coding standards
- Prevent common bugs
- Consistent code style

**Configuration:** `eslint.config.js`

**Rules Used:**
- Next.js recommended rules
- TypeScript ESLint rules
- React hooks rules
- Accessibility rules

**Commands:**
```bash
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues
```

**Documentation:** https://eslint.org/

---

### Prettier (^3.5.3)

**Purpose**: Opinionated code formatter

**Why We Use It:**
- Consistent code style
- No style debates
- Automatic formatting
- Works with Tailwind (plugin)

**Configuration:** `prettier.config.js`

**Plugins:**
- `prettier-plugin-tailwindcss` - Sort Tailwind classes

**Commands:**
```bash
pnpm format:check  # Check formatting
pnpm format:write  # Auto-format
```

**Best Practices:**
- Format on save (IDE setting)
- Run before committing
- Use with ESLint (no conflicts)

**Documentation:** https://prettier.io/

---

### TypeScript ESLint (^8.27.0)

**Purpose**: ESLint rules for TypeScript

**Why We Use It:**
- TypeScript-specific linting
- Type-aware rules
- Best practices enforcement

**Documentation:** https://typescript-eslint.io/

## Utilities

### clsx (^2.1.1) & tailwind-merge (^3.3.1)

**Purpose**: Conditional className merging

**Combined as `cn()` utility:**
```typescript
// src/lib/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**
```tsx
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class",
  className
)} />
```

---

### nanoid (^5.1.6)

**Purpose**: Tiny, secure URL-friendly ID generator

**Why We Use It:**
- Generate unique IDs client-side
- URL-safe characters
- Cryptographically strong
- Smaller than UUID

**Usage:**
```typescript
import { nanoid } from "nanoid";

const threadId = nanoid();  // "V1StGXR8_Z5jdHi6B-myT"
```

---

### uuid (^13.0.0)

**Purpose**: UUID generation (v4)

**Usage:**
```typescript
import { v4 as uuidv4 } from "uuid";

const id = uuidv4();  // "110ec58a-a0f2-4ac4-8393-c866d813b8d1"
```

---

### date-fns (^4.1.0)

**Purpose**: Modern date utility library

**Why We Use It:**
- Modular (tree-shakeable)
- TypeScript support
- Immutable
- Locale support

**Usage:**
```typescript
import { formatDistanceToNow, format } from "date-fns";

// "2 hours ago"
formatDistanceToNow(new Date(thread.created_at), { addSuffix: true });

// "Jan 15, 2025"
format(new Date(thread.created_at), "MMM dd, yyyy");
```

---

### Shiki (^3.15.0)

**Purpose**: Syntax highlighter using VS Code themes

**Why We Use It:**
- Beautiful syntax highlighting
- VS Code themes
- Many languages supported
- Fast and lightweight

**Usage:**
```tsx
import { codeToHtml } from "shiki";

const html = await codeToHtml(code, {
  lang: "typescript",
  theme: "github-dark",
});
```

---

### XYFlow (@xyflow/react ^12.9.2)

**Purpose**: Graph visualization library

**Why We Use It:**
- Interactive node graphs
- Visualize agent workflows
- Drag and drop
- Customizable nodes and edges

**Documentation:** https://reactflow.dev/

## Build & Deployment

### pnpm (10.20.0)

**Purpose**: Fast, disk-efficient package manager

**Why We Use It:**
- Faster than npm/yarn
- Saves disk space (symlinks)
- Strict dependency resolution
- Workspace support

**Configuration:** `.npmrc`, `pnpm-lock.yaml`

**Commands:**
```bash
pnpm install       # Install dependencies
pnpm add <pkg>     # Add dependency
pnpm remove <pkg>  # Remove dependency
```

**Documentation:** https://pnpm.io/

---

### PostCSS (^8.5.3)

**Purpose**: CSS transformation tool

**Why We Use It:**
- Process Tailwind CSS
- Autoprefixer
- CSS optimization

**Configuration:** `postcss.config.js`

**Documentation:** https://postcss.org/

## Version Management

### Package Version Strategy

We use the following version constraints:

- **Core frameworks** (`^`): Allow minor and patch updates
- **UI libraries** (`^`): Allow minor and patch updates
- **Build tools** (`^`): Allow minor and patch updates

### Updating Dependencies

```bash
# Check for outdated packages
pnpm outdated

# Update specific package
pnpm update <package-name>

# Update all (careful!)
pnpm update --latest

# Always test after updates
pnpm check
pnpm build
```

## Dependency Tree

### Production Dependencies (Core)
```
next 15
  ├── react 19
  ├── react-dom 19
  └── @swc/core (internal)

@langchain/langgraph-sdk
  └── @langchain/core

@tanstack/react-query
  └── react 19
```

### Production Dependencies (UI)
```
@radix-ui/* (primitives)
  └── react 19

lucide-react (icons)
  └── react 19

framer-motion (animations)
  └── react 19
```

### Dev Dependencies
```
typescript
  └── @types/*

eslint
  ├── typescript-eslint
  └── eslint-config-next

prettier
  └── prettier-plugin-tailwindcss
```

## License Information

All dependencies are MIT or similarly permissive licenses. See individual package licenses:

```bash
pnpm licenses list
```

## Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [package.json](./package.json) - Full dependency list
