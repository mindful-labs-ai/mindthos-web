import { memo } from 'react';

import { Handle, Position, type NodeProps } from '@xyflow/react';

import { Gender, SubjectType } from '@/genogram/core/types/enums';

export interface PersonNodeData {
  name: string | null;
  gender?: typeof Gender[keyof typeof Gender];
  subjectType?: typeof SubjectType[keyof typeof SubjectType];
  age?: number | null;
  isDead?: boolean;
  isSelected?: boolean;
  [key: string]: unknown;
}

const COLORS = {
  stroke: '#374151',
  fill: '#ffffff',
  selected: '#3b82f6',
  deceased: '#6b7280',
  text: '#1f2937',
  selectedHalo: 'rgba(34, 197, 94, 0.12)',
  addButton: '#22c55e',
};

const NODE_SIZE = 50;
const HALO_SIZE = 96;

export const PersonNode = memo(({ id, data, selected }: NodeProps) => {
  const nodeData = data as PersonNodeData;
  const { name, gender, subjectType, age, isDead } = nodeData;
  const strokeColor = selected ? COLORS.selected : COLORS.stroke;
  const strokeWidth = selected ? 2.5 : 1.5;

  const renderShape = () => {
    // Animal subject type
    if (subjectType === SubjectType.Animal) {
      return (
        <polygon
          points={`${NODE_SIZE / 2},2 ${NODE_SIZE - 2},${NODE_SIZE - 2} 2,${NODE_SIZE - 2}`}
          fill={COLORS.fill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

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
      case Gender.Lesbian:
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
      case Gender.Gay:
        // 게이: 사각형 (남성 기반)
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
      case Gender.TransMale:
      case Gender.TransFemale:
        // 트랜스: 사각+원 조합 (다이아몬드)
        return (
          <polygon
            points={`${NODE_SIZE / 2},2 ${NODE_SIZE - 2},${NODE_SIZE / 2} ${NODE_SIZE / 2},${NODE_SIZE - 2} 2,${NODE_SIZE / 2}`}
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
    if (!isDead) return null;
    // X 표시
    return (
      <g stroke={COLORS.deceased} strokeWidth="2">
        <line x1="8" y1="8" x2={NODE_SIZE - 8} y2={NODE_SIZE - 8} />
        <line x1={NODE_SIZE - 8} y1="8" x2="8" y2={NODE_SIZE - 8} />
      </g>
    );
  };

  const haloOffset = (HALO_SIZE - NODE_SIZE) / 2;

  return (
    <div className="relative">
      {/* 선택 시 초록색 반투명 원 배경 */}
      {selected && (
        <div
          className="absolute rounded-full"
          style={{
            width: HALO_SIZE,
            height: HALO_SIZE,
            top: -haloOffset,
            left: -haloOffset,
            backgroundColor: COLORS.selectedHalo,
            pointerEvents: 'none',
          }}
        />
      )}

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

      {/* 선택 시 + 버튼 */}
      {selected && (
        <button
          type="button"
          className="nodrag absolute flex items-center justify-center rounded-full shadow-sm"
          style={{
            width: 24,
            height: 24,
            bottom: -8,
            right: -12,
            backgroundColor: COLORS.addButton,
            color: '#ffffff',
            fontSize: 16,
            lineHeight: 1,
            cursor: 'pointer',
            border: '2px solid #ffffff',
          }}
          onClick={(e) => {
            e.stopPropagation();
            const event = new CustomEvent('genogram:add-from-node', {
              detail: { nodeId: id },
            });
            window.dispatchEvent(event);
          }}
        >
          +
        </button>
      )}

      {/* 이름 라벨 */}
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-xs text-fg"
        style={{ top: NODE_SIZE + 4 }}
      >
        {name}
        {age != null && (
          <span className="ml-1 text-fg-muted">({age})</span>
        )}
      </div>
    </div>
  );
});

PersonNode.displayName = 'PersonNode';
