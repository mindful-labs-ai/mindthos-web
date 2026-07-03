import { useEffect, type RefObject } from 'react';

/**
 * 바깥 클릭(mousedown) 감지 훅 — `enabled`일 때만 리스너를 등록하고,
 * `ref` 밖을 클릭하면 `handler`를 호출한다. (팝오버/드롭다운 닫기 공용)
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled = true
): void {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, handler, enabled]);
}
