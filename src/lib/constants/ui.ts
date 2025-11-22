/**
 * UI-related constants (animations, timeouts, etc.)
 * @module constants/ui
 */

/**
 * Animation and timeout durations (milliseconds)
 */
export const UI_TIMEOUTS = {
  /** Duration to show "copied" state */
  COPY_FEEDBACK: 1000,
  /** Toast notification duration */
  TOAST: 3000,
  /** Debounce delay for search inputs */
  SEARCH_DEBOUNCE: 300,
} as const;

/**
 * CSS transform values
 */
export const UI_TRANSFORMS = {
  /** Input box vertical translation for new thread view */
  INPUT_TRANSLATE_Y: "-33vh",
} as const;

/**
 * Z-index layers for consistent stacking
 */
export const Z_INDEX = {
  DROPDOWN: 50,
  MODAL: 100,
  TOOLTIP: 200,
  TOAST: 1000,
} as const;
