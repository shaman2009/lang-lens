---
description: "Next.js + Tailwind development standards and instructions"
applyTo: "**/*.tsx, **/*.ts, **/*.jsx, **/*.js, **/*.css"
---

# Next.js + Tailwind Development Instructions

Instructions for high-quality Next.js applications with Tailwind CSS styling and TypeScript.

## Project Context

- Latest Next.js (App Router), but only use client components
- TypeScript for type safety
- Tailwind CSS for styling

## Development Standards

### Architecture

- App Router with **client components only**, and don't forget to add "use client"
- Group routes by feature/domain
- Implement proper error boundaries
- Use React Client Components by default
- Leverage static optimization where possible

### TypeScript

- Strict mode enabled
- Clear type definitions
- Proper error handling with type guards
- Zod for runtime type validation
- Group and sort imports logically
  - Group imports into:
    - Node.js built-in and React libraries like "react", "fs", "path"
    - External libraries like "lucide", "react-query"
    - Absolute imports start with "@/" like "@/components/ui/..."
    - Relative imports like "../hooks"
    - Relative imports in the same folder like "./utils"
    - Styles and assets like "./styles.css", "./prompt.md"
  - Within each group, sort alphabetically and separate groups with a single newline

### React Components

- Functional components with hooks
- Export components as named exports
- Separate presentational and container components
- Clear and descriptive prop names
- Always define `className` prop for styling
- Inherit props from base components or React HTML Element when extending, e.g.,

```tsx
export function CustomButton({
  className,
  ...props
}: React.ComponentProps<"button">);
```

```tsx
export function AppSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>);
```

### Styling

- Tailwind CSS with consistent color palette
- No need for responsive design patterns, as **desktop only**
- Dark mode by default
- Follow container queries best practices
- Maintain semantic HTML structure

### Icons

- Use Lucide icons by default

### State Management

- React Server Components for server state
- React hooks for client state
- Proper loading and error states
- Optimistic updates where appropriate

### Data Fetching

- Use React Query for client-data fetching only
- Prefer to use `setData` from React query's `utils` to update cached data instead of fully refetching
- React Suspense for loading states
- Proper error handling and retry logic
- Cache invalidation strategies

### Security

- Input validation and sanitization
- Proper authentication checks
- CSRF protection
- Rate limiting implementation
- Secure API route handling

### Performance

- Never optimize images with next/image
- Font optimization with next/font
- Route prefetching
- Proper code splitting
- Bundle size optimization

## Implementation Process

1. Plan component hierarchy
2. Define types and interfaces
3. Implement server-side logic
4. Build client components
5. Add proper error handling
6. Implement responsive styling
7. Add loading states
8. Write tests if being requested
