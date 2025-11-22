import { Client } from "@langchain/langgraph-sdk/client";

import { env } from "@/env";

/**
 * API client configuration
 */
const API_CONFIG = {
  apiUrl: env.NEXT_PUBLIC_LANGGRAPH_API_URL,
  // Timeout for requests (milliseconds)
  timeout: 30000,
  // Number of retries for failed requests
  maxRetries: 3,
  // Retry delay (milliseconds)
  retryDelay: 1000,
} as const;

/**
 * Singleton LangGraph API client instance.
 *
 * @remarks
 * This client connects to the LangGraph server specified in the environment
 * variable NEXT_PUBLIC_LANGGRAPH_API_URL (defaults to http://localhost:2024).
 *
 * The client is used throughout the application for:
 * - Thread management (create, read, update, delete)
 * - Assistant queries
 * - Real-time message streaming via useStream hook
 *
 * @example
 * ```typescript
 * // Fetch threads
 * const threads = await apiClient.threads.search({ limit: 10 });
 *
 * // Delete a thread
 * await apiClient.threads.delete(threadId);
 * ```
 *
 * @see {@link useThreads} for React Query wrapper
 * @see {@link useAssistants} for assistants query hook
 */
export const apiClient = new Client({
  apiUrl: API_CONFIG.apiUrl,
});

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Checks if the API server is reachable
 *
 * @returns Promise that resolves to true if server is reachable, false otherwise
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(API_CONFIG.apiUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 404; // 404 is OK, means server is up
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
}

/**
 * Logs API errors with context
 */
export function logApiError(
  operation: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[API Error] ${operation} failed:`, {
    message: errorMessage,
    context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Export configuration for testing and debugging
 */
export const API_CLIENT_CONFIG = API_CONFIG;
