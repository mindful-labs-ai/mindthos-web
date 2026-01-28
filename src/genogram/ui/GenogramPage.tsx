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
import { ClipboardCopy, RotateCcw, RotateCw } from 'lucide-react';

import { Button, Title } from '@/components/ui';
import { Gender } from '@/genogram/core/types/enums';
import { PlusIcon } from '@/shared/icons';

import { RelationshipEdge } from './components/edges/RelationshipEdge';
import { GenogramPropertyPanel } from './components/GenogramPropertyPanel';
import { GenogramToolbar } from './components/GenogramToolbar';
import { PersonNode } from './components/nodes/PersonNode';
import { GHOST_NODE_SIZE, GRID_GAP } from './constants/grid';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useGenogramFlow } from './hooks/useGenogramFlow';

// 커스텀 노드 타입 등록
const nodeTypes = {
  person: PersonNode,
};

// 커스텀 엣지 타입 등록
const edgeTypes = {
  relationship: RelationshipEdge,
};

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
    defaultGender: Gender.Male,
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
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <Title as="h1" className="text-xl font-bold">
          가계도
        </Title>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyJSON}
            icon={<ClipboardCopy size={16} />}
          >
            {copied ? '복사됨' : 'JSON 복사'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            icon={<RotateCcw size={16} />}
          >
            실행취소
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            icon={<RotateCw size={16} />}
          >
            다시실행
          </Button>
        </div>
      </div>

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
          defaultEdgeOptions={{
            type: 'relationship',
          }}
          proOptions={{ hideAttribution: true }}
          {...flowInteraction}
        >
          <Background variant={BackgroundVariant.Dots} gap={GRID_GAP} size={2} />
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
          {nodes.length === 0 && (
            <Panel
              position="top-center"
              className="mt-20 flex flex-col items-center gap-4"
            >
              <div className="rounded-lg border border-dashed border-border bg-white/80 p-8 text-center backdrop-blur-sm">
                <div className="mb-4 flex justify-center">
                  <PlusIcon size={32} className="text-fg-muted" />
                </div>
                <p className="mb-2 font-medium text-fg">가계도를 시작하세요</p>
                <p className="text-sm text-fg-muted">
                  하단 도구에서 구성원 추가를 선택한 후
                  <br />
                  캔버스를 클릭하여 추가합니다
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>

        {/* CreateNode 모드: ghost 미리보기 */}
        {isCreateMode && ghostPos && (
          <div
            className="pointer-events-none absolute z-20"
            style={{
              left: ghostPos.x - GHOST_NODE_SIZE / 2,
              top: ghostPos.y - GHOST_NODE_SIZE / 2,
            }}
          >
            <svg
              width={GHOST_NODE_SIZE}
              height={GHOST_NODE_SIZE}
              viewBox={`0 0 ${GHOST_NODE_SIZE} ${GHOST_NODE_SIZE}`}
              opacity={0.5}
            >
              <rect
                x="2"
                y="2"
                width={GHOST_NODE_SIZE - 4}
                height={GHOST_NODE_SIZE - 4}
                fill="#ffffff"
                stroke="#374151"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                rx="2"
              />
            </svg>
          </div>
        )}

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
