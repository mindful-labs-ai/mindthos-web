import { useCallback, useEffect, useRef } from 'react';

import { useBlocker } from 'react-router-dom';

/**
 * 미저장 변경 이탈 가드 — 작성 중 내용이 유실될 수 있는 이탈에 확인 경고를 띄운다.
 * (가계도 useGenogramSteps의 beforeunload + useBlocker 패턴을 공용화)
 *
 * - 새로고침/탭 닫기: beforeunload 네이티브 경고
 * - 라우터 이동/뒤로가기: useBlocker + window.confirm(message)
 *
 * when은 매 렌더의 최신 상태를 읽는 함수(ref 경유)라, 저장 직후 같은 틱의
 * 프로그래매틱 내비게이션도 호출부에서 bypass 플래그로 정확히 통과시킬 수 있다.
 */
export function useUnsavedChangesGuard(
  when: () => boolean,
  message: string
): void {
  const whenRef = useRef(when);
  // 매 렌더 후 최신 when으로 갱신 — 내비게이션/이탈 이벤트는 커밋 이후에만 발생하므로 안전.
  useEffect(() => {
    whenRef.current = when;
  });

  // 새로고침/탭 닫기 — 브라우저 네이티브 확인 다이얼로그
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!whenRef.current()) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // 라우터 이동/뒤로가기 — 확인 후 진행/취소
  const blocker = useBlocker(useCallback(() => whenRef.current(), []));

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm(message)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, message]);
}
