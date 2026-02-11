import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import {
  ConnectionType,
  Gender,
  ParentChildStatus,
  SubjectType,
  ToolMode,
} from '@/genogram/core/types/enums';

import { AnnotationPropertyPanel } from './components/AnnotationPropertyPanel';
import { ConnectionPreviewLine } from './components/ConnectionPreviewLine';
import { RelationshipEdge } from './components/edges/RelationshipEdge';
import { EmptyStatePanel } from './components/EmptyStatePanel';
import {
  deriveSelectionContext,
  FloatingActionButton,
  type FloatingActionExtra,
  type FloatingActionType,
  type SelectionContext,
} from './components/FloatingActionButton';
import { GenogramPropertyPanel } from './components/GenogramPropertyPanel';
import {
  GenogramToolbar,
  type ConnectionSubTool,
  type SubjectSubTool,
} from './components/GenogramToolbar';
import { GhostPreview } from './components/GhostPreview';
import { HorizontalGridLines } from './components/HorizontalGridLines';
import { AnnotationNode } from './components/nodes/AnnotationNode';
import { GroupBoundaryNode } from './components/nodes/GroupBoundaryNode';
import { PersonNode } from './components/nodes/PersonNode';
import { GRID_DOT_COLOR, GRID_GAP } from './constants/grid';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useGenogramFlow } from './hooks/useGenogramFlow';
import {
  KEYBOARD_DISABLED_PROPS,
  useGenogramKeyboard,
} from './hooks/useGenogramKeyboard';

// 커스텀 노드/엣지 타입 등록
const nodeTypes = {
  person: PersonNode,
  'group-boundary': GroupBoundaryNode,
  annotation: AnnotationNode,
};
const edgeTypes = { relationship: RelationshipEdge };

export interface GenogramPageProps {
  /** JSON string — 최초 로드 데이터 */
  initialData?: string;
  /** 데이터 변경 시 콜백 (JSON string) */
  onChange?: (json: string) => void;
  /** 하단 툴바 숨김 여부 */
  hideToolbar?: boolean;
}

export interface GenogramPageHandle {
  /** JSON string을 받아 가계도 데이터를 로드한다. 어떤 타이밍이든 호출 가능. */
  loadJSON: (json: string) => void;
  /** 현재 가계도 데이터를 JSON string으로 반환한다. */
  toJSON: () => string;
  /** 실행 취소 */
  undo: () => void;
  /** 다시 실행 */
  redo: () => void;
  /** 실행 취소 가능 여부 */
  canUndo: () => boolean;
  /** 다시 실행 가능 여부 */
  canRedo: () => boolean;
  /** 우측 속성 패널이 열려있는지 여부 */
  isPanelOpen: () => boolean;
  /** 캔버스를 이미지 데이터 URL로 캡처 */
  captureImage: () => Promise<string | null>;
}

