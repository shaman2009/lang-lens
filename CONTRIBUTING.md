# Contributing to LangLens

Thank you for your interest in contributing to LangLens! This guide will help you get started with contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed
- **pnpm 10.20.0** installed (required)
- A **LangGraph server** running for testing
- A code editor (VS Code recommended)
- Git for version control

### Development Setup

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR-USERNAME/lang-lens.git
   cd lang-lens
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/original-owner/lang-lens.git
   ```

4. **Install dependencies**

   ```bash
   pnpm install
   ```

5. **Start development server**

   ```bash
   pnpm dev --turbo
   ```

6. **Open in browser**

   Navigate to `http://localhost:3000`

### VS Code Setup (Recommended)

Install these extensions for the best development experience:

- **ESLint** - `dbaeumer.vscode-eslint`
- **Prettier** - `esbenp.prettier-vscode`
- **Tailwind CSS IntelliSense** - `bradlc.vscode-tailwindcss`
- **TypeScript Vue Plugin (Volar)** - `Vue.vscode-typescript-vue-plugin`

**Workspace Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Create a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch Naming Convention:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding or updating tests
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the coding standards (see below)
- Add comments for complex logic
- Update documentation if needed

### 3. Test Your Changes

Before committing, ensure:

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Formatting check
pnpm format:check

# Or run all checks
pnpm check

# Build to ensure no build errors
pnpm build
```

### 4. Commit Your Changes

Follow our commit message guidelines (see below):

```bash
git add .
git commit -m "feat: add new message visualization"
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template
5. Submit the PR

## Coding Standards

### TypeScript

- **Use strict mode** - No `any` types unless absolutely necessary
- **Prefer interfaces** for object shapes
- **Use type inference** where obvious
- **Define return types** for functions
- **Use const assertions** for literal types

**Good:**
```typescript
interface UserProps {
  name: string;
  age: number;
}

function greetUser(user: UserProps): string {
  return `Hello, ${user.name}!`;
}
```

**Bad:**
```typescript
function greetUser(user: any) {
  return `Hello, ${user.name}!`;
}
```

### React Components

- **Use functional components** with hooks
- **Prefer named exports** over default exports
- **Use TypeScript** for prop types
- **Memoize expensive computations** with `useMemo`
- **Extract complex logic** into custom hooks

**Component Structure:**
```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Button onClick={onAction}>
        Count: {count}
      </Button>
    </div>
  );
}
```

### Styling

- **Use Tailwind utilities** exclusively
- **Use `cn()` utility** for conditional classes
- **Follow mobile-first** approach
- **Use CSS variables** for theme colors
- **Keep classes organized** (layout → spacing → colors → typography)

**Good:**
```tsx
<div className={cn(
  // Layout
  "flex items-center justify-between",
  // Spacing
  "gap-4 p-4",
  // Colors & borders
  "rounded-lg border bg-card",
  // Typography
  "text-card-foreground",
  // Conditional
  isActive && "bg-accent"
)}>
  Content
</div>
```

### File Organization

- **One component per file** (unless closely related)
- **Co-locate related files** (component + types + utils)
- **Use index.ts** for public API of a module
- **Keep files focused** - single responsibility

**Directory Structure:**
```
src/components/message-list/
├── message-list.tsx          # Main component
├── message-item.tsx          # Sub-component
├── message-list.types.ts     # Type definitions
├── message-list.utils.ts     # Utility functions
└── index.ts                  # Public exports
```

### Naming Conventions

- **Components**: PascalCase - `MessageList`, `ChatInput`
- **Files**: kebab-case - `message-list.tsx`, `chat-input.tsx`
- **Functions**: camelCase - `fetchThreads`, `formatDate`
- **Constants**: UPPER_SNAKE_CASE - `API_URL`, `MAX_RETRIES`
- **Types/Interfaces**: PascalCase - `MessageProps`, `ThreadData`

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no code change)
- `refactor`: Code refactoring (no feature change)
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies
- `ci`: CI/CD changes
- `revert`: Revert a previous commit

### Examples

```bash
# Feature
feat(messages): add syntax highlighting to code blocks

# Bug fix
fix(threads): resolve infinite loop in thread polling

# Documentation
docs(readme): update installation instructions

# Refactoring
refactor(api): simplify client initialization logic

# Performance
perf(rendering): memoize expensive message computations

# Breaking change
feat(api)!: change thread API to use snake_case

BREAKING CHANGE: Thread API now uses snake_case for all fields
```

