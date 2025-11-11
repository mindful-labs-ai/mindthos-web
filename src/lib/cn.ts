import clsx, { type ClassValue } from 'clsx';

/**
 * Utility function to merge class names
 * Combines clsx for conditional classes with proper merging
 *
 * @param inputs - Class names to merge
 * @returns Merged class name string
 *
 * @example
 * ```tsx
 * cn('base-class', condition && 'conditional-class', className)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
