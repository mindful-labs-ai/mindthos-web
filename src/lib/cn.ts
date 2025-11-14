import clsx, { type ClassValue } from 'clsx';

/**
 * 클래스명 병합 유틸리티
 * @example cn('base-class', condition && 'conditional', className)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
