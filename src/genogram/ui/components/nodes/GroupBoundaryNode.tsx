import { memo, useCallback, useMemo } from 'react';

import type { NodeProps } from '@xyflow/react';

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

  // 마지막 점은 다음 체인의 첫 점과 중복
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// ── Path 생성 ──

/**
 * 멤버 위치 기반 Convex Hull Rounded Path를 생성한다.
 *
 * 각 멤버를 (sizePx/2 + padding) 반지름 원으로 확장하고,
 * 원 둘레의 샘플 포인트들로 Convex Hull을 계산하면
 * 자연스럽게 둥근 외곽이 나온다.
 *
 * @param members 멤버 위치 (노드 center 기준 절대 좌표)
 * @param cx 노드 중심 X (절대 좌표)
 * @param cy 노드 중심 Y (절대 좌표)
 * @param w SVG 너비
 * @param h SVG 높이
 */
function buildGroupPath(
  members: { x: number; y: number; sizePx: number }[],
  cx: number,
  cy: number,
  w: number,
  h: number
): string {
  if (members.length === 0) return '';

  // 절대 좌표 → SVG 로컬 좌표 (center가 SVG의 w/2, h/2에 위치)
  const halfW = w / 2;
  const halfH = h / 2;

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

  // Hull 포인트를 SVG path로 변환
  const first = hull[0];
  const parts: string[] = [`M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`];
  for (let i = 1; i < hull.length; i++) {
    parts.push(`L ${hull[i].x.toFixed(1)} ${hull[i].y.toFixed(1)}`);
  }
  parts.push('Z');

  return parts.join(' ');
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

  // path 클릭 시 onSelect 콜백으로 editor에 선택 전달
  const handlePathClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(connectionId, e.shiftKey);
    },
    [connectionId, onSelect]
  );

  // 노드 position이 center 좌표이므로
  // memberPositions(절대 좌표)를 SVG 로컬 좌표로 변환하기 위해
  // 노드 자체의 center 좌표가 필요 → memberPositions의 바운딩 박스 중심 사용
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
  // 선택 하이라이트: RelationshipEdge와 동일한 연두색 2-layer
  const HIT_BORDER = '#44CE4B';
  const HIT_INNER = '#f0fdf0';
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
        {/* 선택 하이라이트 (반투명 연두색) */}
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
        {/* 투명 히트 영역 (넓은 strokeWidth로 클릭하기 쉽게) */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(sw, 12)}
          strokeLinejoin="round"
          style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          onClick={handlePathClick}
        />
        {/* 실제 표시되는 선 */}
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
