import { useCallback, useMemo, useState } from 'react';

import { SelectionMode, useReactFlow } from '@xyflow/react';

import type { Gender } from '@/genogram/core/types/enums';
import { ToolMode } from '@/genogram/core/types/enums';

export interface UseCanvasInteractionOptions {
  toolMode: (typeof ToolMode)[keyof typeof ToolMode];
  addPerson: (
    gender: (typeof Gender)[keyof typeof Gender],
    position: { x: number; y: number }
  ) => string | null;
  defaultGender: (typeof Gender)[keyof typeof Gender];
}

/**
 * 캔버스 인터랙션 로직을 관리하는 훅.
 * - ToolMode별 ReactFlow 옵션, 커서 클래스
 * - 마우스 이동 시 ghost 위치, 클릭 시 노드 생성
 */
export const useCanvasInteraction = ({
  toolMode,
  addPerson,
  defaultGender,
}: UseCanvasInteractionOptions) => {
  const { screenToFlowPosition } = useReactFlow();
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const isCreateMode = toolMode === ToolMode.인물추가도구;

  // CreateNode 모드: 마우스 이동 시 ghost 위치 업데이트
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (toolMode !== ToolMode.인물추가도구) {
        setGhostPos(null);
        return;
      }
      const rect = event.currentTarget.getBoundingClientRect();
      setGhostPos({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    },
    [toolMode]
  );

  const handleMouseLeave = useCallback(() => setGhostPos(null), []);

  // 캔버스 클릭 시 노드 추가
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (toolMode !== ToolMode.인물추가도구) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addPerson(defaultGender, position);
      setGhostPos(null);
    },
    [toolMode, addPerson, defaultGender, screenToFlowPosition]
  );

  // ToolMode별 ReactFlow 동작 설정
  const flowInteraction = useMemo(() => {
    switch (toolMode) {
      case ToolMode.이동도구:
        return {
          panOnDrag: true,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.다중선택도구:
        return {
          panOnDrag: false,
          selectionOnDrag: true,
          selectionMode: SelectionMode.Full,
          nodesDraggable: false,
          nodesConnectable: false,
        };
      case ToolMode.인물추가도구:
      case ToolMode.관계추가도구:
      case ToolMode.주석달기도구:
        return {
          panOnDrag: false,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.단일선택도구:
      default:
        return {
          panOnDrag: false,
          selectionOnDrag: false,
          nodesDraggable: true,
          nodesConnectable: false,
        };
    }
  }, [toolMode]);

  // ToolMode별 커서 클래스
  const cursorClass = useMemo(() => {
    switch (toolMode) {
      case ToolMode.이동도구:
        return 'cursor-grab active:cursor-grabbing';
      case ToolMode.다중선택도구:
        return 'cursor-crosshair';
      case ToolMode.인물추가도구:
        return 'cursor-copy';
      case ToolMode.관계추가도구:
        return 'cursor-crosshair';
      case ToolMode.주석달기도구:
        return 'cursor-text';
      case ToolMode.단일선택도구:
      default:
        return 'cursor-default';
    }
  }, [toolMode]);

  return {
    ghostPos,
    isCreateMode,
    handleMouseMove,
    handleMouseLeave,
    handlePaneClick,
    flowInteraction,
    cursorClass,
  };
};
