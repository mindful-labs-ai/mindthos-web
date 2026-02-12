import { useCallback, useEffect } from 'react';

import { useKeyPress } from '@xyflow/react';

/**
 * ReactFlow 기본 단축키 목록
 *
 * | 단축키 | Prop | 기본값 | 기능 |
 * |--------|------|--------|------|
 * | Backspace/Delete | deleteKeyCode | 'Backspace' | 선택된 노드/엣지 삭제 |
 * | Shift | selectionKeyCode | 'Shift' | 드래그 영역 선택 활성화 |
 * | Cmd/Ctrl | multiSelectionKeyCode | 'Meta' (Mac) / 'Control' (Win) | 클릭으로 다중 선택 |
 *
 * ReactFlow에서 기본 단축키를 비활성화하려면:
 * - deleteKeyCode={[]} : 삭제 키 비활성화
 * - selectionKeyCode={null} : 영역 선택 키 비활성화
 * - multiSelectionKeyCode={null} : 다중 선택 키 비활성화
 */

export interface UseGenogramKeyboardOptions {
  /** 선택된 항목 삭제 핸들러 */
  deleteSelected: () => void;
  /** 실행 취소 핸들러 */
  undo?: () => void;
  /** 다시 실행 핸들러 */
  redo?: () => void;
  /** 키보드 이벤트 활성화 여부 (패널 입력 중일 때 비활성화) */
  enabled?: boolean;
}

/**
 * Genogram 캔버스 키보드 단축키 훅
 *
 * ReactFlow의 기본 삭제 동작을 비활성화하고 커스텀 명령을 실행합니다.
 * 반드시 ReactFlow 컴포넌트에 deleteKeyCode={[]}를 함께 전달해야 합니다.
 *
 * @example
 * ```tsx
 * // useGenogramFlow에서
 * const { deleteSelected, undo, redo } = useGenogramFlow();
 *
 * // GenogramPage에서
 * useGenogramKeyboard({
 *   deleteSelected,
 *   undo,
 *   redo,
 *   enabled: !isInputFocused,
 * });
 *
 * <ReactFlow
 *   deleteKeyCode={[]}  // 기본 삭제 비활성화
 *   ...
 * />
 * ```
 */
export const useGenogramKeyboard = ({
  deleteSelected,
  undo,
  redo,
  enabled = true,
}: UseGenogramKeyboardOptions) => {
  // ReactFlow의 useKeyPress 훅으로 키 상태 감지
  const backspacePressed = useKeyPress('Backspace');
  const deletePressed = useKeyPress('Delete');

  // Backspace / Delete 키 처리
  useEffect(() => {
    if (!enabled) return;
    if (backspacePressed || deletePressed) {
      deleteSelected();
    }
  }, [backspacePressed, deletePressed, deleteSelected, enabled]);

  // Cmd/Ctrl+Z (Undo) / Cmd/Ctrl+Shift+Z (Redo) 처리
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // 입력 필드에서는 무시
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + Z: Undo
      if (cmdOrCtrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo?.();
        return;
      }

      // Cmd/Ctrl + Shift + Z: Redo (Mac)
      // Cmd/Ctrl + Y: Redo (Windows)
      if (
        (cmdOrCtrl && event.shiftKey && event.key === 'z') ||
        (cmdOrCtrl && event.key === 'y')
      ) {
        event.preventDefault();
        redo?.();
        return;
      }

      // Escape: 현재 작업 취소 (추후 확장 가능)
      if (event.key === 'Escape') {
        // 연결 모드 등에서 취소 처리 가능
        // 현재는 빈 처리
      }
    },
    [enabled, undo, redo]
  );

  // 전역 키보드 이벤트 리스너
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    // 추후 단축키 상태 노출이 필요하면 여기서 반환
  };
};

/**
 * ReactFlow에 전달할 키보드 관련 props
 *
 * 이 객체를 ReactFlow 컴포넌트에 스프레드하여 기본 단축키를 비활성화합니다.
 *
 * @example
 * ```tsx
 * <ReactFlow {...KEYBOARD_DISABLED_PROPS} ... />
 * ```
 */
export const KEYBOARD_DISABLED_PROPS = {
  /** 기본 삭제 키 비활성화 - 커스텀 deleteSelected 사용 */
  deleteKeyCode: [] as string[],
  // selectionKeyCode와 multiSelectionKeyCode는 기본값 유지
  // (Shift 드래그 선택, Cmd 다중 선택)
} as const;
