import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 클래스명 병합 유틸리티
 * clsx로 조건부 결합 → twMerge로 충돌 해소
 * @example cn('bg-surface', className) // className의 bg-*가 우선
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
