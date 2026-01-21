import React, { useCallback, useState } from 'react';

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { RotateCcw, RotateCw } from 'lucide-react';

import { Button, Title } from '@/components/ui';
import { Gender } from '@/genogram/core/types/enums';
import { PlusIcon } from '@/shared/icons';

import { RelationshipEdge } from '../components/edges/RelationshipEdge';
import { PersonNode } from '../components/nodes/PersonNode';
import { useGenogramFlow } from '../hooks/useGenogramFlow';

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
  } = useGenogramFlow();

  const [isAddingNode, setIsAddingNode] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.Male);

  // 캔버스 클릭 시 노드 추가
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (!isAddingNode) return;

      const bounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      addPerson('새 구성원', selectedGender, position);
      setIsAddingNode(false);
    },
    [isAddingNode, selectedGender, addPerson]
  );

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
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            type: 'relationship',
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls position="bottom-right" />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              if (node.selected) return '#3b82f6';
              return '#e5e7eb';
            }}
            maskColor="rgba(255, 255, 255, 0.8)"
          />

          {/* 툴바 패널 */}
          <Panel position="top-left" className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 rounded-lg border border-border bg-white p-2 shadow-sm">
              <span className="px-2 text-xs font-medium text-fg-muted">
                구성원 추가
              </span>
              <div className="flex gap-1">
                <Button
                  variant={
                    isAddingNode && selectedGender === Gender.Male
                      ? 'solid'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedGender(Gender.Male);
                    setIsAddingNode(true);
                  }}
                  className="flex-1"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <rect
                      x="2"
                      y="2"
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      rx="1"
                    />
                  </svg>
                </Button>
                <Button
                  variant={
                    isAddingNode && selectedGender === Gender.Female
                      ? 'solid'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => {
                    setSelectedGender(Gender.Female);
                    setIsAddingNode(true);
                  }}
                  className="flex-1"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16">
                    <circle
                      cx="8"
                      cy="8"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                </Button>
              </div>
              {isAddingNode && (
                <span className="mt-1 text-center text-xs text-primary">
                  캔버스를 클릭하세요
                </span>
              )}
            </div>
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
                  왼쪽 도구에서 구성원을 선택한 후
                  <br />
                  캔버스를 클릭하여 추가합니다
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>
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
