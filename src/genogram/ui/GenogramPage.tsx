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

import { RelationshipEdge } from './components/edges/RelationshipEdge';
import { EmptyStatePanel } from './components/EmptyStatePanel';
import { GenogramHeader } from './components/GenogramHeader';
import { GenogramPropertyPanel } from './components/GenogramPropertyPanel';
import { GenogramToolbar } from './components/GenogramToolbar';
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
    onConnect,
    addPerson,
    undo,
    redo,
    toolMode,
    setToolMode,
    selectedSubject,
    updateSubject,
    deleteSelected,
    toJSON,
  } = useGenogramFlow();

  const {
    ghostPos,
    isCreateMode,
    handleMouseMove,
    handleMouseLeave,
    handlePaneClick,
    flowInteraction,
    cursorClass,
  } = useCanvasInteraction({
    toolMode,
    addPerson,
    defaultGender: Gender.남성,
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
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodeOrigin={[0.5, 0.5]}
          fitView
          snapToGrid={false}
          defaultEdgeOptions={{ type: 'relationship' }}
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
              hasSelection={selectedSubject !== null}
            />
          </Panel>

          {/* 빈 상태 안내 */}
          {nodes.length === 0 && <EmptyStatePanel />}
        </ReactFlow>

        {/* CreateNode 모드: ghost 미리보기 */}
        {isCreateMode && ghostPos && <GhostPreview position={ghostPos} />}

        {/* 우측 속성 편집 패널 */}
        <GenogramPropertyPanel
          subject={selectedSubject}
          onUpdate={updateSubject}
          onClose={handleClosePanel}
        />
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
