import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';

import type { Visibility } from '@/genogram/core/models/genogram';
import type { Subject } from '@/genogram/core/models/person';
import type { Connection } from '@/genogram/core/models/relationship';
import type { AnnotationUpdate } from '@/genogram/core/models/text-annotation';
import {
  Gender,
  InfluenceStatus,
  type ParentChildStatus,
  RelationStatus,
  ToolMode,
} from '@/genogram/core/types/enums';

import type { RelationshipEdgeData } from '../components/edges/RelationshipEdge';
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
  const [visibility, setVisibility] = useState<Visibility>({
    name: true,
    age: true,
    birthDate: true,
    deathDate: true,
    extraInfo: true,
    illness: true,
    relationLine: true,
    groupLine: true,
    grid: true,
    memo: true,
  });

  // syncFromEditor/syncSelectedSubject를 ref로 감싸서
  // useGenogramEditor의 onEvent 콜백에서 초기화 순서 문제 없이 참조
  const syncRef = useRef<{
    syncFromEditor: () => void;
    syncSelectedSubject: () => void;
    syncSelectedConnection: () => void;
    syncSelectedAnnotation: () => void;
    syncSelectedItems: () => void;
  }>({
    syncFromEditor: () => {},
    syncSelectedSubject: () => {},
    syncSelectedConnection: () => {},
    syncSelectedAnnotation: () => {},
    syncSelectedItems: () => {},
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
        syncRef.current.syncSelectedAnnotation();
        syncRef.current.syncSelectedItems();
      }
      if (eventType === 'selection-change') {
        syncRef.current.syncSelectedSubject();
        syncRef.current.syncSelectedConnection();
        syncRef.current.syncSelectedAnnotation();
        syncRef.current.syncSelectedItems();
      }
      if (eventType === 'view-change') {
        const editor = getEditor();
        if (editor) setVisibility(editor.getViewSettings());
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
    'relation' | 'influence' | 'partner' | 'child'
  >('relation');

  // 도메인 → ReactFlow 동기화
  const {
    nodes,
    setNodes,
    edges,
    setEdges,
    selectedSubject,
    selectedConnection,
    selectedAnnotation,
    selectedItems,
    syncFromEditor,
    syncSelectedSubject,
    syncSelectedConnection,
    syncSelectedAnnotation,
    syncSelectedItems,
  } = useFlowSync(getEditor, visibility);

  // ref를 최신 함수로 갱신
  syncRef.current.syncFromEditor = syncFromEditor;
  syncRef.current.syncSelectedSubject = syncSelectedSubject;
  syncRef.current.syncSelectedConnection = syncSelectedConnection;
  syncRef.current.syncSelectedAnnotation = syncSelectedAnnotation;
  syncRef.current.syncSelectedItems = syncSelectedItems;

  // 선택 동기화 시 양쪽(node/edge) 상태를 합치기 위한 ref
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge<RelationshipEdgeData>[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // 초기 동기화 (Editor useEffect 완료 후)
  useEffect(() => {
    syncFromEditor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // visibility 변경 시 노드/엣지 재동기화
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncRef.current.syncFromEditor();
  }, [visibility]);

  /** nodes + edges의 현재 선택 상태를 합쳐서 editor에 반영 */
  const syncSelectionToEditor = useCallback(
    (nextNodes: Node[], nextEdges: Edge<RelationshipEdgeData>[]) => {
      const editor = getEditor();
      if (!editor) return;

      const allIds: string[] = [];

      for (const n of nextNodes) {
        if (!n.selected) continue;
        if (n.id.startsWith('group-boundary-')) {
          allIds.push(n.id.replace('group-boundary-', ''));
        } else if (n.id.startsWith('annotation-')) {
          allIds.push(n.id.replace('annotation-', ''));
        } else {
          allIds.push(n.id);
        }
      }
      for (const e of nextEdges) {
        if (e.selected) allIds.push(e.id);
      }

      if (allIds.length > 0) {
        editor.select(allIds, true);
      } else {
        editor.deselectAll();
      }
    },
    [getEditor]
  );

  // 노드 변경 핸들러 (드래그 스냅 포함)
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      // Multi_Select_Tool 모드: 클릭 선택을 additive + toggle로 변환
      if (toolMode === ToolMode.Multi_Select_Tool) {
        const hasSelect = changes.some((c) => c.type === 'select');
        if (hasSelect) {
          const filtered: NodeChange<Node>[] = [];
          for (const c of changes) {
            if (c.type !== 'select') {
              filtered.push(c);
              continue;
            }
            if (c.selected) {
              // 이미 선택된 노드 클릭 → 선택 해제 (toggle)
              const node = nodesRef.current.find((n) => n.id === c.id);
              if (node?.selected) {
                filtered.push({ ...c, selected: false });
              } else {
                filtered.push(c);
              }
            }
            // selected: false인 변경은 무시 (다른 노드의 선택 유지)
          }
          changes = filtered;
        }
      }

      // 드래그 중인 변경이 있으면 선택 동기화보다 먼저 isDraggingRef를 설정
      // (syncFromEditor가 드래그 중에 실행되어 위치가 튀는 것을 방지)
      const hasDragging = changes.some(
        (c) => c.type === 'position' && 'dragging' in c && c.dragging
      );
      if (hasDragging) {
        isDraggingRef.current = true;
      }

      setNodes((nds) => {
        const next = applyNodeChanges(changes, nds);
        const editor = getEditor();
        if (!editor) return next;

        // 드래그 완료된 이동을 모아서 한 번에 커맨드 실행 (undo 단위 통합)
        const completedMoves: {
          subjectId: string;
          position: { x: number; y: number };
        }[] = [];
        const completedAnnotationMoves: {
          annotationId: string;
          position: { x: number; y: number };
        }[] = [];

        changes.forEach((change) => {
          if (change.type === 'position' && change.id) {
            const isAnnotation = change.id.startsWith('annotation-');
            if (change.dragging) {
              if (change.position && !isAnnotation) {
                const snapped = snapToDotCenter(change.position);
                const node = next.find((n) => n.id === change.id);
                if (node) {
                  node.position = snapped;
                }
              }
            } else if (change.position) {
              isDraggingRef.current = false;
              if (isAnnotation) {
                completedAnnotationMoves.push({
                  annotationId: change.id.replace('annotation-', ''),
                  position: change.position,
                });
              } else {
                completedMoves.push({
                  subjectId: change.id,
                  position: snapToDotCenter(change.position),
                });
              }
            }
          }
        });

        if (completedMoves.length === 1) {
          editor.moveSubject(
            completedMoves[0].subjectId,
            completedMoves[0].position
          );
        } else if (completedMoves.length > 1) {
          editor.moveMultipleSubjects(completedMoves);
        }

        for (const am of completedAnnotationMoves) {
          editor.moveAnnotation(am.annotationId, am.position);
        }

        // 선택 변경 → editor에 반영 (현재 edge 선택 상태도 함께 전달)
        const hasSelectChange = changes.some((c) => c.type === 'select');
        if (hasSelectChange) {
          syncSelectionToEditor(next, edgesRef.current);
        }

        return next;
      });
    },
    [getEditor, setNodes, syncSelectionToEditor, toolMode]
  );

  // 엣지 변경 핸들러 (선택 변경 포함)
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<RelationshipEdgeData>>[]) => {
      // Multi_Select_Tool 모드: 클릭 선택을 additive + toggle로 변환
      if (toolMode === ToolMode.Multi_Select_Tool) {
        const hasSelect = changes.some((c) => c.type === 'select');
        if (hasSelect) {
          const filtered: EdgeChange<Edge<RelationshipEdgeData>>[] = [];
          for (const c of changes) {
            if (c.type !== 'select') {
              filtered.push(c);
              continue;
            }
            if (c.selected) {
              const edge = edgesRef.current.find((e) => e.id === c.id);
              if (edge?.selected) {
                filtered.push({ ...c, selected: false });
              } else {
                filtered.push(c);
              }
            }
          }
          changes = filtered;
        }
      }

      setEdges((eds) => {
        const next = applyEdgeChanges(changes, eds);

        // 선택 변경 → editor에 반영 (현재 node 선택 상태도 함께 전달)
        const hasSelectChange = changes.some((c) => c.type === 'select');
        if (hasSelectChange) {
          syncSelectionToEditor(nodesRef.current, next);
        }

        return next;
      });
    },
    [setEdges, syncSelectionToEditor, toolMode]
  );

  // 클릭 기반 연결 생성 (pendingConnectionKind + 각 status에 따라 분기)
  const createConnection = useCallback(
    (source: string, target: string) => {
      const editor = getEditor();
      if (!editor) return;

      if (pendingConnectionKind === 'partner') {
        editor.addPartnerConnection(source, target);
        editor.setToolMode(ToolMode.Select_Tool);
        setToolModeState(ToolMode.Select_Tool);
      } else if (pendingConnectionKind === 'relation') {
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

  // 부모 쌍 복합 생성 (자동 선택)
  const addParentPair = useCallback(
    (childId: string) => {
      const editor = getEditor();
      if (!editor) return null;

      const result = editor.addParentPair(childId);
      editor.select([result.fatherId, result.motherId], true);
      return result;
    },
    [getEditor]
  );

  // 파트너 Subject 생성 + 파트너선 연결 (성별 자동 선택)
  const addPartnerAtPosition = useCallback(
    (sourceId: string, position: { x: number; y: number }) => {
      const editor = getEditor();
      if (!editor) return null;

      const result = editor.addPartnerAtPosition(sourceId, position);
      editor.select([result.partnerId], true);
      return result;
    },
    [getEditor]
  );

  // Subject 타입 변환 (Person↔Animal 또는 성별 변경)
  const convertSubjectType = useCallback(
    (subjectId: string, targetType: string) => {
      const editor = getEditor();
      if (!editor) return;
      editor.convertSubjectType(subjectId, targetType);
    },
    [getEditor]
  );

  // 태아 타입 판별
  const isFetusSubject = useCallback(
    (subjectId: string): boolean => {
      const editor = getEditor();
      if (!editor) return false;
      return editor.isFetusSubject(subjectId);
    },
    [getEditor]
  );

  // parentRef(파트너선 ID 또는 Subject ID)에 자녀 생성 + 연결 (자동 선택 + Select 모드 전환)
  const addChildToParentRef = useCallback(
    (parentRef: string, childStatus: ParentChildStatus) => {
      const editor = getEditor();
      if (!editor) return null;

      const result = editor.addChildToParentRef(parentRef, childStatus);
      editor.select(result.childIds, true);
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return result;
    },
    [getEditor]
  );

  // 기존 Subject를 parentRef에 자녀로 연결
  const addChildConnectionToParentRef = useCallback(
    (parentRef: string, childId: string, childStatus: ParentChildStatus) => {
      const editor = getEditor();
      if (!editor) return null;

      const id = editor.addChildConnectionToParentRef(
        parentRef,
        childId,
        childStatus
      );
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return id;
    },
    [getEditor]
  );

  // 그룹 연결 생성 (멤버 ID + 고정 좌표 기반)
  const addGroupConnection = useCallback(
    (
      memberIds: string[],
      memberPositions: { x: number; y: number; sizePx: number }[]
    ) => {
      const editor = getEditor();
      if (!editor || memberPositions.length < 2) return null;
      return editor.addGroupConnection(memberIds, memberPositions);
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

  // 표시 설정 토글
  const toggleVisibility = useCallback(
    (key: keyof Visibility) => {
      const editor = getEditor();
      if (!editor) return;
      editor.updateViewSettings({ [key]: !visibility[key] });
    },
    [getEditor, visibility]
  );

  // Annotation 추가 (생성 후 자동 선택 + Select 모드 전환)
  const addAnnotation = useCallback(
    (position: { x: number; y: number }) => {
      const editor = getEditor();
      if (!editor) return null;

      const id = editor.addAnnotation('', position);
      editor.select([id], true);
      editor.setToolMode(ToolMode.Select_Tool);
      setToolModeState(ToolMode.Select_Tool);
      return id;
    },
    [getEditor]
  );

  // Annotation 업데이트
  const updateAnnotation = useCallback(
    (annotationId: string, updates: AnnotationUpdate) => {
      const editor = getEditor();
      if (!editor) return;
      editor.updateAnnotation(annotationId, updates);
    },
    [getEditor]
  );

  // Multi_Select_Tool: 특정 노드를 현재 선택에서 제거
  const deselectNode = useCallback(
    (nodeId: string) => {
      const editor = getEditor();
      if (!editor) return;
      const currentItems = editor.getSelectedItems();
      const remainingIds = currentItems
        .map((item) => item.id)
        .filter((id) => id !== nodeId);
      if (remainingIds.length > 0) {
        editor.select(remainingIds, true);
      } else {
        editor.deselectAll();
      }
    },
    [getEditor]
  );

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
    addParentPair,
    addPartnerAtPosition,
    convertSubjectType,
    addChildToParentRef,
    addChildConnectionToParentRef,
    addGroupConnection,
    isFetusSubject,
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
    selectedItems,
    pendingConnectionKind,
    setPendingConnectionKind,
    pendingRelationStatus,
    setPendingRelationStatus,
    pendingInfluenceStatus,
    setPendingInfluenceStatus,
    visibility,
    toggleVisibility,
    addAnnotation,
    selectedAnnotation,
    updateAnnotation,
    deselectNode,
  };
};
