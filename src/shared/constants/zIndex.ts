/**
 * Z-Index scale constants for inline styles.
 * For Tailwind className usage, use semantic classes: z-sidebar, z-modal, z-toast, etc.
 * Mirrors CSS custom properties defined in src/styles/tokens.css.
 */
export const Z_INDEX = {
  base: 0,
  sidebar: 10,
  header: 20,
  dropdown: 100,
  sticky: 200,
  overlay: 500,
  modal: 1000,
  popover: 1100,
  tooltip: 1200,
  toast: 1300,
  spotlight: 1400,
  debug: 1500,
} as const;
