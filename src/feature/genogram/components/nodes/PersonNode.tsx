import React, { memo } from 'react';

import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Gender } from '@/genogram/core/types/enums';

export interface PersonNodeData {
  name: string;
  gender: Gender;
  age?: number;
  isDeceased?: boolean;
  isSelected?: boolean;
  [key: string]: unknown;
}

const COLORS = {
  stroke: '#374151',
  fill: '#ffffff',
  selected: '#3b82f6',
  deceased: '#6b7280',
  text: '#1f2937',
};

const NODE_SIZE = 50;

export const PersonNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as PersonNodeData;
  const { name, gender, age, isDeceased } = nodeData;
  const strokeColor = selected ? COLORS.selected : COLORS.stroke;
  const strokeWidth = selected ? 2.5 : 1.5;

  const renderShape = () => {
    switch (gender) {
      case Gender.Male:
        // 남성: 사각형
        return (
          <rect
            x="2"
            y="2"
            width={NODE_SIZE - 4}
            height={NODE_SIZE - 4}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            rx="2"
          />
        );
      case Gender.Female:
        // 여성: 원
        return (
          <circle
            cx={NODE_SIZE / 2}
            cy={NODE_SIZE / 2}
            r={NODE_SIZE / 2 - 2}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case Gender.NonBinary:
        // 논바이너리: 다이아몬드
        return (
          <polygon
            points={`${NODE_SIZE / 2},2 ${NODE_SIZE - 2},${NODE_SIZE / 2} ${NODE_SIZE / 2},${NODE_SIZE - 2} 2,${NODE_SIZE / 2}`}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      case Gender.Pet:
        // 반려동물: 삼각형
        return (
          <polygon
            points={`${NODE_SIZE / 2},2 ${NODE_SIZE - 2},${NODE_SIZE - 2} 2,${NODE_SIZE - 2}`}
            fill={COLORS.fill}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        );
      default:
        // 기타: ?가 있는 원
        return (
          <>
            <circle
              cx={NODE_SIZE / 2}
              cy={NODE_SIZE / 2}
              r={NODE_SIZE / 2 - 2}
              fill={COLORS.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={NODE_SIZE / 2}
              y={NODE_SIZE / 2 + 5}
              textAnchor="middle"
              fontSize="18"
              fill={COLORS.text}
            >
              ?
            </text>
          </>
        );
    }
  };

  const renderDeceased = () => {
    if (!isDeceased) return null;
    // X 표시
    return (
      <g stroke={COLORS.deceased} strokeWidth="2">
        <line x1="8" y1="8" x2={NODE_SIZE - 8} y2={NODE_SIZE - 8} />
        <line x1={NODE_SIZE - 8} y1="8" x2="8" y2={NODE_SIZE - 8} />
      </g>
    );
  };

  return (
    <div className="relative">
      {/* 연결 핸들 */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-gray-400 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-gray-400 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !border-2 !border-gray-400 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !border-2 !border-gray-400 !bg-white"
      />

      {/* 노드 모양 */}
      <svg
        width={NODE_SIZE}
        height={NODE_SIZE}
        viewBox={`0 0 ${NODE_SIZE} ${NODE_SIZE}`}
        className="cursor-pointer"
      >
        {renderShape()}
        {renderDeceased()}
      </svg>

      {/* 이름 라벨 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs text-fg"
        style={{ top: NODE_SIZE + 4 }}
      >
        {name}
        {age !== undefined && (
          <span className="ml-1 text-fg-muted">({age})</span>
        )}
      </div>
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
