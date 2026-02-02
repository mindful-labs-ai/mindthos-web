import { memo, useCallback, useMemo } from 'react';

import type { NodeProps } from '@xyflow/react';

import {
  SELECTION_BORDER,
  SELECTION_INNER,
} from '@/genogram/core/constants/colors';

export interface GroupBoundaryNodeData {
  connectionId: string;
  memberPositions: { x: number; y: number; sizePx: number }[];
  strokeColor: string;
  memo: string | null;
  isSelected: boolean;
  width: number;
  height: number;
  onSelect: (connectionId: string, additive: boolean) => void;
  [key: string]: unknown;
}

/** 패딩: 멤버 노드 가장자리에서 경계선까지의 거리 */
const PADDING = 20;
/** 원 둘레 샘플 개수 (많을수록 부드러움) */
const CIRCLE_SAMPLES = 16;

// ── Convex Hull (Andrew's Monotone Chain) ──

interface Pt {
  x: number;
  y: number;
}

function cross(o: Pt, a: Pt, b: Pt): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull(points: Pt[]): Pt[] {
  const pts = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 1) return pts;

  const lower: Pt[] = [];
  for (const p of pts) {
    while (
      lower.length >= 2 &&
      cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (
      upper.length >= 2 &&
      cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// ── Path 생성 ──

function hullToPath(hull: Pt[]): string {
  if (hull.length < 3) return '';
  const first = hull[0];
  const parts: string[] = [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`];
  for (let i = 1; i < hull.length; i++) {
    parts.push(`L ${hull[i].x.toFixed(1)} ${hull[i].y.toFixed(1)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/**
 * 멤버 위치 기반 Convex Hull Path를 생성한다.
 */
function buildGroupPath(
  members: { x: number; y: number; sizePx: number }[],
  cx: number,
  cy: number,
  w: number,
  h: number
): string {
  if (members.length === 0) return '';

  const halfW = w / 2;
  const halfH = h / 2;

  // 멤버 원 둘레 샘플 → convex hull
  const samplePoints: Pt[] = [];
  for (const m of members) {
    const localX = m.x - cx + halfW;
    const localY = m.y - cy + halfH;
    const r = m.sizePx / 2 + PADDING;

    for (let i = 0; i < CIRCLE_SAMPLES; i++) {
      const angle = (2 * Math.PI * i) / CIRCLE_SAMPLES;
      samplePoints.push({
        x: localX + r * Math.cos(angle),
        y: localY + r * Math.sin(angle),
      });
    }
  }

  const hull = convexHull(samplePoints);
  if (hull.length < 3) return '';

  return hullToPath(hull);
}

// ── 컴포넌트 ──

export const GroupBoundaryNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as GroupBoundaryNodeData;
  const {
    connectionId,
    strokeColor,
    memo: memoText,
    width,
    height,
    memberPositions,
    onSelect,
  } = nodeData;
  const isSelected = selected || nodeData.isSelected;

  const handlePathClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(connectionId, e.shiftKey);
    },
    [connectionId, onSelect]
  );

  const center = useMemo(() => {
    if (memberPositions.length === 0) return { x: 0, y: 0 };
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const mp of memberPositions) {
      const half = mp.sizePx / 2;
      minX = Math.min(minX, mp.x - half);
      minY = Math.min(minY, mp.y - half);
      maxX = Math.max(maxX, mp.x + half);
      maxY = Math.max(maxY, mp.y + half);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [memberPositions]);

  const pathD = useMemo(
    () => buildGroupPath(memberPositions, center.x, center.y, width, height),
    [memberPositions, center.x, center.y, width, height]
  );

  if (width <= 0 || height <= 0 || !pathD) return null;

  const sw = 2;
  const HIT_BORDER = SELECTION_BORDER;
  const HIT_INNER = SELECTION_INNER;
  const hitW = 16;

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        pointerEvents: 'none',
      }}
    >
      <svg
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {isSelected && (
          <g style={{ pointerEvents: 'none' }}>
            <path
              d={pathD}
              fill="none"
              stroke={HIT_BORDER}
              strokeWidth={hitW + 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={0.45}
            />
            <path
              d={pathD}
              fill="none"
              stroke={HIT_INNER}
              strokeWidth={hitW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(sw, 12)}
          strokeLinejoin="round"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onClick={handlePathClick}
        />
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={sw}
          strokeDasharray="6,4"
          strokeLinejoin="round"
          style={{ pointerEvents: 'none' }}
        />
      </svg>

      {memoText && (
        <button
          type="button"
          style={{
            position: 'absolute',
            bottom: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontSize: 12,
            color: strokeColor,
            pointerEvents: 'auto',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
          onClick={handlePathClick}
        >
          {memoText}
        </button>
      )}
    </div>
  );
});

GroupBoundaryNode.displayName = 'GroupBoundaryNode';
