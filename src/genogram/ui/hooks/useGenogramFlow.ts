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

  // Multi_Select_Tool 드래그 선택 감지: 노드가 선택되는 동안 엣지 선택을 필터링
  // 같은 이벤트 사이클에서 노드가 선택되면 드래그로 간주하고 엣지 선택 차단
  const isDragSelectingNodesRef = useRef(false);

  // Multi_Select_Tool additive 선택: 어떤 요소든 선택되면 다른 요소의 deselect를 막음
  // 플래그는 핸들러 시작 시 설정, rAF에서 리셋 (양쪽 핸들러 모두 실행된 후)
  const isAnyElementSelectingRef = useRef(false);
  const selectionFlagResetScheduledRef = useRef(false);

  // 선택 동기화 배치: onNodesChange/onEdgesChange가 같은 이벤트 사이클에
  // 동시에 호출될 수 있으므로, rAF로 한 프레임 뒤에 한 번만 처리.
  // 이렇게 하면 엣지 해제 + 노드 선택이 동시에 일어나도 최종 상태를 반영.
  const selectionBatchRef = useRef<ReturnType<
    typeof requestAnimationFrame
  > | null>(null);

  // 초기 동기화 (Editor useEffect 완료 후) + rAF 클린업
  useEffect(() => {
    syncFromEditor();
    return () => {
      if (selectionBatchRef.current !== null) {
        cancelAnimationFrame(selectionBatchRef.current);
      }
    };
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

  /** 선택 동기화를 다음 프레임으로 예약 (배치) */
  const scheduleSelectionSync = useCallback(() => {
    if (selectionBatchRef.current !== null) {
      cancelAnimationFrame(selectionBatchRef.current);
    }
    selectionBatchRef.current = requestAnimationFrame(() => {
      selectionBatchRef.current = null;
      const editor = getEditor();
      if (!editor) return;

      const latestNodes = nodesRef.current;
      const latestEdges = edgesRef.current;

      const nodeIds: string[] = [];
      for (const n of latestNodes) {
        if (!n.selected) continue;
        if (n.id.startsWith('group-boundary-')) {
          nodeIds.push(n.id.replace('group-boundary-', ''));
        } else if (n.id.startsWith('annotation-')) {
          nodeIds.push(n.id.replace('annotation-', ''));
        } else {
          nodeIds.push(n.id);
        }
      }

      const edgeIds: string[] = [];
      for (const e of latestEdges) {
        if (e.selected) edgeIds.push(e.id);
      }

      const allIds = [...nodeIds, ...edgeIds];
      if (allIds.length > 0) {
        editor.select(allIds, true);
      } else {
        editor.deselectAll();
      }
    });
  }, [getEditor]);

  // 노드 변경 핸들러 (드래그 스냅 포함)
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      // Multi_Select_Tool 모드: 클릭 선택을 additive + toggle로 변환
      if (toolMode === ToolMode.Multi_Select_Tool) {
        const selectChanges = changes.filter(
          (c) => c.type === 'select' && c.selected
        );
        const deselectChanges = changes.filter(
          (c) => c.type === 'select' && !c.selected
        );
        const hasSelect = selectChanges.length > 0;
        const hasOnlyDeselect = deselectChanges.length > 0 && !hasSelect;

        if (hasSelect) {
          // 노드가 선택되고 있음 → 플래그 설정 (엣지 핸들러에서 deselect 방지)
          isDragSelectingNodesRef.current = true;
          isAnyElementSelectingRef.current = true;
          // rAF에서 플래그 리셋 (한 번만 스케줄)
          if (!selectionFlagResetScheduledRef.current) {
            selectionFlagResetScheduledRef.current = true;
            requestAnimationFrame(() => {
              isDragSelectingNodesRef.current = false;
              isAnyElementSelectingRef.current = false;
              selectionFlagResetScheduledRef.current = false;
            });
          }

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
        // hasOnlyDeselect 케이스는 state updater에서 처리 (플래그 확인을 위해)
      }

      // 드래그 중인 변경이 있으면 선택 동기화보다 먼저 isDraggingRef를 설정
      // (syncFromEditor가 드래그 중에 실행되어 위치가 튀는 것을 방지)
      const hasDragging = changes.some(
        (c) => c.type === 'position' && 'dragging' in c && c.dragging
      );
      if (hasDragging) {
        isDraggingRef.current = true;
      }

      // Multi_Select_Tool에서 deselect 전용 변경인지 확인
      const isMultiSelectOnlyDeselect =
        toolMode === ToolMode.Multi_Select_Tool &&
        changes.some((c) => c.type === 'select') &&
        !changes.some((c) => c.type === 'select' && c.selected);

      setNodes((nds) => {
        // state updater 내에서 플래그 확인 (양쪽 핸들러 실행 후)
        let changesToApply = changes;
        if (isMultiSelectOnlyDeselect && isAnyElementSelectingRef.current) {
          // 다른 요소가 선택 중 → 노드 deselect 무시
          changesToApply = changes.filter((c) => c.type !== 'select');
        }
        const next = applyNodeChanges(changesToApply, nds);
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

        // 선택 변경 → 다음 프레임에 배치 처리
        const hasSelectChange = changes.some((c) => c.type === 'select');
        if (hasSelectChange) {
          nodesRef.current = next;
          scheduleSelectionSync();
        }

        return next;
      });
    },
    [getEditor, setNodes, scheduleSelectionSync, toolMode]
  );

  // 엣지 변경 핸들러 (선택 변경 포함)
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge<RelationshipEdgeData>>[]) => {
      // Multi_Select_Tool 모드: 드래그 선택 시 엣지 선택 차단, 개별 클릭은 toggle 허용
      if (toolMode === ToolMode.Multi_Select_Tool) {
        const selectChanges = changes.filter((c) => c.type === 'select');
        if (selectChanges.length > 0) {
          const selectingTrue = selectChanges.filter((c) => c.selected);

          // 엣지가 선택되고 있으면 플래그 설정 (노드 deselect 방지용)
          if (selectingTrue.length === 1) {
            isAnyElementSelectingRef.current = true;
            // rAF에서 플래그 리셋 (한 번만 스케줄)
            if (!selectionFlagResetScheduledRef.current) {
              selectionFlagResetScheduledRef.current = true;
              requestAnimationFrame(() => {
                isAnyElementSelectingRef.current = false;
                selectionFlagResetScheduledRef.current = false;
              });
            }
          }

          // 드래그 선택 감지:
          // 1. 노드가 동시에 선택되고 있음 (isDragSelectingNodesRef)
          // 2. 여러 엣지가 동시에 선택됨 (드래그 박스에 여러 엣지 포함)
          const isDragSelection =
            isDragSelectingNodesRef.current || selectingTrue.length > 1;

          if (isDragSelection) {
            // 드래그 선택 → 엣지 선택 차단 (기존 선택 유지, 새 선택 무시)
            changes = changes.filter((c) => c.type !== 'select');
          } else if (selectingTrue.length === 1) {
            // 개별 엣지 클릭: additive + toggle 로직
            const filtered: EdgeChange<Edge<RelationshipEdgeData>>[] = [];
            for (const c of changes) {
              if (c.type !== 'select') {
                filtered.push(c);
                continue;
              }
              if (c.selected) {
                const edge = edgesRef.current.find((e) => e.id === c.id);
                if (edge?.selected) {
                  // 이미 선택된 엣지 클릭 → 선택 해제 (toggle)
                  filtered.push({ ...c, selected: false });
                } else {
                  filtered.push(c);
                }
              }
              // selected: false는 무시 (다른 엣지 선택 유지 - additive)
            }
            changes = filtered;
          }
          // hasOnlyDeselect 케이스는 state updater에서 처리 (플래그 확인을 위해)
        }
      }

      // Multi_Select_Tool에서 deselect 전용 변경인지 확인
      const isMultiSelectOnlyDeselect =
        toolMode === ToolMode.Multi_Select_Tool &&
        changes.some((c) => c.type === 'select') &&
        !changes.some((c) => c.type === 'select' && c.selected);

      setEdges((eds) => {
        // state updater 내에서 플래그 확인 (양쪽 핸들러 실행 후)
        let changesToApply = changes;
        if (isMultiSelectOnlyDeselect && isAnyElementSelectingRef.current) {
          // 다른 요소가 선택 중 → 엣지 deselect 무시
          changesToApply = changes.filter((c) => c.type !== 'select');
        }
        const next = applyEdgeChanges(changesToApply, eds);

        // 선택 변경 → 다음 프레임에 배치 처리
        const hasSelectChange = changesToApply.some((c) => c.type === 'select');
        if (hasSelectChange) {
          edgesRef.current = next;
          scheduleSelectionSync();
        }

        return next;
      });
    },
    [setEdges, scheduleSelectionSync, toolMode]
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

  // 형제자매 추가 (부모 없으면 부모 생성 후 추가)
  const addSibling = useCallback(
    (subjectId: string) => {
      const editor = getEditor();
      if (!editor) return null;

      const result = editor.addSibling(subjectId);
      editor.select([result.siblingId], true);
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

  // 두 Subject 간 부모-자녀 관계 판별
  const isParentChildRelated = useCallback(
    (id1: string, id2: string) => {
      return getEditor()?.isParentChildRelated(id1, id2) ?? false;
    },
    [getEditor]
  );

  // 두 Subject 간 파트너 연결 여부 판별
  const isPartnerConnected = useCallback(
    (id1: string, id2: string) => {
      return getEditor()?.isPartnerConnected(id1, id2) ?? false;
    },
    [getEditor]
  );

  // 두 Subject 간 파트너 연결
  const addPartnerConnection = useCallback(
    (id1: string, id2: string) => {
      const editor = getEditor();
      if (!editor) return;
      editor.addPartnerConnection(id1, id2);
    },
    [getEditor]
  );

  // 두 Subject 간 관계 연결
  const addRelationConnection = useCallback(
    (id1: string, id2: string, status: string) => {
      const editor = getEditor();
      if (!editor) return;
      editor.addRelationConnection(
        id1,
        id2,
        status as Parameters<typeof editor.addRelationConnection>[2]
      );
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
    addSibling,
    addPartnerConnection,
    addRelationConnection,
    isParentChildRelated,
    isPartnerConnected,
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
