import { useEffect, useRef, useState } from 'react';

/** 저장 완료 표시 지속 시간 (ms) */
const SAVED_DISPLAY_DURATION = 2000;

/**
 * 저장 완료 시 일정 시간 동안 표시할지 여부를 반환하는 훅
 * @param lastSavedAt 마지막 저장 시간
 * @returns showSaved - 저장 완료 표시 여부
 */
export function useSavedIndicator(lastSavedAt: Date | null): boolean {
  const [showSaved, setShowSaved] = useState(false);
  const prevLastSavedAtRef = useRef<Date | null>(null);

  useEffect(() => {
    // 최초 마운트 시에는 표시하지 않음
    if (!lastSavedAt) return;

    // 이전과 동일한 값이면 무시
    if (prevLastSavedAtRef.current?.getTime() === lastSavedAt.getTime()) return;

    prevLastSavedAtRef.current = lastSavedAt;
    setShowSaved(true);

    const timer = setTimeout(() => setShowSaved(false), SAVED_DISPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [lastSavedAt]);

  return showSaved;
}
