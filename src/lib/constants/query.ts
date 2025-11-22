/**
 * React Query and API configuration constants
 * @module constants/query
 */

/**
 * Default limits for list queries
 */
export const QUERY_LIMITS = {
  /** Default number of threads to fetch */
  THREADS_DEFAULT: 50,
  /** Maximum number of threads to fetch */
  THREADS_MAX: 1000,
  /** Default number of assistants to fetch */
  ASSISTANTS_DEFAULT: 50,
} as const;

/**
 * Cache stale time configurations (milliseconds)
 */
export const QUERY_STALE_TIME = {
  /** Default stale time for most queries */
  DEFAULT: 5000,
  /** Longer stale time for less frequently changing data */
  LONG: 30000,
  /** Short stale time for frequently changing data */
  SHORT: 1000,
} as const;

/**
 * Standard query keys for consistent caching
 */
export const QUERY_KEYS = {
  /** Threads search query key factory */
  threads: (params: { limit: number; sortBy: string; sortOrder: string }) =>
    ["threads", "search", params] as const,

  /** Assistants search query key factory */
  assistants: (params: { limit: number; sortBy: string; sortOrder: string }) =>
    ["assistants", "search", params] as const,
} as const;

/**
 * Default query parameters for threads
 */
export const DEFAULT_THREADS_PARAMS = {
  limit: QUERY_LIMITS.THREADS_DEFAULT,
  sortBy: "updated_at",
  sortOrder: "desc",
} as const;

/**
 * Default query parameters for assistants
 */
export const DEFAULT_ASSISTANTS_PARAMS = {
  limit: QUERY_LIMITS.ASSISTANTS_DEFAULT,
  sortBy: "name",
  sortOrder: "asc",
} as const;
