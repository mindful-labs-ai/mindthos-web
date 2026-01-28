import React from 'react';

import { GHOST_NODE_SIZE } from '../constants/grid';

interface GhostPreviewProps {
  position: { x: number; y: number };
}

/** CreateNode 모드에서 마우스를 따라다니는 미리보기 사각형 */
export const GhostPreview: React.FC<GhostPreviewProps> = ({ position }) => {
  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left: position.x - GHOST_NODE_SIZE / 2,
        top: position.y - GHOST_NODE_SIZE / 2,
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
  );
};
