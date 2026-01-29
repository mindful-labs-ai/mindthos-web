import React, { useCallback, useState } from 'react';

import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Gender } from '@/genogram/core/types/enums';

import { ConnectionPreviewLine } from './components/ConnectionPreviewLine';
import { RelationshipEdge } from './components/edges/RelationshipEdge';
import { EmptyStatePanel } from './components/EmptyStatePanel';
import { GenogramHeader } from './components/GenogramHeader';
import { GenogramPropertyPanel } from './components/GenogramPropertyPanel';
import {
  GenogramToolbar,
  type ConnectionSubTool,
  type SubjectSubTool,
} from './components/GenogramToolbar';
import { GhostPreview } from './components/GhostPreview';
import { PersonNode } from './components/nodes/PersonNode';
import { GRID_GAP } from './constants/grid';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useGenogramFlow } from './hooks/useGenogramFlow';

// 커스텀 노드/엣지 타입 등록
const nodeTypes = { person: PersonNode };
const edgeTypes = { relationship: RelationshipEdge };

const GenogramCanvas: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    createConnection,
    addPerson,
    addFamily,
    addAnimal,
    undo,
    redo,
    toolMode,
    setToolMode,
    selectedSubject,
    selectedConnection,
    updateSubject,
    updateConnection,
    deleteSelected,
    toJSON,
    pendingConnectionKind,
    setPendingConnectionKind,
    pendingRelationStatus,
    setPendingRelationStatus,
    pendingInfluenceStatus,
    setPendingInfluenceStatus,
  } = useGenogramFlow();

  // Subject 서브툴 상태: 어떤 모드로 캔버스 클릭을 처리할지
  const [subjectCreateMode, setSubjectCreateMode] = useState<
    'person' | 'family' | 'animal'
  >('person');
  const [defaultGender, setDefaultGender] = useState<
    (typeof Gender)[keyof typeof Gender]
  >(Gender.Male);

  // Subject 서브툴 선택 핸들러
  const handleSubjectSubToolSelect = useCallback((subTool: SubjectSubTool) => {
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
  }, []);

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
  });

  const [copied, setCopied] = useState(false);

  const handleCopyJSON = useCallback(() => {
    const json = toJSON();
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [toJSON]);

  // 속성 패널 닫기
  const handleClosePanel = useCallback(() => {
    // deselectAll은 훅에서 아직 미노출 — 빈 영역 클릭으로 해제됨
  }, []);

  return (
    <div className="flex h-full flex-col">
      <GenogramHeader
        copied={copied}
        onCopyJSON={handleCopyJSON}
        onUndo={undo}
        onRedo={redo}
      />

      {/* 캔버스 영역 */}
      <div
        className={`relative flex-1 ${cursorClass}`}
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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodeOrigin={[0.5, 0.5]}
          onInit={(instance) => {
            if (nodes.length > 0) instance.fitView();
          }}
          snapToGrid={false}
          defaultEdgeOptions={{ type: 'relationship', interactionWidth: 20 }}
          proOptions={{ hideAttribution: true }}
          {...flowInteraction}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={GRID_GAP}
            size={2}
          />
          <Controls position="bottom-left" />

          {/* 하단 중앙 툴바 */}
          <Panel position="bottom-center" className="mb-4">
            <GenogramToolbar
              toolMode={toolMode}
              onToolModeChange={setToolMode}
              onDelete={deleteSelected}
              hasSelection={
                selectedSubject !== null || selectedConnection !== null
              }
              onSubjectSubToolSelect={handleSubjectSubToolSelect}
              onConnectionSubToolSelect={handleConnectionSubToolSelect}
            />
          </Panel>

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

        {/* 우측 속성 편집 패널 */}
        {(selectedSubject || selectedConnection) && (
          <GenogramPropertyPanel
            subject={selectedSubject}
            onUpdate={updateSubject}
            connection={selectedConnection}
            onConnectionUpdate={updateConnection}
            onClose={handleClosePanel}
          />
        )}
      </div>
    </div>
  );
};

export const GenogramPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <GenogramCanvas />
    </ReactFlowProvider>
  );
};

export default GenogramPage;
