import { memo, type ReactNode } from 'react';

import { EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

import type { NodeShape } from '@/genogram/core/models/person';
import type { PartnerDetail } from '@/genogram/core/models/relationship';
import { getPartnerDateVisibility } from '@/genogram/core/models/relationship';
import {
  ConnectionType,
  InfluenceStatus,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
  StrokeWidth,
} from '@/genogram/core/types/enums';

import { DEFAULT_NODE_SIZE } from '../../constants/grid';

/* ───────────────────────────── Types ───────────────────────────── */

export interface RelationshipEdgeData {
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType];
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus];
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  influenceStatus?: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
  parentChildStatus?: (typeof ParentChildStatus)[keyof typeof ParentChildStatus];
  partnerDetail?: PartnerDetail;
  label?: string;
  sourceSizePx?: number;
  targetSizePx?: number;
  sourceShape?: NodeShape;
  targetShape?: NodeShape;
  partnerMidpoint?: { x: number; y: number } | null;
  partnerSubjects?: { x1: number; x2: number } | null;
  /** 쌍둥이: 두 번째 자녀의 flow 좌표 */
  twinTargetPosition?: { x: number; y: number } | null;
  strokeColor?: string;
  strokeWidth?: string; // StrokeWidth enum value ('THIN' | 'DEFAULT' | 'THICK')
  textColor?: string;
  [key: string]: unknown;
}

/* ───────────────────────── 공통 상수 ───────────────────────── */

const TEXT_COLOR = '#1f2937';
const STROKE = '#374151';
const SW = 2;
const SW_SUB = 1.5;

/** StrokeWidth enum → px 변환 */
const STROKE_WIDTH_PX: Record<string, number> = {
  [StrokeWidth.Thin]: 1,
  [StrokeWidth.Default]: 2,
  [StrokeWidth.Thick]: 3,
};
const PARTNER_OFFSET = 40;
const ZIGZAG_AMP = 6;
const ZIGZAG_PERIOD = 16;
const PARALLEL_GAP = 4;
const CUTOFF_LEN = 8;
const CUTOFF_GAP = 3;
const SLASH_LEN = 10;
const ARROW_INSET = 14; // 화살표 머리 크기만큼 지그재그 끝점 축소
const HIT_WIDTH = 16; // 클릭 가능 히트 영역 두께
const HIT_BORDER = '#44CE4B'; // 선택 하이라이트 테두리
const HIT_INNER = '#f0fdf0'; // 선택 하이라이트 내부 (거의 흰색에 가까운 연두)

/** render 함수 반환 타입 */
interface EdgeRenderResult {
  content: ReactNode;
  /** 히트/하이라이트 영역에 사용할 path d 문자열(들) */
  hitPaths: string[];
  /** 중심선 기준 양쪽으로 퍼진 최대 폭 (px). 하이라이트 두께 계산에 사용 */
  spreadWidth?: number;
}

/* ───────────────────── 유틸 함수 ──────────────────────── */

/** 법선 벡터 (dx,dy 방향의 왼쪽 수직) */
const getNormal = (
  dx: number,
  dy: number
): { nx: number; ny: number; len: number } => {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { nx: 0, ny: -1, len: 0 };
  return { nx: -dy / len, ny: dx / len, len };
};

/** 방향벡터 단위화 */
const getUnit = (
  dx: number,
  dy: number
): { ux: number; uy: number; len: number } => {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { ux: 1, uy: 0, len: 0 };
  return { ux: dx / len, uy: dy / len, len };
};

/** 오프셋된 직선 path (평행선) */
const offsetLine = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  offset: number
): string => {
  const { nx, ny } = getNormal(tx - sx, ty - sy);
  return `M ${sx + nx * offset},${sy + ny * offset} L ${tx + nx * offset},${ty + ny * offset}`;
};

/** 지그재그 polyline points 문자열
 *  endInset: 끝점을 방향벡터 반대로 줄이는 거리 (화살표 머리와 겹치지 않도록)
 */
