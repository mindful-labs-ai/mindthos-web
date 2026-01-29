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

  const isCreateMode = toolMode === ToolMode.Create_Subject_Tool;

  // CreateNode 모드: 마우스 이동 시 ghost 위치 업데이트
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (toolMode !== ToolMode.Create_Subject_Tool) {
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
      if (toolMode !== ToolMode.Create_Subject_Tool) return;

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
      case ToolMode.Pan_Tool:
        return {
          panOnDrag: true,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.Multi_Select_Tool:
        return {
          panOnDrag: false,
          selectionOnDrag: true,
          selectionMode: SelectionMode.Full,
          nodesDraggable: false,
          nodesConnectable: false,
        };
      case ToolMode.Create_Subject_Tool:
      case ToolMode.Create_Connection_Tool:
      case ToolMode.Create_Annotation_Tool:
        return {
          panOnDrag: false,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.Select_Tool:
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
      case ToolMode.Pan_Tool:
        return 'cursor-grab active:cursor-grabbing';
      case ToolMode.Multi_Select_Tool:
        return 'cursor-crosshair';
      case ToolMode.Create_Subject_Tool:
        return 'cursor-copy';
      case ToolMode.Create_Connection_Tool:
        return 'cursor-crosshair';
      case ToolMode.Create_Annotation_Tool:
        return 'cursor-text';
      case ToolMode.Select_Tool:
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
