/**
 * Number and currency formatting utilities
 * @module utils/formatters
 */

/**
 * Formatter for USD currency values
 * Configured to use US locale with currency symbol
 */
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formatter for token counts with compact notation
 * Large numbers are abbreviated (e.g., 1.2K, 3.4M)
 */
const tokenCountFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
});

/**
 * Formatter for regular numbers with thousands separators
 */
const numberFormatter = new Intl.NumberFormat("en-US");

/**
 * Formats a number as USD currency
 *
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 *
 * @example
 * ```typescript
 * formatCurrency(1234.56)  // "$1,234.56"
 * formatCurrency(0.99)     // "$0.99"
 * ```
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Formats a token count with compact notation
 *
 * @param count - The token count to format
 * @returns Formatted count string (e.g., "1.2K", "3.4M")
 *
 * @example
 * ```typescript
 * formatTokenCount(1234)    // "1.2K"
 * formatTokenCount(1500000) // "1.5M"
 * formatTokenCount(42)      // "42"
 * ```
 */
export function formatTokenCount(count: number): string {
  return tokenCountFormatter.format(count);
}

/**
 * Formats a number with thousands separators
 *
 * @param value - The numeric value to format
 * @returns Formatted number string (e.g., "1,234")
 *
 * @example
 * ```typescript
 * formatNumber(1234)    // "1,234"
 * formatNumber(1000000) // "1,000,000"
 * ```
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
