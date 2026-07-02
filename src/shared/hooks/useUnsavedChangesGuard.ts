import { useCallback, useEffect, useRef, useState } from 'react';

import { useBlocker, type BlockerFunction } from 'react-router-dom';

export interface UnsavedChangesGuard {
  /** 앱 내 이동(버튼/링크)이 차단됨 — 내부 확인 모달을 띄워야 하는 상태 */
  confirmOpen: boolean;
  /** 모달 '확인' — 차단된 이동을 진행(작성 내용 버림) */
  confirm: () => void;
  /** 모달 '취소'/닫기 — 이동을 취소하고 계속 편집 */
  cancel: () => void;
}

/**
 * 미저장 변경 이탈 가드 — 작성 중 내용이 유실될 수 있는 이탈에 경고를 띄운다.
 * (가계도 useGenogramSteps의 beforeunload + useBlocker 패턴 기반)
 *
 * - 앱 내 이동(PUSH/REPLACE — 취소/뒤로가기 버튼, 메뉴 클릭): 차단 후 confirmOpen을 올려
 *   호출부가 내부 모달 UI(축어록 편집 플로우 참조)로 확인받는다.
 * - 브라우저 뒤로가기/앞으로가기(POP): window.confirm(message)으로 즉시 확인.
 * - 새로고침/탭 닫기: beforeunload 네이티브 경고(커스텀 UI 불가).
 *
 * when은 매 렌더의 최신 상태를 읽는 함수(ref 경유)라, 저장 직후 같은 틱의
 * 프로그래매틱 내비게이션도 호출부에서 bypass 플래그로 정확히 통과시킬 수 있다.
 */
export function useUnsavedChangesGuard(
  when: () => boolean,
  message: string
): UnsavedChangesGuard {
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

  // 차단된 내비게이션의 종류 — POP(브라우저 뒤로가기)만 confirm, 그 외(앱 내 이동)는 모달.
  // shouldBlock 콜백은 렌더 밖(히스토리 이벤트)에서 호출되므로 여기서 setState해도 안전하다.
  const [blockedAction, setBlockedAction] = useState<string>('PUSH');
  const shouldBlock = useCallback<BlockerFunction>(
    ({ historyAction }) => {
      const block = whenRef.current();
      if (block) setBlockedAction(historyAction);
      return block;
    },
    [setBlockedAction]
  );
  const blocker = useBlocker(shouldBlock);

  // 앱 내 이동 차단 시에만 모달 — blocker 상태에서 파생(별도 state 동기화 불필요).
  const confirmOpen = blocker.state === 'blocked' && blockedAction !== 'POP';

  // 브라우저 뒤로가기(POP) 차단 — 기존 방식(confirm) 유지.
  useEffect(() => {
    if (blocker.state !== 'blocked' || blockedAction !== 'POP') return;
    if (window.confirm(message)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker, blockedAction, message]);

  const confirm = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed();
  }, [blocker]);

  const cancel = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  return { confirmOpen, confirm, cancel };
}
