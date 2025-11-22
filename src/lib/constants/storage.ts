/**
 * LocalStorage keys used throughout the application
 * @module constants/storage
 */

/**
 * Storage keys for persistent application state
 */
export const STORAGE_KEYS = {
  DEFAULT_ASSISTANT_ID: "lang-lens/default_assistant_id",
} as const;

/**
 * Safe localStorage wrapper that handles errors gracefully
 */
export const storage = {
  /**
   * Safely get an item from localStorage
   * @param key - The storage key
   * @returns The stored value or null if unavailable
   */
  getItem(key: string): string | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error);
      return null;
    }
  },

  /**
   * Safely set an item in localStorage
   * @param key - The storage key
   * @param value - The value to store
   * @returns true if successful, false otherwise
   */
  setItem(key: string, value: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`Failed to write to localStorage (${key}):`, error);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   * @param key - The storage key
   * @returns true if successful, false otherwise
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return false;
      }
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
      return false;
    }
  },
};
