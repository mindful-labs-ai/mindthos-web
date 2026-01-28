import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection as FlowConnection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';

import type { Subject } from '@/genogram/core/models/person';
import {
  Gender,
  PartnerStatus,
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
  >(ToolMode.Select);

  // syncFromEditor/syncSelectedSubject를 ref로 감싸서
  // useGenogramEditor의 onEvent 콜백에서 초기화 순서 문제 없이 참조
  const syncRef = useRef<{
    syncFromEditor: () => void;
    syncSelectedSubject: () => void;
  }>({ syncFromEditor: () => {}, syncSelectedSubject: () => {} });

  // Editor 생명주기
  const { getEditor } = useGenogramEditor({
    initialData: options.initialData,
    onEvent: (eventType) => {
      if (eventType === 'state-change') {
        if (!isDraggingRef.current) {
          syncRef.current.syncFromEditor();
        }
        syncRef.current.syncSelectedSubject();
      }
      if (eventType === 'selection-change') {
        syncRef.current.syncSelectedSubject();
      }
      if (eventType === 'tool-change') {
        const editor = getEditor();
        if (editor) setToolModeState(editor.getToolMode());
      }
    },
  });

  // 도메인 → ReactFlow 동기화
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedSubject,
    syncFromEditor,
    syncSelectedSubject,
  } = useFlowSync(getEditor);

  // ref를 최신 함수로 갱신
  syncRef.current.syncFromEditor = syncFromEditor;
  syncRef.current.syncSelectedSubject = syncSelectedSubject;

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
          const selectedIds = next
            .filter((n) => n.selected)
            .map((n) => n.id);

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

  // 엣지 변경 핸들러
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<RelationshipEdgeData>>[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // 연결 핸들러
  const onConnect = useCallback(
    (connection: FlowConnection) => {
      const editor = getEditor();
      if (!editor || !connection.source || !connection.target) return;

      editor.addPartnerConnection(
        connection.source,
        connection.target,
        PartnerStatus.Married
      );

      setEdges((eds) => addEdge(connection, eds));
    },
    [getEditor, setEdges]
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
      const existingCenters = Array.from(
        editor.getLayout().nodes.values()
      ).map((n) => n.position);
      const finalPosition = avoidCenterCollision(
        snappedPosition,
        position,
        existingCenters
      );
      const id = editor.addSubject(gender, finalPosition, 0);
      editor.select([id], true);
      editor.setToolMode(ToolMode.Select);
      setToolModeState(ToolMode.Select);
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
    onConnect,
    addPerson: addSubject,
    deletePerson: deleteSubject,
    updateSubject,
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
  };
};
