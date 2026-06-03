import { useEffect, useState } from 'react';

const DEFAULT_INITIAL_HOLD_MS = 500;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

/**
 * 로딩바가 마운트되자마자 중간 퍼센트에서 시작하지 않도록,
 * 첫 0.5초 동안 0%를 보여준 뒤 현재 진행률로 전환한다.
 */
export function useDelayedProgressStart(
  targetPercent: number,
  delayMs = DEFAULT_INITIAL_HOLD_MS
): number {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReleased(true), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return released ? clampPercent(targetPercent) : 0;
}
