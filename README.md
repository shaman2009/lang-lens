# LangLens

> A modern, beautiful debugging and visualization UI for [LangGraph](https://github.com/langchain-ai/langgraph) applications.

LangLens provides an intuitive web interface to interact with, monitor, and debug your LangGraph assistants in real-time, with rich message rendering, conversation management, and powerful visualization tools.

## Why LangLens?

Building AI applications with LangGraph is powerful, but debugging and understanding complex agent workflows can be challenging. LangLens bridges this gap by providing:

- **Visual Clarity** - See exactly what your agents are doing in real-time
- **Debugging Power** - Track tool calls, state changes, and reasoning chains
- **Production Monitoring** - Monitor live conversations and agent behavior
- **Developer Experience** - Beautiful UI that makes debugging enjoyable

### Use Cases

- **Development**: Debug and test LangGraph agents during development
- **QA Testing**: Validate agent behavior across different scenarios
- **Production Monitoring**: Monitor live agent conversations in production
- **Team Collaboration**: Share and review agent conversations with your team
- **Learning**: Understand how LangGraph agents work by visualizing their execution

## Features

### Core Functionality
- **Real-time Streaming** - Watch AI responses stream in real-time with full LangGraph SDK integration
- **Thread Management** - Create, view, and manage conversation threads with powerful search and filtering
- **Assistant Discovery** - Browse and select from available LangGraph assistants
- **Message History** - Full conversation history with rich metadata and state tracking

### Rich Message Rendering
- **Syntax Highlighting** - Beautiful code blocks powered by Shiki with language detection
- **Tool Call Visualization** - Clear display of tool executions and their results
- **Chain of Thought** - Visual representation of AI reasoning processes
- **Artifacts & Files** - Render files, images, and other artifacts inline
- **State Checkpoints** - Track and visualize LangGraph state checkpoints
- **Citations & Sources** - Display message sources and references

### User Experience
- **Dark/Light Theme** - Elegant theme switching with system preference support
- **Responsive Design** - Optimized for desktop and mobile devices
- **Auto-scroll** - Smart scrolling behavior that follows new messages
- **Collapsible Sidebar** - Maximize screen space with icon-only collapse mode
- **Recent Threads** - Quick access to your latest conversations
- **Loading States** - Smooth loading animations and skeleton screens

## Tech Stack

Built with modern web technologies for optimal performance and developer experience:

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React features
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling
- **[Shadcn/ui](https://ui.shadcn.com/)** - High-quality component library
- **[Radix UI](https://www.radix-ui.com/)** - Accessible primitives
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and caching
- **[@langchain/langgraph-sdk](https://github.com/langchain-ai/langgraph)** - LangGraph integration
- **[XYFlow](https://reactflow.dev/)** - Graph visualization
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Open http://localhost:3000
```

That's it! LangLens will connect to your LangGraph server at `http://localhost:2024` by default.

## Getting Started

### Prerequisites

- **Node.js 18+** and **pnpm 10.20.0**
- A running **LangGraph server** (default: `http://localhost:2024`)
- At least one LangGraph assistant configured on your server

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lang-lens.git
cd lang-lens
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables (optional):
```bash
cp .env.example .env.local
```

Edit `.env.local` if you need to customize settings.

4. Start the development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Configuration

### LangGraph Server

By default, LangLens connects to a LangGraph server at `http://localhost:2024`. You can modify this in `/src/lib/api/client.ts`:

```typescript
const apiClient = new Client({
  apiUrl: "http://localhost:2024"
});
```

### Environment Variables

Configure your environment in `.env.local`:

```env
# Add your configuration here
# NEXT_PUBLIC_API_URL=http://localhost:2024
```

## Project Structure

```
lang-lens/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── workspace/          # Main application
│   │   │   ├── threads/        # Thread management
│   │   │   └── assistants/     # Assistant selection
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ai-elements/        # AI-specific UI (37 components)
│   │   ├── ui/                 # Shadcn/Radix components
│   │   ├── workspace-sidebar.tsx
│   │   ├── messages.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── api/                # LangGraph SDK client & hooks
│   │   ├── thread/             # Thread utilities
│   │   └── utils/              # Common utilities
│   ├── hooks/                  # Custom React hooks
│   └── styles/                 # Global styles
├── public/                     # Static assets
└── package.json
```

## Development

### Available Commands

```bash
# Development
pnpm dev --turbo          # Start dev server with Turbo mode (recommended)
pnpm dev                  # Start dev server

# Code Quality
pnpm check                # Run all checks (lint + typecheck)
pnpm typecheck            # TypeScript type checking only
pnpm lint                 # Run ESLint
pnpm lint:fix             # Auto-fix ESLint issues

# Formatting
pnpm format:check         # Check code formatting
pnpm format:write         # Auto-format code with Prettier

# Build & Deploy
pnpm build                # Create production build
pnpm start                # Start production server (after build)
pnpm preview              # Build and start production server
```

### Code Quality Standards

This project maintains high code quality with:
- **ESLint** - Linting with Next.js and TypeScript rules
- **Prettier** - Consistent code formatting with Tailwind plugin
- **TypeScript** - Strict mode type checking
- **Git Hooks** - Pre-commit checks (optional)

**Before committing:** Run `pnpm check` to ensure all quality checks pass.

## Usage

### Starting a Conversation

1. Navigate to **Assistants** from the sidebar
2. Select an assistant to chat with
3. Start typing your message in the input box
4. Watch responses stream in real-time

### Managing Threads

- View all threads: `/workspace/threads`
- Open a thread: Click on it in the sidebar or table
- Delete a thread: Right-click and select delete
- Recent threads appear in the sidebar for quick access

### Theme Switching

Click the theme toggle in the header to switch between dark and light modes.

## Troubleshooting

### Common Issues

**No assistants showing up**
- Ensure your LangGraph server is running on `http://localhost:2024`
- Verify your server has at least one assistant configured
- Check the browser console for connection errors

**Connection errors**
- Verify the API URL in `src/lib/api/client.ts` matches your server
- Check that your LangGraph server is accessible
- Ensure there are no CORS issues

**Type errors during build**
- Run `pnpm typecheck` to see all type errors
- Ensure you're using Node.js 18+ and pnpm 10.20.0
- Try deleting `node_modules` and `.next`, then reinstall

**Development server not starting**
- Check if port 3000 is already in use
- Try `pnpm dev --port 3001` to use a different port
- Clear Next.js cache: `rm -rf .next`

For more help, see [ARCHITECTURE.md](./ARCHITECTURE.md) or open an issue.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

Quick contribution workflow:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and ensure tests pass (`pnpm check`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Setup

```bash
git clone https://github.com/yourusername/lang-lens.git
cd lang-lens
pnpm install
pnpm dev
```

## License

[MIT](LICENSE)

## Acknowledgments

- [LangChain](https://github.com/langchain-ai/langchain) & [LangGraph](https://github.com/langchain-ai/langgraph) for the amazing framework
- [Shadcn](https://ui.shadcn.com/) for the beautiful component library
- [Vercel](https://vercel.com/) for Next.js and deployment platform

---

Built with ❤️ for the LangGraph community
