/**
 * Utility for creating type-safe React contexts with required providers
 * @module utils/create-context
 */

import { createContext, useContext } from "react";

/**
 * Creates a type-safe React context that must be used within a provider.
 *
 * This utility eliminates the boilerplate of checking if context is null
 * and throwing errors. It returns both a Context and a custom hook that
 * automatically handles the null check.
 *
 * @template T - The type of the context value
 * @param contextName - Name of the context (used in error messages)
 * @returns A tuple of [Context, useRequiredContext hook]
 *
 * @example
 * ```typescript
 * // Create context
 * const [ThemeContext, useTheme] = createRequiredContext<ThemeContextType>("Theme");
 *
 * // Provider component
 * export function ThemeProvider({ children }: { children: React.ReactNode }) {
 *   const value = { theme: "dark", setTheme: () => {} };
 *   return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
 * }
 *
 * // Consumer component
 * function MyComponent() {
 *   const { theme } = useTheme(); // Automatically throws if outside provider
 *   return <div>Current theme: {theme}</div>;
 * }
 * ```
 */
export function createRequiredContext<T>(
  contextName: string,
): [React.Context<T | null>, () => T] {
  const Context = createContext<T | null>(null);

  // Set display name for better debugging
  Context.displayName = `${contextName}Context`;

  const useRequiredContext = (): T => {
    const context = useContext(Context);
    if (context === null) {
      throw new Error(
        `use${contextName} must be used within a ${contextName}Provider`,
      );
    }
    return context;
  };

  return [Context, useRequiredContext];
}
