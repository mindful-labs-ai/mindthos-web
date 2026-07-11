import { useEffect, useRef } from 'react';

interface UseModalStepBackParams {
  /** 모바일에서 모달이 열려 있는 동안만 활성화 */
  enabled: boolean;
  /** 현재 위치에서 단계 뒤로가기가 가능한지 (footer '이전' 노출 조건과 동일) */
  canBack: boolean;
  /** 단계 뒤로가기 동작 (footer '이전' = handleBack과 동일) */
  onBack: () => void;
  /** 더 뒤로 갈 단계가 없을 때 모달 닫기 (루트 단계) */
  onClose: () => void;
}

/**
 * 모바일 하드웨어/브라우저 뒤로가기(및 엣지 스와이프)를 모달의 단계 뒤로가기에 연결한다(depth).
 *
 * 동작: 모달이 열리면 history sentinel 1개를 push해 두고, 뒤로가기로 sentinel이 pop되면
 * - canBack이면 onBack()으로 한 단계 뒤로 간 뒤 sentinel을 다시 push해 재무장하고,
 * - 아니면 onClose()로 모달을 닫는다(루트 단계).
 * X/Escape 등 직접 닫기로 enabled가 false가 되면 cleanup에서 남은 sentinel을 정리한다.
 *
 * 단일 sentinel 재무장 방식은 Modal.tsx의 fullScreen depth 처리와 동일한 패턴이다.
 */
export function useModalStepBack({
  enabled,
  canBack,
  onBack,
  onClose,
}: UseModalStepBackParams): void {
  const canBackRef = useRef(canBack);
  const onBackRef = useRef(onBack);
  const onCloseRef = useRef(onClose);
  const armedRef = useRef(false);

  useEffect(() => {
    canBackRef.current = canBack;
  }, [canBack]);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!enabled) return;

    window.history.pushState({ registerModalDepth: true }, '');
    armedRef.current = true;

    const handlePopState = () => {
      if (canBackRef.current) {
        onBackRef.current();
        // 다음 뒤로가기를 다시 잡기 위해 sentinel 재push(재무장).
        window.history.pushState({ registerModalDepth: true }, '');
        armedRef.current = true;
      } else {
        armedRef.current = false;
        onCloseRef.current();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // 직접 닫기로 언마운트되는 경우 남은 sentinel을 history에서 제거.
      if (armedRef.current) {
        armedRef.current = false;
        window.history.back();
      }
    };
  }, [enabled]);
}