### Scope (Optional)

Common scopes in this project:
- `messages` - Message rendering and display
- `threads` - Thread management
- `assistants` - Assistant selection and management
- `api` - API client and hooks
- `ui` - UI components
- `streaming` - Real-time streaming
- `config` - Configuration changes

## Pull Request Process

### Before Submitting

1. **Ensure all checks pass**
   ```bash
   pnpm check
   pnpm build
   ```

2. **Update documentation** if needed
   - README.md for user-facing changes
   - ARCHITECTURE.md for architectural changes
   - Inline code comments for complex logic

3. **Add yourself to contributors** (if first contribution)

### PR Title

Follow the same format as commit messages:

```
feat(messages): add markdown table support
fix(threads): resolve race condition in thread creation
```

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How to Test
1. Step-by-step testing instructions
2. Expected behavior
3. Screenshots if applicable

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes locally
```

### Review Process

1. **Automated checks** will run (ESLint, TypeScript, build)
2. **Maintainers** will review your code
3. **Address feedback** by pushing new commits
4. **Approval** - Once approved, a maintainer will merge

### After Merge

1. **Delete your branch** (optional but recommended)
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your fork**
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

## Testing

### Manual Testing

Always test your changes manually:

1. **Start development server**
   ```bash
   pnpm dev
   ```

2. **Test core flows**
   - Create a new thread
   - Send messages
   - View thread history
   - Switch assistants
   - Test dark/light theme

3. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Large datasets

### Type Checking

```bash
pnpm typecheck
```

Fix all type errors before submitting a PR.

### Linting

```bash
pnpm lint        # Check for issues
pnpm lint:fix    # Auto-fix issues
```

### Build Testing

```bash
pnpm build       # Ensure production build works
pnpm preview     # Test production build locally
```

## Documentation

### When to Update Documentation

Update documentation when you:
- Add a new feature
- Change existing behavior
- Modify architecture
- Add new dependencies
- Change configuration

### Documentation Files

- **README.md** - User-facing documentation, quick start
- **ARCHITECTURE.md** - Technical architecture, patterns
- **FRAMEWORKS.md** - Framework and library details
- **CONTRIBUTING.md** - This file
- **DEPLOYMENT.md** - Deployment instructions
- **CLAUDE.md** - AI assistant guidance

### Inline Documentation

```typescript
/**
 * Extracts todos from AI message tool calls.
 *
 * Searches through AI messages for tool calls named "write_todos"
 * or "todo_write" and returns the todos from the LAST matching call.
 *
 * @param messages - Array of messages to search
 * @returns Array of todos, or empty array if none found
 */
function extractTodos(messages: BaseMessage[]): Todo[] {
  // Implementation...
}
```

## Issue Reporting

### Before Creating an Issue

1. **Search existing issues** - Your issue may already exist
2. **Check documentation** - Ensure it's not a known limitation
3. **Test with latest version** - Bug may already be fixed

### Bug Report Template

```markdown
## Bug Description
A clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Screenshots
If applicable, add screenshots

## Environment
- OS: [e.g., macOS, Windows, Linux]
- Browser: [e.g., Chrome 120, Firefox 121]
- Node version: [e.g., 20.10.0]
- LangLens version: [e.g., 0.1.0]
```

### Feature Request Template

```markdown
## Feature Description
A clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How would you implement this?

## Alternatives Considered
What other approaches did you consider?
```

## Development Tips

### Debugging

1. **React DevTools** - Inspect component tree and state
2. **TanStack Query DevTools** - View query cache
3. **Browser Console** - Check for errors and warnings
4. **Network Tab** - Inspect API requests

### Performance

- Use React DevTools Profiler
- Check for unnecessary re-renders
- Memoize expensive computations
- Use `useMemo` and `useCallback` appropriately

### Common Issues

**Port 3000 already in use:**
```bash
pnpm dev --port 3001
```

**Type errors after dependency update:**
```bash
rm -rf node_modules .next
pnpm install
```

**ESLint/Prettier conflicts:**
```bash
pnpm format:write
pnpm lint:fix
```

## Getting Help

- **Documentation**: Start with [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- CONTRIBUTORS.md (if you wish to be listed)

Thank you for contributing to LangLens!