const GenogramCanvas = React.forwardRef<GenogramPageHandle, GenogramPageProps>(
  (props, ref) => {
    const {
      nodes,
      edges,
      onNodesChange,
      onEdgesChange,
      createConnection,
      addPerson,
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
      undo,
      redo,
      canUndo,
      canRedo,
      toolMode,
      setToolMode,
      selectedSubject,
      selectedConnection,
      selectedItems,
      updateSubject,
      updateConnection,
      deleteSelected,
      toJSON,
      fromJSON,
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
      syncViewportToEditor,
      getEditorViewport,
    } = useGenogramFlow({ initialData: props.initialData });

    // onChange 호출: state-change 이벤트 시 toJSON으로 데이터 전달
    const onChangeRef = useRef(props.onChange);
    onChangeRef.current = props.onChange;

    const toJSONRef = useRef(toJSON);
    toJSONRef.current = toJSON;

    useEffect(() => {
      if (!onChangeRef.current) return;
      // nodes가 변경될 때마다 onChange 호출 (state-change 이벤트 반영)
      onChangeRef.current(toJSONRef.current());
    }, [nodes]);

    // 속성 패널 열림 상태 (Fetus는 패널이 렌더링되지 않으므로 제외)
    const isPanelOpen = !!(
      (selectedSubject && selectedSubject.entity.type !== SubjectType.Fetus) ||
      selectedConnection ||
      selectedAnnotation
    );

    // 키보드 단축키 훅: Backspace 삭제, Cmd+Z Undo, Cmd+Shift+Z Redo
    useGenogramKeyboard({
      deleteSelected,
      undo,
      redo,
    });

    const { getNodes, getViewport, setViewport, getNodesBounds } =
      useReactFlow();

    const captureImage = useCallback(async (): Promise<string | null> => {
      const paneEl = canvasRef.current?.querySelector(
        '.react-flow__pane'
      ) as HTMLElement | null;
      if (!paneEl) return null;

      const currentNodes = getNodes();
      if (currentNodes.length === 0) return null;

      // 현재 뷰포트 저장
      const originalViewport = getViewport();

      // 모든 노드의 bounds 계산
      const bounds = getNodesBounds(currentNodes);
      const containerEl = canvasRef.current;
      if (!containerEl) return null;

      const containerWidth = containerEl.clientWidth;
      const containerHeight = containerEl.clientHeight;

      // padding을 포함한 zoom 계산
      const padding = 0.1;
      const paddedWidth = bounds.width * (1 + padding * 2);
      const paddedHeight = bounds.height * (1 + padding * 2);

      const zoomX = containerWidth / paddedWidth;
      const zoomY = containerHeight / paddedHeight;
      const zoom = Math.min(zoomX, zoomY, 1); // 최대 zoom 1로 제한

      // bounds 중심을 화면 중심으로 이동
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      const newViewport = {
        x: containerWidth / 2 - centerX * zoom,
        y: containerHeight / 2 - centerY * zoom,
        zoom,
      };

      // viewport 직접 설정
      setViewport(newViewport, { duration: 0 });

      // DOM 업데이트 대기
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const dataUrl = await toPng(paneEl, {
          backgroundColor: undefined,
          pixelRatio: 4,
        });

        // 원래 뷰포트로 복원
        setViewport(originalViewport, { duration: 0 });

        return dataUrl;
      } catch {
        // 에러 시에도 뷰포트 복원
        setViewport(originalViewport, { duration: 0 });
        return null;
      }
    }, [getNodes, getViewport, setViewport, getNodesBounds]);

    // JSON 로드 + ReactFlow viewport 동기화
    const loadJSON = useCallback(
      (json: string) => {
        fromJSON(json);
        // Editor에서 저장된 viewport를 ReactFlow에 적용
        const editorViewport = getEditorViewport();
        setViewport(editorViewport, { duration: 0 });
      },
      [fromJSON, getEditorViewport, setViewport]
    );

    useImperativeHandle(
      ref,
      () => ({
        loadJSON,
        toJSON,
        undo,
        redo,
        canUndo: () => canUndo,
        canRedo: () => canRedo,
        isPanelOpen: () => isPanelOpen,
        captureImage,
      }),
      [
        loadJSON,
        toJSON,
        undo,
        redo,
        canUndo,
        canRedo,
        isPanelOpen,
        captureImage,
      ]
    );

    // Subject 서브툴 상태: 어떤 모드로 캔버스 클릭을 처리할지
    const [subjectCreateMode, setSubjectCreateMode] = useState<
      'person' | 'family' | 'animal'
    >('person');
    const [defaultGender, setDefaultGender] = useState<
      (typeof Gender)[keyof typeof Gender]
    >(Gender.Male);

    // FAB에서 연결 모드 진입 시 소스 Subject ID 추적 (partner/relation 공용)
    const [fabSourceId, setFabSourceId] = useState<string | null>(null);

    // 자녀 모드: FAB에서 자녀 추가 시 파트너선 ID + 자녀 상태 추적
    const [pendingChildPartnerLineId, setPendingChildPartnerLineId] = useState<
      string | null
    >(null);
    const [pendingChildStatus, setPendingChildStatus] = useState<
      (typeof ParentChildStatus)[keyof typeof ParentChildStatus]
    >(ParentChildStatus.Biological_Child);

    // 파트너 모드에서 빈 곳 클릭 시: 파트너 Subject 생성 + 파트너선 연결
    const handlePartnerCreateAtPosition = useCallback(
      (sourceId: string, position: { x: number; y: number }) => {
        addPartnerAtPosition(sourceId, position);
        setFabSourceId(null);
      },
      [addPartnerAtPosition]
    );

    // 자녀 모드에서 빈 곳 클릭 시: 자녀 Subject 생성 + 부모-자녀선 연결
    const handleChildCreateAtPosition = useCallback(
      (_sourceId: string, position: { x: number; y: number }) => {
        if (!pendingChildPartnerLineId) return;
        const newId = addPerson(defaultGender, position);
        if (newId) {
          addChildConnectionToParentRef(
            pendingChildPartnerLineId,
            newId,
            pendingChildStatus
          );
        }
        setPendingChildPartnerLineId(null);
        setFabSourceId(null);
      },
      [
        addPerson,
        defaultGender,
        addChildConnectionToParentRef,
        pendingChildPartnerLineId,
        pendingChildStatus,
      ]
    );

    // Subject 서브툴 선택 핸들러
    const handleSubjectSubToolSelect = useCallback(
      (subTool: SubjectSubTool) => {
        switch (subTool.kind) {
          case 'family':
            setSubjectCreateMode('family');
            break;
          case 'gender':
            setSubjectCreateMode('person');
            setDefaultGender(subTool.gender);
            break;
          case 'animal':
            setSubjectCreateMode('animal');
            break;
        }
        // Create_Subject_Tool 모드 유지 (이미 활성화 상태)
      },
      []
    );

    // Connection 서브툴 선택 핸들러
    const handleConnectionSubToolSelect = useCallback(
      (subTool: ConnectionSubTool) => {
        if (subTool.kind === 'relation') {
          setPendingConnectionKind('relation');
          setPendingRelationStatus(subTool.status);
        } else {
          setPendingConnectionKind('influence');
          setPendingInfluenceStatus(subTool.status);
        }
      },
      [
        setPendingConnectionKind,
        setPendingRelationStatus,
        setPendingInfluenceStatus,
      ]
    );

    const {
      ghost,
      isCreateMode,
      connectionPreview,
      handleMouseMove,
      handleMouseLeave,
      handlePaneClick,
      handleNodeClick,
      handleEdgeClick,
      flowInteraction,
      cursorClass,
    } = useCanvasInteraction({
      toolMode,
      addPerson,
      defaultGender,
      onConnectionCreate: createConnection,
      onFamilyCreate: addFamily,
      onAnimalCreate: addAnimal,
      subjectCreateMode,
      pendingConnectionKind,
      pendingRelationStatus,
      pendingInfluenceStatus,
      fabSourceId,
      onPartnerCreateAtPosition: handlePartnerCreateAtPosition,
      onChildCreateAtPosition: handleChildCreateAtPosition,
      onChildNodeClick: useCallback(
        (childId: string) => {
          if (!pendingChildPartnerLineId) return;
          addChildConnectionToParentRef(
            pendingChildPartnerLineId,
            childId,
            pendingChildStatus
          );
          setPendingChildPartnerLineId(null);
        },
        [
          addChildConnectionToParentRef,
          pendingChildPartnerLineId,
          pendingChildStatus,
        ]
      ),
      onFabComplete: useCallback(() => {
        setFabSourceId(null);
        setPendingChildPartnerLineId(null);
        setToolMode(ToolMode.Select_Tool);
      }, [setToolMode]),
      onAnnotationCreate: addAnnotation,
      onMultiSelectToggle: deselectNode,
    });

    // 속성 패널 닫기
    const handleClosePanel = useCallback(() => {
      // deselectAll은 훅에서 아직 미노출 — 빈 영역 클릭으로 해제됨
    }, []);

    // ── 플로팅 액션 버튼 ──

    const selectionContext = useMemo<SelectionContext>(() => {
      const ctx = deriveSelectionContext(selectedItems);
      if (ctx.type === 'single-subject') {
        ctx.isSpecialChild = isFetusSubject(ctx.subjectId);
      }
      if (ctx.type === 'dual-subject') {
        ctx.isParentChild = isParentChildRelated(ctx.ids[0], ctx.ids[1]);
        ctx.isPartner = isPartnerConnected(ctx.ids[0], ctx.ids[1]);
      }
      return ctx;
    }, [
      selectedItems,
      isFetusSubject,
      isParentChildRelated,
      isPartnerConnected,
    ]);

    const { flowToScreenPosition } = useReactFlow();
    const viewport = useViewport();
    const canvasRef = useRef<HTMLDivElement>(null);

    // ReactFlow viewport 변경 시 Editor 데이터 모델과 동기화
    const handleViewportChange = useCallback(
      (
        _event: unknown,
        newViewport: { x: number; y: number; zoom: number }
      ) => {
        syncViewportToEditor(newViewport);
      },
      [syncViewportToEditor]
    );

    // 선택된 노드/엣지의 화면 좌표 계산 (캔버스 컨테이너 기준 상대 좌표)
    const fabPosition = useMemo<{ x: number; y: number } | null>(() => {
      let flowPoint: { x: number; y: number } | null = null;

      if (selectionContext.type === 'single-subject') {
        const node = nodes.find((n) => n.id === selectionContext.subjectId);
        if (!node) return null;
        const sizePx = (node.data as { sizePx?: number }).sizePx ?? 60;
        flowPoint = {
          x: node.position.x + sizePx / 2 + 12,
          y: node.position.y,
        };
      } else if (selectionContext.type === 'single-connection') {
        // 파트너선: 두 노드의 중간 지점 우측에 FAB 배치
        const edge = edges.find((e) => e.id === selectionContext.connectionId);
        if (
          !edge ||
          (edge.data as { connectionType?: string })?.connectionType !==
            ConnectionType.Partner_Line
        ) {
          return null;
        }
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;
        const srcSizePx = (sourceNode.data as { sizePx?: number }).sizePx ?? 60;
        const tgtSizePx = (targetNode.data as { sizePx?: number }).sizePx ?? 60;
        const midX = (sourceNode.position.x + targetNode.position.x) / 2;
        // 파트너선 U자 커브 하단(bottomY) 바로 위에 배치
        const bottomY =
          Math.max(
            sourceNode.position.y + srcSizePx / 2,
            targetNode.position.y + tgtSizePx / 2
          ) + 40; // PARTNER_OFFSET
        flowPoint = { x: midX, y: bottomY + 20 };
      } else if (
        selectionContext.type === 'dual-subject' ||
        selectionContext.type === 'multi'
      ) {
        // 다중 선택: 선택된 노드들의 가장 오른쪽 + 12px, 평균 Y
        const selectedNodes = nodes.filter(
          (n) => n.selected && !n.id.startsWith('group-boundary-')
        );
        if (selectedNodes.length === 0) return null;
        let maxX = -Infinity;
        let sumY = 0;
        for (const n of selectedNodes) {
          const sizePx = (n.data as { sizePx?: number }).sizePx ?? 60;
          maxX = Math.max(maxX, n.position.x + sizePx / 2);
          sumY += n.position.y;
        }
        flowPoint = {
          x: maxX + 12,
          y: sumY / selectedNodes.length,
        };
      }

      if (!flowPoint) return null;

      const screenPos = flowToScreenPosition(flowPoint);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return screenPos;

      return {
        x: screenPos.x - rect.left,
        y: screenPos.y - rect.top,
      };
      // viewport를 deps에 포함하여 줌/팬 시 재계산
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectionContext, nodes, edges, flowToScreenPosition, viewport]);

    const handleFloatingAction = useCallback(
      (
        action: FloatingActionType,
        context: SelectionContext,
        extra?: FloatingActionExtra
      ) => {
        switch (action) {
          case 'add-parent':
            if (context.type === 'single-subject') {
              addParentPair(context.subjectId);
            }
            break;
          case 'add-sibling':
            if (context.type === 'single-subject') {
              addSibling(context.subjectId);
            }
            break;
          case 'add-partner':
            if (context.type === 'single-subject') {
              // 파트너 연결 모드 진입: 소스 설정 + Create_Connection_Tool + partner kind
              setFabSourceId(context.subjectId);
              setPendingConnectionKind('partner');
              setToolMode(ToolMode.Create_Connection_Tool);
            } else if (context.type === 'dual-subject') {
              addPartnerConnection(context.ids[0], context.ids[1]);
            }
            break;
          case 'add-relation':
            if (context.type === 'dual-subject' && extra?.relationStatus) {
              addRelationConnection(
                context.ids[0],
                context.ids[1],
                extra.relationStatus
              );
            }
            break;
          case 'add-group': {
            const ids =
              context.type === 'multi'
                ? context.ids
                : context.type === 'dual-subject'
                  ? context.ids
                  : null;
            if (ids) {
              const memberIds: string[] = [];
              const memberPositions: {
                x: number;
                y: number;
                sizePx: number;
              }[] = [];
              for (const nid of ids) {
                const node = nodes.find(
                  (n) => n.id === nid && !n.id.startsWith('group-boundary-')
                );
                if (!node) continue;
                const sizePx = (node.data as { sizePx?: number }).sizePx ?? 60;
                memberIds.push(nid);
                memberPositions.push({
                  x: node.position.x,
                  y: node.position.y,
                  sizePx,
                });
              }
              if (memberPositions.length >= 2) {
                addGroupConnection(memberIds, memberPositions);
              }
            }
            break;
          }
          case 'add-child':
            if (extra?.parentChildStatus) {
              const status = extra.parentChildStatus;
              // parentRef: 파트너선 ID (single-connection) 또는 Subject ID (single-subject)
              const parentRef =
                context.type === 'single-connection'
                  ? context.connectionId
                  : context.type === 'single-subject'
                    ? context.subjectId
                    : null;
              if (!parentRef) break;

              const selectableStatuses: string[] = [
                ParentChildStatus.Biological_Child,
                ParentChildStatus.Adopted_Child,
                ParentChildStatus.Foster_Child,
              ];
              if (selectableStatuses.includes(status)) {
                // 선택/생성 모드 진입: 기존 Subject 클릭 → 연결, 빈 곳 클릭 → 생성 + 연결
                setPendingChildPartnerLineId(parentRef);
                setPendingChildStatus(status);
                setFabSourceId(parentRef);
                setPendingConnectionKind('child');
                setToolMode(ToolMode.Create_Connection_Tool);
              } else {
                // 즉시 생성
                addChildToParentRef(parentRef, status);
              }
            }
            break;
        }
      },
      [
        addParentPair,
        addSibling,
        addPartnerConnection,
        addRelationConnection,
        addChildToParentRef,
        addGroupConnection,
        nodes,
        setPendingConnectionKind,
        setToolMode,
      ]
    );

    return (
      <div
        ref={canvasRef}
        className={`relative h-full ${cursorClass}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={handlePaneClick}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodeOrigin={[0.5, 0.5]}
          onInit={(instance) => {
            if (nodes.length > 0) instance.fitView();
          }}
          onMove={handleViewportChange}
          snapToGrid={false}
          defaultEdgeOptions={{ type: 'relationship', interactionWidth: 20 }}
          proOptions={{ hideAttribution: true }}
          style={{ backgroundColor: '#F4F5FA' }}
          {...flowInteraction}
          {...KEYBOARD_DISABLED_PROPS}
        >
          {visibility.grid && (
            <>
              <Background
                variant={BackgroundVariant.Dots}
                gap={GRID_GAP}
                size={2}
                color={GRID_DOT_COLOR}
              />
              <HorizontalGridLines gap={180} color={GRID_DOT_COLOR} />
            </>
          )}
          {!props.hideToolbar && <Controls position="bottom-left" />}

          {/* 하단 중앙 툴바 */}
          {!props.hideToolbar && (
            <Panel position="bottom-center" className="mb-4">
              <GenogramToolbar
                toolMode={toolMode}
                onToolModeChange={setToolMode}
                onDelete={deleteSelected}
                hasSelection={selectedItems.length > 0}
                onSubjectSubToolSelect={handleSubjectSubToolSelect}
                onConnectionSubToolSelect={handleConnectionSubToolSelect}
                visibility={visibility}
                onToggleVisibility={toggleVisibility}
              />
            </Panel>
          )}

          {/* 빈 상태 안내 */}
          {nodes.length === 0 && <EmptyStatePanel />}

          {/* 클릭 기반 연결 미리보기 선 */}
          {connectionPreview && (
            <ConnectionPreviewLine preview={connectionPreview} />
          )}
        </ReactFlow>

        {/* CreateNode 모드: ghost 미리보기 */}
        {isCreateMode && ghost && (
          <GhostPreview
            position={ghost}
            zoom={ghost.zoom}
            subjectCreateMode={subjectCreateMode}
            gender={defaultGender}
          />
        )}

        {/* 선택 노드 옆 플로팅 액션 버튼 */}
        <FloatingActionButton
          selectionContext={selectionContext}
          position={fabPosition}
          onAction={handleFloatingAction}
        />

        {/* 우측 속성 편집 패널 */}
        {selectedAnnotation ? (
          <AnnotationPropertyPanel
            annotation={selectedAnnotation}
            onUpdate={updateAnnotation}
          />
        ) : selectedSubject || selectedConnection ? (
          <GenogramPropertyPanel
            subject={selectedSubject}
            onUpdate={updateSubject}
            onConvertType={convertSubjectType}
            connection={selectedConnection}
            onConnectionUpdate={updateConnection}
            onClose={handleClosePanel}
          />
        ) : null}
      </div>
    );
  }
);

GenogramCanvas.displayName = 'GenogramCanvas';

export const GenogramPage = React.forwardRef<
  GenogramPageHandle,
  GenogramPageProps
>((props, ref) => {
  return (
    <ReactFlowProvider>
      <GenogramCanvas ref={ref} {...props} />
    </ReactFlowProvider>
  );
});

GenogramPage.displayName = 'GenogramPage';

export default GenogramPage;
