import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';

import type { Subject } from '@/genogram/core/models/person';
import type { Connection } from '@/genogram/core/models/relationship';
import {
  Gender,
  InfluenceStatus,
  RelationStatus,
  ToolMode,
} from '@/genogram/core/types/enums';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
import type { PersonNodeData } from '../components/nodes/PersonNode';
import { avoidCenterCollision, snapToDotCenter } from '../utils/snap';

import { useFlowSync } from './useFlowSync';
import { useGenogramEditor } from './useGenogramEditor';

export interface UseGenogramFlowOptions {
  initialData?: string;
}

export const useGenogramFlow = (options: UseGenogramFlowOptions = {}) => {
  const isDraggingRef = useRef(false);
  const [toolMode, setToolModeState] = useState<
    (typeof ToolMode)[keyof typeof ToolMode]
  >(ToolMode.Select_Tool);

  // syncFromEditor/syncSelectedSubject를 ref로 감싸서
  // useGenogramEditor의 onEvent 콜백에서 초기화 순서 문제 없이 참조
  const syncRef = useRef<{
    syncFromEditor: () => void;
    syncSelectedSubject: () => void;
    syncSelectedConnection: () => void;
  }>({
    syncFromEditor: () => {},
    syncSelectedSubject: () => {},
    syncSelectedConnection: () => {},
  });

  // Editor 생명주기
  const { getEditor } = useGenogramEditor({
    initialData: options.initialData,
    onEvent: (eventType) => {
      if (eventType === 'state-change') {
        if (!isDraggingRef.current) {
          syncRef.current.syncFromEditor();
        }
        syncRef.current.syncSelectedSubject();
        syncRef.current.syncSelectedConnection();
      }
      if (eventType === 'selection-change') {
        syncRef.current.syncSelectedSubject();
        syncRef.current.syncSelectedConnection();
      }
      if (eventType === 'tool-change') {
        const editor = getEditor();
        if (editor) setToolModeState(editor.getToolMode());
      }
    },
  });

  // Connection 생성 시 사용할 상태 (서브툴 선택에 의해 결정)
  const [pendingRelationStatus, setPendingRelationStatus] = useState<
    (typeof RelationStatus)[keyof typeof RelationStatus]
  >(RelationStatus.Connected);
  const [pendingInfluenceStatus, setPendingInfluenceStatus] = useState<
    (typeof InfluenceStatus)[keyof typeof InfluenceStatus]
  >(InfluenceStatus.Focused_On);
  const [pendingConnectionKind, setPendingConnectionKind] = useState<
    'relation' | 'influence'
  >('relation');

  // 도메인 → ReactFlow 동기화
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedSubject,
    selectedConnection,
    syncFromEditor,
    syncSelectedSubject,
    syncSelectedConnection,
  } = useFlowSync(getEditor);

  // ref를 최신 함수로 갱신
  syncRef.current.syncFromEditor = syncFromEditor;
  syncRef.current.syncSelectedSubject = syncSelectedSubject;
  syncRef.current.syncSelectedConnection = syncSelectedConnection;

  // 초기 동기화 (Editor useEffect 완료 후)
  useEffect(() => {
    syncFromEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 노드 변경 핸들러 (드래그 스냅 포함)
  const onNodesChange = useCallback(
    (changes: NodeChange<Node<PersonNodeData>>[]) => {
      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        const editor = getEditor();
        if (!editor) return next;

        changes.forEach((change) => {
          if (change.type === 'position' && change.id) {
            if (change.dragging) {
              isDraggingRef.current = true;
              if (change.position) {
                const snapped = snapToDotCenter(change.position);
                const node = next.find((n) => n.id === change.id);
                if (node) {
                  node.position = snapped;
                }
              }
            } else if (change.position) {
              isDraggingRef.current = false;
              const snapped = snapToDotCenter(change.position);
              editor.moveSubject(change.id, snapped);
            }
          }
        });

        // 선택 변경 → editor에 반영
        const hasSelectChange = changes.some((c) => c.type === 'select');
        if (hasSelectChange) {
          const selectedIds = next.filter((n) => n.selected).map((n) => n.id);

          if (selectedIds.length > 0) {
            editor.select(selectedIds, true);
          } else {
            editor.deselectAll();
          }
        }

        return next;
      });
    },
    [getEditor, setNodes]
  );

  // 엣지 변경 핸들러 (선택 변경 포함)
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<RelationshipEdgeData>>[]) => {
      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);
        const editor = getEditor();
        if (!editor) return next;

        const hasSelectChange = changes.some((c) => c.type === 'select');
        if (hasSelectChange) {
          const selectedIds = next.filter((e) => e.selected).map((e) => e.id);
          if (selectedIds.length > 0) {
            editor.select(selectedIds, true);
          } else {
            editor.deselectAll();
          }
        }

        return next;
      });
    },
    [getEditor, setEdges]
  );

  // 클릭 기반 연결 생성 (pendingConnectionKind + 각 status에 따라 분기)
  const createConnection = useCallback(
    (source: string, target: string) => {
      const editor = getEditor();
      if (!editor) return;

      if (pendingConnectionKind === 'relation') {
        editor.addRelationConnection(source, target, pendingRelationStatus);
      } else {
        editor.addInfluenceConnection(source, target, pendingInfluenceStatus);
      }
    },
    [
      getEditor,
      pendingConnectionKind,
      pendingRelationStatus,
      pendingInfluenceStatus,
    ]
  );

  // 도구 모드 변경
  const setToolMode = useCallback(
    (mode: (typeof ToolMode)[keyof typeof ToolMode]) => {
      const editor = getEditor();
      if (!editor) return;
      editor.setToolMode(mode);
      setToolModeState(mode);
    },
    [getEditor]
  );

  // Subject 추가 (생성 후 자동 선택 + Select 모드 전환)
  const addSubject = useCallback(
    (
      gender: (typeof Gender)[keyof typeof Gender],
      position: { x: number; y: number }
    ) => {
      const editor = getEditor();
      if (!editor) return null;

      const snappedPosition = snapToDotCenter(position);
      const existingCenters = Array.from(editor.getLayout().nodes.values()).map(
        (n) => n.position
      );
      const finalPosition = avoidCenterCollision(
        snappedPosition,
        position,
        existingCenters
      );
      const id = editor.addSubject(gender, finalPosition, 0);
      editor.select([id], true);
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return id;
    },
    [getEditor]
  );

  // 가족 복합 생성 (자동 선택 + Select 모드 전환)
  const addFamily = useCallback(
    (position: { x: number; y: number }) => {
      const editor = getEditor();
      if (!editor) return null;

      const snappedPosition = snapToDotCenter(position);
      const result = editor.addFamily(snappedPosition);
      editor.select([result.childId], true);
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return result;
    },
    [getEditor]
  );

  // 반려동물 추가 (자동 선택 + Select 모드 전환)
  const addAnimal = useCallback(
    (position: { x: number; y: number }) => {
      const editor = getEditor();
      if (!editor) return null;

      const snappedPosition = snapToDotCenter(position);
      const existingCenters = Array.from(editor.getLayout().nodes.values()).map(
        (n) => n.position
      );
      const finalPosition = avoidCenterCollision(
        snappedPosition,
        position,
        existingCenters
      );
      const id = editor.addAnimal(finalPosition, 0);
      editor.select([id], true);
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return id;
    },
    [getEditor]
  );

  // Subject 삭제
  const deleteSubject = useCallback(
    (subjectId: string) => {
      const editor = getEditor();
      if (!editor) return;
      editor.deleteSubject(subjectId);
    },
    [getEditor]
  );

  // Subject 업데이트
  const updateSubject = useCallback(
    (subjectId: string, updates: Partial<Subject>) => {
      const editor = getEditor();
      if (!editor) return;
      editor.updateSubject(subjectId, updates);
    },
    [getEditor]
  );

  // Connection 업데이트
  const updateConnection = useCallback(
    (connectionId: string, updates: Partial<Connection>) => {
      const editor = getEditor();
      if (!editor) return;
      editor.updateConnectionEntity(connectionId, updates);
    },
    [getEditor]
  );

  // 선택된 항목 삭제
  const deleteSelected = useCallback(() => {
    const editor = getEditor();
    if (!editor) return;
    editor.deleteSelected();
  }, [getEditor]);

  // Undo/Redo
  const undo = useCallback(() => {
    getEditor()?.undo();
  }, [getEditor]);

  const redo = useCallback(() => {
    getEditor()?.redo();
  }, [getEditor]);

  const canUndo = useMemo(() => {
    return getEditor()?.canUndo() ?? false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const canRedo = useMemo(() => {
    return getEditor()?.canRedo() ?? false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // 직렬화
  const toJSON = useCallback(() => {
    return getEditor()?.toJSON() ?? '';
  }, [getEditor]);

  const fromJSON = useCallback(
    (json: string) => {
      getEditor()?.fromJSON(json);
      syncFromEditor();
    },
    [getEditor, syncFromEditor]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    createConnection,
    addPerson: addSubject,
    addFamily,
    addAnimal,
    deletePerson: deleteSubject,
    updateSubject,
    updateConnection,
    deleteSelected,
    undo,
    redo,
    canUndo,
    canRedo,
    toJSON,
    fromJSON,
    toolMode,
    setToolMode,
    selectedSubject,
    selectedConnection,
    pendingConnectionKind,
    setPendingConnectionKind,
    pendingRelationStatus,
    setPendingRelationStatus,
    pendingInfluenceStatus,
    setPendingInfluenceStatus,
  };
};