const buildZigzagPoints = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  amp: number = ZIGZAG_AMP,
  period: number = ZIGZAG_PERIOD,
  endInset: number = 0
): string => {
  const dx = tx - sx;
  const dy = ty - sy;
  const { ux, uy, len } = getUnit(dx, dy);
  const { nx, ny } = getNormal(dx, dy);
  if (len === 0) return `${sx},${sy}`;

  const effectiveLen = Math.max(0, len - endInset);
  const ex = sx + ux * effectiveLen;
  const ey = sy + uy * effectiveLen;

  const steps = Math.max(2, Math.round(effectiveLen / period));
  const pts: string[] = [`${sx},${sy}`];
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const bx = sx + ux * effectiveLen * t;
    const by = sy + uy * effectiveLen * t;
    const sign = i % 2 === 1 ? 1 : -1;
    pts.push(`${bx + nx * sign * amp},${by + ny * sign * amp}`);
  }
  pts.push(`${ex},${ey}`);
  return pts.join(' ');
};

/* ───── Shape-Aware 계산 (Influence 노드 경계) ───── */

const getShapeInset = (
  dx: number,
  dy: number,
  halfSize: number,
  shape: NodeShape
): number => {
  if (shape === 'circle') return halfSize;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return halfSize;

  if (shape === 'rect') {
    const txx = absDx > 0 ? halfSize / absDx : Infinity;
    const tyy = absDy > 0 ? halfSize / absDy : Infinity;
    return Math.min(txx, tyy) * len;
  }

  // diamond
  const sum = absDx / len + absDy / len;
  return sum > 0 ? halfSize / sum : halfSize;
};

/** shape-aware 시작/끝 좌표 계산 */
const getShapeAwareEndpoints = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  srcHalf: number,
  tgtHalf: number,
  srcShape: NodeShape,
  tgtShape: NodeShape
): { x1: number; y1: number; x2: number; y2: number } => {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const srcInset = getShapeInset(dx, dy, srcHalf, srcShape);
  const tgtInset = getShapeInset(-dx, -dy, tgtHalf, tgtShape);

  if (len < srcInset + tgtInset) {
    return { x1: sx, y1: sy, x2: tx, y2: ty };
  }

  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: sx + ux * srcInset,
    y1: sy + uy * srcInset,
    x2: tx - ux * tgtInset,
    y2: ty - uy * tgtInset,
  };
};

/* ─────────────────── 경로 빌더 ──────────────────── */

/** Partner_Line U자 경로 */
const buildPartnerPath = (
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string => {
  const bottomY = Math.max(sy, ty) + PARTNER_OFFSET;
  return `M ${sx},${sy} V ${bottomY} H ${tx} V ${ty}`;
};

/** Children_Parents_Line 꺾임선 경로를 구성하는 꼭짓점 리스트 반환 */
const buildChildParentPoints = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  partnerMidpoint?: { x: number; y: number } | null,
  partnerSubjects?: { x1: number; x2: number } | null
): { x: number; y: number }[] => {
  if (partnerMidpoint && partnerSubjects) {
    const my = partnerMidpoint.y;
    const minX = Math.min(partnerSubjects.x1, partnerSubjects.x2);
    const maxX = Math.max(partnerSubjects.x1, partnerSubjects.x2);
    const anchorX = Math.max(minX, Math.min(maxX, targetX));

    if (anchorX === targetX) {
      return [
        { x: anchorX, y: my },
        { x: anchorX, y: targetY },
      ];
    }

    const midY = (my + targetY) / 2;
    return [
      { x: anchorX, y: my },
      { x: anchorX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ];
  }

  if (partnerMidpoint) {
    const mx = partnerMidpoint.x;
    const my = partnerMidpoint.y;
    const midY = (my + targetY) / 2;
    return [
      { x: mx, y: my },
      { x: mx, y: midY + 2 },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ];
  }

  const midY = (sourceY + targetY) / 2;
  return [
    { x: sourceX, y: sourceY },
    { x: sourceX, y: midY },
    { x: targetX, y: midY },
    { x: targetX, y: targetY },
  ];
};

/** 꼭짓점 리스트를 SVG path 문자열로 변환 */
const pointsToPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
};

