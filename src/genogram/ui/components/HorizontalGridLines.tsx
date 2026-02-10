import React from 'react';

import { useViewport } from '@xyflow/react';

interface HorizontalGridLinesProps {
  /** Y 간격 (px) */
  gap?: number;
  /** Y 오프셋 (px) - 선이 offset + gap*n 위치에 그려짐 */
  offset?: number;
  /** 선 색상 */
  color?: string;
  /** 선 두께 */
  strokeWidth?: number;
}

/**
 * 캔버스에 수평 그리드선을 그리는 컴포넌트
 * ReactFlow 내부에서 사용해야 합니다.
 */
export const HorizontalGridLines: React.FC<HorizontalGridLinesProps> = ({
  gap = 180,
  offset = 15,
  color = '#F4F5FA',
  strokeWidth = 2,
}) => {
  const { x, y, zoom } = useViewport();

  // 뷰포트 크기 계산 (충분히 큰 범위로 설정)
  const viewportWidth = 10000;
  const viewportHeight = 10000;

  // 현재 뷰포트에서 보이는 flow 좌표 범위 (offset 고려)
  const viewTop = -y / zoom - viewportHeight / 2;
  const viewBottom = -y / zoom + viewportHeight / 2;
  const startN = Math.floor((viewTop - offset) / gap);
  const endN = Math.ceil((viewBottom - offset) / gap);

  const lines: React.ReactNode[] = [];
  for (let n = startN; n <= endN; n++) {
    const lineY = offset + gap * n;
    lines.push(
      <line
        key={lineY}
        x1={-viewportWidth / 2}
        y1={lineY}
        x2={viewportWidth / 2}
        y2={lineY}
        stroke={color}
        strokeWidth={strokeWidth / zoom}
      />
    );
  }

  return (
    <svg
      className="react-flow__background pointer-events-none absolute inset-0"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      <g
        transform={`translate(${x}, ${y}) scale(${zoom})`}
        style={{ transformOrigin: '0 0' }}
      >
        {lines}
      </g>
    </svg>
  );
};
