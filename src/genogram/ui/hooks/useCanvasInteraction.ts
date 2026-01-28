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

  const isCreateMode = toolMode === ToolMode.CreateNode;

  // CreateNode 모드: 마우스 이동 시 ghost 위치 업데이트
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (toolMode !== ToolMode.CreateNode) {
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
      if (toolMode !== ToolMode.CreateNode) return;

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
      case ToolMode.Pan:
        return {
          panOnDrag: true,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.MultiSelect:
        return {
          panOnDrag: false,
          selectionOnDrag: true,
          selectionMode: SelectionMode.Full,
          nodesDraggable: false,
          nodesConnectable: false,
        };
      case ToolMode.CreateNode:
      case ToolMode.Connect:
      case ToolMode.CreateText:
        return {
          panOnDrag: false,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.Select:
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
      case ToolMode.Pan:
        return 'cursor-grab active:cursor-grabbing';
      case ToolMode.MultiSelect:
        return 'cursor-crosshair';
      case ToolMode.CreateNode:
        return 'cursor-copy';
      case ToolMode.Connect:
        return 'cursor-crosshair';
      case ToolMode.CreateText:
        return 'cursor-text';
      case ToolMode.Select:
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