/** Children_Parents_Line 꺾임선 경로 */
const buildChildParentPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  partnerMidpoint?: { x: number; y: number } | null,
  partnerSubjects?: { x1: number; x2: number } | null
): { path: string; labelX: number; labelY: number } => {
  const pts = buildChildParentPoints(
    sourceX,
    sourceY,
    targetX,
    targetY,
    partnerMidpoint,
    partnerSubjects
  );
  const path = pointsToPath(pts);
  const mid = pts.length >= 2 ? Math.floor(pts.length / 2) : 0;
  const labelX = pts.length >= 2 ? (pts[mid - 1].x + pts[mid].x) / 2 : sourceX;
  const labelY = pts.length >= 2 ? (pts[mid - 1].y + pts[mid].y) / 2 : sourceY;
  return { path, labelX, labelY };
};

/* ──────────────────── Relation 렌더 ──────────────────── */

const renderRelationEdge = (
  status: (typeof RelationStatus)[keyof typeof RelationStatus] | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  color: string,
  sw: number = SW
): EdgeRenderResult => {
  const base = { stroke: color, strokeWidth: sw, fill: 'none' as const };
  const straight = `M ${sx},${sy} L ${tx},${ty}`;

  switch (status) {
    case RelationStatus.Connected:
      return {
        content: <path d={straight} {...base} />,
        hitPaths: [straight],
      };

    case RelationStatus.Close:
      return {
        content: (
          <>
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
          </>
        ),
        hitPaths: [straight],
        spreadWidth: PARALLEL_GAP * 2 + SW,
      };

    case RelationStatus.Fused:
      return {
        content: (
          <>
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
            <path d={straight} {...base} />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
          </>
        ),
        hitPaths: [straight],
        spreadWidth: PARALLEL_GAP * 2 + SW,
      };

    case RelationStatus.Distant:
      return {
        content: <path d={straight} {...base} strokeDasharray="5,5" />,
        hitPaths: [straight],
      };

    case RelationStatus.Hostile:
      return {
        content: (
          <polyline
            points={buildZigzagPoints(sx, sy, tx, ty)}
            {...base}
            strokeLinejoin="round"
          />
        ),
        hitPaths: [straight],
        spreadWidth: ZIGZAG_AMP * 2 + sw,
      };

    case RelationStatus.Close_Hostile:
      return {
        content: (
          <>
            <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP * 2)} {...base} />
            <polyline
              points={buildZigzagPoints(sx, sy, tx, ty)}
              {...base}
              strokeLinejoin="round"
            />
            <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP * 2)} {...base} />
          </>
        ),
        hitPaths: [straight],
        spreadWidth: PARALLEL_GAP * 4 + sw,
      };

    case RelationStatus.Cutoff: {
      const dx = tx - sx;
      const dy = ty - sy;
      const { nx, ny } = getNormal(dx, dy);
      const { ux, uy, len } = getUnit(dx, dy);
      const cx = sx + ux * len * 0.5;
      const cy = sy + uy * len * 0.5;
      return {
        content: (
          <>
            <path d={straight} {...base} />
            <line
              x1={cx + ux * CUTOFF_GAP - nx * CUTOFF_LEN}
              y1={cy + uy * CUTOFF_GAP - ny * CUTOFF_LEN}
              x2={cx + ux * CUTOFF_GAP + nx * CUTOFF_LEN}
              y2={cy + uy * CUTOFF_GAP + ny * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
            <line
              x1={cx - ux * CUTOFF_GAP - nx * CUTOFF_LEN}
              y1={cy - uy * CUTOFF_GAP - ny * CUTOFF_LEN}
              x2={cx - ux * CUTOFF_GAP + nx * CUTOFF_LEN}
              y2={cy - uy * CUTOFF_GAP + ny * CUTOFF_LEN}
              stroke={color}
              strokeWidth={SW}
              strokeLinecap="round"
            />
          </>
        ),
        hitPaths: [straight],
        spreadWidth: CUTOFF_LEN * 2 + SW,
      };
    }

    default:
      return {
        content: <path d={straight} {...base} />,
        hitPaths: [straight],
      };
  }
};

/* ──────────────────── Influence 렌더 ──────────────────── */

