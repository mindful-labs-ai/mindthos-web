import React, { useId } from 'react';

import { useViewport } from '@xyflow/react';

import { ConnectionType } from '@/genogram/core/types/enums';

import type { ConnectionPreview } from '../hooks/useCanvasInteraction';
import { getEdgeStyle } from '../utils/edge-style';

interface ConnectionPreviewLineProps {
  preview: ConnectionPreview;
}

/**
 * 클릭 기반 연결 생성 시 source 노드 중심 → 마우스 커서까지의 미리보기 선.
 * ReactFlow 내부에 렌더링되며, viewport 변환을 적용하여 pan/zoom에 따라 이동.
 * 선택된 connection 서브툴의 status에 따라 스타일(색상, 대시, 화살표)이 변경됨.
 */
export const ConnectionPreviewLine: React.FC<ConnectionPreviewLineProps> = ({
  preview,
}) => {
  const { x: vx, y: vy, zoom } = useViewport();
  const markerId = useId();

  // flow 좌표 → 화면(SVG) 좌표 변환
  const sx = preview.sourcePosition.x * zoom + vx;
  const sy = preview.sourcePosition.y * zoom + vy;
  const mx = preview.mousePosition.x * zoom + vx;
  const my = preview.mousePosition.y * zoom + vy;

  const isInfluence = preview.connectionKind === 'influence';

  const connectionType = isInfluence
    ? ConnectionType.Influence_Line
    : ConnectionType.Relation_Line;

  const style = getEdgeStyle(
    connectionType,
    undefined,
    isInfluence ? undefined : preview.relationStatus
  );

  return (
    <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full">
      {isInfluence && (
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={style.stroke} />
          </marker>
        </defs>
      )}
      <line
        x1={sx}
        y1={sy}
        x2={mx}
        y2={my}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        strokeDasharray={style.strokeDasharray ?? '6 3'}
        strokeOpacity={0.7}
        markerEnd={isInfluence ? `url(#${markerId})` : undefined}
      />
      {/* source 노드 중심에 작은 원 표시 */}
      <circle cx={sx} cy={sy} r={4} fill={style.stroke} />
    </svg>
  );
};
