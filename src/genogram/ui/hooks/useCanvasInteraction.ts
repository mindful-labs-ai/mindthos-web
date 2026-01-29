import { useCallback, useMemo, useState } from 'react';

import { SelectionMode, useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';

import type {
  Gender,
  InfluenceStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';
import { ToolMode } from '@/genogram/core/types/enums';

import { snapToDotCenter } from '../utils/snap';

export interface UseCanvasInteractionOptions {
  toolMode: (typeof ToolMode)[keyof typeof ToolMode];
  addPerson: (
    gender: (typeof Gender)[keyof typeof Gender],
    position: { x: number; y: number }
  ) => string | null;
  defaultGender: (typeof Gender)[keyof typeof Gender];
  onConnectionCreate: (sourceId: string, targetId: string) => void;
  /** 캔버스 클릭 시 가족 생성 */
  onFamilyCreate?: (position: { x: number; y: number }) => void;
  /** 캔버스 클릭 시 반려동물 생성 */
  onAnimalCreate?: (position: { x: number; y: number }) => void;
  /** 현재 서브툴 모드 ('person' | 'family' | 'animal') */
  subjectCreateMode?: 'person' | 'family' | 'animal';
  /** 현재 연결 종류 ('relation' | 'influence') */
  pendingConnectionKind?: 'relation' | 'influence';
  /** 현재 관계 상태 */
  pendingRelationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  /** 현재 영향 상태 */
  pendingInfluenceStatus?: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
}

/** 연결 미리보기에 필요한 정보 */
export interface ConnectionPreview {
  /** source 노드의 flow 좌표 (중심) */
  sourcePosition: { x: number; y: number };
  /** 마우스의 현재 flow 좌표 */
  mousePosition: { x: number; y: number };
  /** 연결 종류 */
  connectionKind: 'relation' | 'influence';
  /** 관계 상태 (connectionKind === 'relation'일 때) */
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  /** 영향 상태 (connectionKind === 'influence'일 때) */
  influenceStatus?: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
}

/**
 * 캔버스 인터랙션 로직을 관리하는 훅.
 * - ToolMode별 ReactFlow 옵션, 커서 클래스
 * - 마우스 이동 시 ghost 위치, 클릭 시 노드 생성
 * - Create_Connection_Tool: 클릭 기반 연결 생성 + 미리보기 선
 */
export const useCanvasInteraction = ({
  toolMode,
  addPerson,
  defaultGender,
  onConnectionCreate,
  onFamilyCreate,
  onAnimalCreate,
  subjectCreateMode = 'person',
  pendingConnectionKind = 'relation',
  pendingRelationStatus,
  pendingInfluenceStatus,
}: UseCanvasInteractionOptions) => {
  const { screenToFlowPosition, flowToScreenPosition, getZoom, getNode } =
    useReactFlow();
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    zoom: number;
  } | null>(null);

  // 클릭 기반 연결: source 노드 ID
  const [pendingSourceId, setPendingSourceId] = useState<string | null>(null);
  // 마우스 flow 좌표 (미리보기 선 끝점)
  const [connectionPreview, setConnectionPreview] =
    useState<ConnectionPreview | null>(null);
  const isCreateMode = toolMode === ToolMode.Create_Subject_Tool;
  const isConnectionMode = toolMode === ToolMode.Create_Connection_Tool;

  // 노드 중심 좌표 가져오기 (nodeOrigin=[0.5,0.5]이므로 position이 곧 중심)
  const getNodeCenter = useCallback(
    (nodeId: string): { x: number; y: number } | null => {
      const node = getNode(nodeId);
      if (!node) return null;
      return { x: node.position.x, y: node.position.y };
    },
    [getNode]
  );

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // ghost preview for Create_Subject_Tool
      if (toolMode === ToolMode.Create_Subject_Tool) {
        const flowPos = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        const snapped = snapToDotCenter(flowPos);
        const screenPos = flowToScreenPosition(snapped);
        const rect = event.currentTarget.getBoundingClientRect();
        setGhost({
          x: screenPos.x - rect.left,
          y: screenPos.y - rect.top,
          zoom: getZoom(),
        });
        return;
      }

      // connection preview line
      if (isConnectionMode && pendingSourceId) {
        const sourcePos = getNodeCenter(pendingSourceId);
        if (!sourcePos) return;

        const mouseFlowPos = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        setConnectionPreview({
          sourcePosition: sourcePos,
          mousePosition: mouseFlowPos,
          connectionKind: pendingConnectionKind,
          relationStatus: pendingRelationStatus,
          influenceStatus: pendingInfluenceStatus,
        });
        return;
      }

      setGhost(null);
      setConnectionPreview(null);
    },
    [
      toolMode,
      isConnectionMode,
      pendingSourceId,
      pendingConnectionKind,
      pendingRelationStatus,
      pendingInfluenceStatus,
      screenToFlowPosition,
      flowToScreenPosition,
      getZoom,
      getNodeCenter,
    ]
  );

  const handleMouseLeave = useCallback(() => {
    setGhost(null);
    setConnectionPreview(null);
  }, []);

  // 캔버스(빈 영역) 클릭
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (toolMode === ToolMode.Create_Subject_Tool) {
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        switch (subjectCreateMode) {
          case 'family':
            onFamilyCreate?.(position);
            break;
          case 'animal':
            onAnimalCreate?.(position);
            break;
          case 'person':
          default:
            addPerson(defaultGender, position);
            break;
        }
        setGhost(null);
        return;
      }

      // Connection 모드에서 빈 영역 클릭 → 취소
      if (isConnectionMode && pendingSourceId) {
        setPendingSourceId(null);
        setConnectionPreview(null);
      }
    },
    [
      toolMode,
      subjectCreateMode,
      addPerson,
      defaultGender,
      screenToFlowPosition,
      isConnectionMode,
      pendingSourceId,
      onFamilyCreate,
      onAnimalCreate,
    ]
  );

  // 노드 클릭 핸들러 (Connection 모드 전용)
  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!isConnectionMode) return;

      if (!pendingSourceId) {
        // 첫 번째 클릭: source 설정
        setPendingSourceId(node.id);
      } else {
        // 두 번째 클릭: 연결 생성
        if (node.id !== pendingSourceId) {
          onConnectionCreate(pendingSourceId, node.id);
        }
        setPendingSourceId(null);
        setConnectionPreview(null);
      }
    },
    [isConnectionMode, pendingSourceId, onConnectionCreate]
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
      case ToolMode.Create_Connection_Tool:
        return {
          panOnDrag: false,
          selectionOnDrag: false,
          nodesDraggable: false,
          nodesConnectable: false,
          elementsSelectable: false,
        };
      case ToolMode.Create_Subject_Tool:
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
          elementsSelectable: true,
          edgesFocusable: true,
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

  // toolMode 변경 시 pending 상태 초기화 (React 권장: 렌더 중 state 조정)
  const [prevToolMode, setPrevToolMode] = useState(toolMode);
  if (prevToolMode !== toolMode) {
    setPrevToolMode(toolMode);
    if (pendingSourceId) {
      setPendingSourceId(null);
      setConnectionPreview(null);
    }
  }

  return {
    ghost,
    isCreateMode,
    connectionPreview,
    pendingSourceId,
    handleMouseMove,
    handleMouseLeave,
    handlePaneClick,
    handleNodeClick,
    flowInteraction,
    cursorClass,
  };
};