const renderInfluenceEdge = (
  id: string,
  status: (typeof InfluenceStatus)[keyof typeof InfluenceStatus] | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  srcHalf: number,
  tgtHalf: number,
  srcShape: NodeShape,
  tgtShape: NodeShape,
  color: string,
  sw: number = SW
): EdgeRenderResult => {
  const { x1, y1, x2, y2 } = getShapeAwareEndpoints(
    sx,
    sy,
    tx,
    ty,
    srcHalf,
    tgtHalf,
    srcShape,
    tgtShape
  );

  const base = { stroke: color, strokeWidth: sw, fill: 'none' as const };
  const filledMarkerId = `arrow-filled-${id}`;
  const emptyMarkerId = `arrow-empty-${id}`;

  const filledMarker = (
    <marker
      id={filledMarkerId}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="16"
      markerHeight="16"
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
    </marker>
  );

  const emptyMarker = (
    <marker
      id={emptyMarkerId}
      viewBox="-1 -1 13 12"
      refX="10"
      refY="5"
      markerWidth="16"
      markerHeight="16"
      markerUnits="userSpaceOnUse"
      orient="auto-start-reverse"
    >
      <path
        d="M 0 0 L 10 5 L 0 10 z"
        fill="#ffffff"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
    </marker>
  );

  const guideLine = `M ${x1},${y1} L ${x2},${y2}`;

  switch (status) {
    case InfluenceStatus.Physical_Abuse:
      return {
        content: (
          <>
            <defs>{filledMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                x1,
                y1,
                x2,
                y2,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...base}
              strokeLinejoin="round"
            />
            <path
              d={guideLine}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
        spreadWidth: ZIGZAG_AMP * 2 + sw,
      };

    case InfluenceStatus.Emotional_Abuse:
      return {
        content: (
          <>
            <defs>{emptyMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                x1,
                y1,
                x2,
                y2,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...base}
              strokeLinejoin="round"
            />
            <path
              d={guideLine}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${emptyMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
        spreadWidth: ZIGZAG_AMP * 2 + sw,
      };

    case InfluenceStatus.Sexual_Abuse:
      return {
        content: (
          <>
            <defs>{filledMarker}</defs>
            <path d={offsetLine(x1, y1, x2, y2, -PARALLEL_GAP * 2)} {...base} />
            <polyline
              points={buildZigzagPoints(
                x1,
                y1,
                x2,
                y2,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...base}
              strokeLinejoin="round"
            />
            <path d={offsetLine(x1, y1, x2, y2, PARALLEL_GAP * 2)} {...base} />
            <path
              d={guideLine}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
        spreadWidth: PARALLEL_GAP * 4 + sw,
      };

    case InfluenceStatus.Focused_On:
      return {
        content: (
          <>
            <defs>{filledMarker}</defs>
            <path
              d={guideLine}
              {...base}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
      };

    case InfluenceStatus.Focused_On_Negatively:
      return {
        content: (
          <>
            <defs>{filledMarker}</defs>
            <polyline
              points={buildZigzagPoints(
                x1,
                y1,
                x2,
                y2,
                ZIGZAG_AMP,
                ZIGZAG_PERIOD,
                ARROW_INSET
              )}
              {...base}
              strokeLinejoin="round"
            />
            <path d={guideLine} {...base} />
            <path
              d={guideLine}
              fill="none"
              stroke={color}
              strokeWidth={1}
              strokeOpacity={0}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
        spreadWidth: ZIGZAG_AMP * 2 + sw,
      };

    default:
      return {
        content: (
          <>
            <defs>{filledMarker}</defs>
            <path
              d={guideLine}
              {...base}
              markerEnd={`url(#${filledMarkerId})`}
            />
          </>
        ),
        hitPaths: [guideLine],
      };
  }
};

/* ──────────────────── Partner 렌더 ──────────────────── */

const renderPartnerEdge = (
  status: (typeof PartnerStatus)[keyof typeof PartnerStatus] | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  color: string,
  sw: number = SW
): EdgeRenderResult => {
  const bottomY = Math.max(sy, ty) + PARTNER_OFFSET;
  const midX = (sx + tx) / 2;
  const uPath = buildPartnerPath(sx, sy, tx, ty);
  const base = { stroke: color, strokeWidth: sw, fill: 'none' as const };

  switch (status) {
    case PartnerStatus.Marriage:
      return { content: <path d={uPath} {...base} />, hitPaths: [uPath] };

    case PartnerStatus.Marital_Separation:
      return {
        content: (
          <>
            <path d={uPath} {...base} />
            <line
              x1={midX - SLASH_LEN / 2}
              y1={bottomY + SLASH_LEN / 2}
              x2={midX + SLASH_LEN / 2}
              y2={bottomY - SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
          </>
        ),
        hitPaths: [uPath],
      };

    case PartnerStatus.Divorce:
      return {
        content: (
          <>
            <path d={uPath} {...base} />
            <line
              x1={midX - 2 - SLASH_LEN / 2}
              y1={bottomY + SLASH_LEN / 2}
              x2={midX - 2 + SLASH_LEN / 2}
              y2={bottomY - SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
            <line
              x1={midX + 2 - SLASH_LEN / 2}
              y1={bottomY + SLASH_LEN / 2}
              x2={midX + 2 + SLASH_LEN / 2}
              y2={bottomY - SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
          </>
        ),
        hitPaths: [uPath],
      };

    case PartnerStatus.Remarriage:
      return {
        content: (
          <>
            <path d={uPath} {...base} />
            <line
              x1={midX - 2 - SLASH_LEN / 2}
              y1={bottomY + SLASH_LEN / 2}
              x2={midX - 2 + SLASH_LEN / 2}
              y2={bottomY - SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
            <line
              x1={midX + 2 - SLASH_LEN / 2}
              y1={bottomY + SLASH_LEN / 2}
              x2={midX + 2 + SLASH_LEN / 2}
              y2={bottomY - SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
            <line
              x1={midX - SLASH_LEN / 2}
              y1={bottomY - SLASH_LEN / 2}
              x2={midX + SLASH_LEN / 2}
              y2={bottomY + SLASH_LEN / 2}
              stroke={color}
              strokeWidth={SW_SUB}
            />
          </>
        ),
        hitPaths: [uPath],
      };

    case PartnerStatus.Couple_Relationship:
      return {
        content: (
          <>
            <path d={`M ${sx},${sy} V ${bottomY}`} {...base} />
            <path d={`M ${tx},${ty} V ${bottomY}`} {...base} />
            <path
              d={`M ${sx},${bottomY} H ${tx}`}
              {...base}
              strokeDasharray="4,4"
            />
          </>
        ),
        hitPaths: [uPath],
      };

    case PartnerStatus.Secret_Affair: {
      const triSize = 6;
      return {
        content: (
          <>
            <path d={`M ${sx},${sy} V ${bottomY}`} {...base} />
            <path d={`M ${tx},${ty} V ${bottomY}`} {...base} />
            <path
              d={`M ${sx},${bottomY} H ${tx}`}
              {...base}
              strokeDasharray="4,4"
            />
            <polygon
              points={`${midX},${bottomY - triSize} ${midX + triSize * 0.6},${bottomY - 1} ${midX - triSize * 0.6},${bottomY - 1}`}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
          </>
        ),
        hitPaths: [uPath],
      };
    }

    default:
      return { content: <path d={uPath} {...base} />, hitPaths: [uPath] };
  }
};

/* ─────────────── Children_Parents 렌더 ─────────────── */

const renderChildParentEdge = (
  status:
    | (typeof ParentChildStatus)[keyof typeof ParentChildStatus]
    | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  color: string,
  partnerMidpoint?: { x: number; y: number } | null,
  partnerSubjects?: { x1: number; x2: number } | null,
  sw: number = SW,
  twinTargetPosition?: { x: number; y: number } | null
): EdgeRenderResult => {
  const base = { stroke: color, strokeWidth: sw, fill: 'none' as const };
  const { path } = buildChildParentPath(
    sx,
    sy,
    tx,
    ty,
    partnerMidpoint,
    partnerSubjects
  );

  switch (status) {
    case ParentChildStatus.Foster_Child:
      return {
        content: <path d={path} {...base} strokeDasharray="5,5" />,
        hitPaths: [path],
      };

    case ParentChildStatus.Adopted_Child: {
      const gap = 2.5;
      return {
        content: (
          <>
            <path d={path} {...base} transform={`translate(${-gap}, 0)`} />
            <path
              d={path}
              {...base}
              strokeDasharray="4,3"
              transform={`translate(${gap}, 0)`}
            />
          </>
        ),
        hitPaths: [path],
      };
    }

    case ParentChildStatus.Twins:
    case ParentChildStatus.Identical_Twins: {
      if (!twinTargetPosition) {
        // 쌍둥이 데이터가 없으면 일반 선으로 폴백
        return { content: <path d={path} {...base} />, hitPaths: [path] };
      }

      // 부모 기준점 계산 (partnerMidpoint 또는 source)
      const parentY = partnerMidpoint ? partnerMidpoint.y : sy;
      let parentX: number;
      if (partnerMidpoint && partnerSubjects) {
        const minX = Math.min(partnerSubjects.x1, partnerSubjects.x2);
        const maxX = Math.max(partnerSubjects.x1, partnerSubjects.x2);
        const childMidX = (tx + twinTargetPosition.x) / 2;
        parentX = Math.max(minX, Math.min(maxX, childMidX));
      } else if (partnerMidpoint) {
        parentX = partnerMidpoint.x;
      } else {
        parentX = sx;
      }

      const child1X = tx;
      const child1Y = ty;
      const child2X = twinTargetPosition.x;
      const child2Y = twinTargetPosition.y;

      // 부모에서 바로 두 자녀로 대각선 (수직 stem 없음)
      const leg1Path = `M ${parentX},${parentY} L ${child1X},${child1Y}`;
      const leg2Path = `M ${parentX},${parentY} L ${child2X},${child2Y}`;

      const allPaths = [leg1Path, leg2Path];

      if (status === ParentChildStatus.Identical_Twins) {
        // 일란성: 두 대각선 중간에 가로 바
        const barY = (parentY + Math.min(child1Y, child2Y)) / 2;
        const t1 =
          child1Y === parentY ? 0 : (barY - parentY) / (child1Y - parentY);
        const barX1 = parentX + (child1X - parentX) * t1;
        const t2 =
          child2Y === parentY ? 0 : (barY - parentY) / (child2Y - parentY);
        const barX2 = parentX + (child2X - parentX) * t2;
        const barPath = `M ${barX1},${barY} L ${barX2},${barY}`;
        allPaths.push(barPath);
      }

      const combinedPath = allPaths.join(' ');
      return {
        content: <path d={combinedPath} {...base} />,
        hitPaths: allPaths,
      };
    }

    case ParentChildStatus.Biological_Child:
    case ParentChildStatus.Miscarriage:
    case ParentChildStatus.Abortion:
    case ParentChildStatus.Pregnancy:
    default:
      return { content: <path d={path} {...base} />, hitPaths: [path] };
  }
};

/* ─────────────── 메인 컴포넌트 ─────────────── */

export const RelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: _sourcePosition,
    targetPosition: _targetPosition,
    data,
    selected,
  }: EdgeProps) => {
    const edgeData = (data || {}) as RelationshipEdgeData;
    const {
      connectionType,
      partnerStatus,
      relationStatus,
      influenceStatus,
      parentChildStatus,
      partnerDetail,
      label,
      sourceSizePx,
      targetSizePx,
      sourceShape,
      targetShape,
      partnerMidpoint,
      partnerSubjects,
      twinTargetPosition,
      strokeColor: dataStrokeColor,
      strokeWidth: dataStrokeWidth,
      textColor: dataTextColor,
    } = edgeData;
    const ct = connectionType || ConnectionType.Partner_Line;

    const baseColor = dataStrokeColor || STROKE;
    const baseSw = STROKE_WIDTH_PX[dataStrokeWidth ?? ''] ?? SW;
    const baseTxtColor = dataTextColor || TEXT_COLOR;

    let renderResult: EdgeRenderResult;
    let labelX: number;
    let labelY: number;

    switch (ct) {
      case ConnectionType.Partner_Line: {
        renderResult = renderPartnerEdge(
          partnerStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor,
          baseSw
        );
        labelX = (sourceX + targetX) / 2;
        labelY = Math.max(sourceY, targetY) + PARTNER_OFFSET;
        break;
      }

      case ConnectionType.Children_Parents_Line: {
        renderResult = renderChildParentEdge(
          parentChildStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor,
          partnerMidpoint,
          partnerSubjects,
          baseSw,
          twinTargetPosition
        );
        const result = buildChildParentPath(
          sourceX,
          sourceY,
          targetX,
          targetY,
          partnerMidpoint,
          partnerSubjects
        );
        labelX = result.labelX;
        labelY = result.labelY;
        break;
      }

      case ConnectionType.Influence_Line: {
        const srcHalf = (sourceSizePx ?? DEFAULT_NODE_SIZE) / 2;
        const tgtHalf = (targetSizePx ?? DEFAULT_NODE_SIZE) / 2;
        renderResult = renderInfluenceEdge(
          id,
          influenceStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          srcHalf,
          tgtHalf,
          sourceShape ?? 'circle',
          targetShape ?? 'circle',
          baseColor,
          baseSw
        );
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }

      case ConnectionType.Relation_Line:
      default: {
        renderResult = renderRelationEdge(
          relationStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor,
          baseSw
        );
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }
    }

    const { content, hitPaths, spreadWidth } = renderResult;
    const hitW = Math.max(HIT_WIDTH, (spreadWidth ?? 0) + 8);

    return (
      <>
        {/* 히트 영역: 투명한 두꺼운 path (클릭 가능 영역 확대) */}
        {hitPaths.map((hp, i) => (
          <path
            key={`hit-${i}`}
            d={hp}
            fill="none"
            stroke="transparent"
            strokeWidth={hitW}
            style={{ pointerEvents: 'stroke' }}
          />
        ))}

        {/* 선택 하이라이트: 테두리 → 반투명 채움 순서 */}
        {selected &&
          hitPaths.map((hp, i) => (
            <g key={`hl-${i}`} style={{ pointerEvents: 'none' }}>
              <path
                d={hp}
                fill="none"
                stroke={HIT_BORDER}
                strokeWidth={hitW + 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={0.45}
              />
              <path
                d={hp}
                fill="none"
                stroke={HIT_INNER}
                strokeWidth={hitW}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

        {content}

        {/* 파트너 날짜 라벨 (U자 안쪽 바닥 중앙) */}
        {ct === ConnectionType.Partner_Line &&
          partnerDetail &&
          (() => {
            const parts: string[] = [];
            const toYear = (d: string) => d.slice(0, 4);

            const { showMarried, showDivorced, showReunited, showRelStart } =
              partnerStatus
                ? getPartnerDateVisibility(partnerStatus)
                : {
                    showMarried: false,
                    showDivorced: false,
                    showReunited: false,
                    showRelStart: false,
                  };

            if (showMarried && partnerDetail.marriedDate)
              parts.push(`m.${toYear(partnerDetail.marriedDate)}`);
            if (showDivorced && partnerDetail.divorcedDate)
              parts.push(`d.${toYear(partnerDetail.divorcedDate)}`);
            if (showReunited && partnerDetail.reunitedDate)
              parts.push(`r.${toYear(partnerDetail.reunitedDate)}`);
            if (showRelStart && partnerDetail.relationshipStartDate)
              parts.push(`s.${toYear(partnerDetail.relationshipStartDate)}`);

            if (parts.length === 0) return null;

            return (
              <EdgeLabelRenderer>
                <div
                  className="nodrag nopan pointer-events-none absolute text-xs"
                  style={{
                    transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 6}px)`,
                    color: baseTxtColor,
                    textShadow:
                      '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff, 0 -1px 0 #fff, 0 1px 0 #fff, -1px 0 0 #fff, 1px 0 0 #fff',
                  }}
                >
                  {parts.join('  ')}
                </div>
              </EdgeLabelRenderer>
            );
          })()}

        {label && (
          <EdgeLabelRenderer>
            <div
              className="nodrag nopan pointer-events-auto absolute rounded bg-white px-2 py-0.5 text-xs text-fg-muted shadow-sm"
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              }}
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  }
);

RelationshipEdge.displayName = 'RelationshipEdge';
