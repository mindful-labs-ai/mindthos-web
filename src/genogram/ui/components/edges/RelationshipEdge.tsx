import { memo, type ReactNode } from 'react';

import { EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

import {
  ConnectionType,
  InfluenceStatus,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

import { DEFAULT_NODE_SIZE } from '../../constants/grid';

/* ───────────────────────────── Types ───────────────────────────── */

/** 노드 도형 타입 */
export type NodeShape = 'circle' | 'rect' | 'diamond';

export interface RelationshipEdgeData {
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType];
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus];
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  influenceStatus?: (typeof InfluenceStatus)[keyof typeof InfluenceStatus];
  parentChildStatus?: (typeof ParentChildStatus)[keyof typeof ParentChildStatus];
  label?: string;
  sourceSizePx?: number;
  targetSizePx?: number;
  sourceShape?: NodeShape;
  targetShape?: NodeShape;
  partnerMidpoint?: { x: number; y: number } | null;
  partnerSubjects?: { x1: number; x2: number } | null;
  [key: string]: unknown;
}

/* ───────────────────────── 공통 상수 ───────────────────────── */

const STROKE = '#374151';
const SW = 2;
const SW_SUB = 1.5;
const PARTNER_OFFSET = 40;
const ZIGZAG_AMP = 6;
const ZIGZAG_PERIOD = 16;
const PARALLEL_GAP = 4;
const CUTOFF_LEN = 8;
const CUTOFF_GAP = 3;
const SLASH_LEN = 10;
const ARROW_INSET = 14; // 화살표 머리 크기만큼 지그재그 끝점 축소

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

/** Children_Parents_Line 꺾임선 경로 */
const buildChildParentPath = (
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  partnerMidpoint?: { x: number; y: number } | null,
  partnerSubjects?: { x1: number; x2: number } | null
): { path: string; labelX: number; labelY: number } => {
  if (partnerMidpoint && partnerSubjects) {
    const my = partnerMidpoint.y;
    const minX = Math.min(partnerSubjects.x1, partnerSubjects.x2);
    const maxX = Math.max(partnerSubjects.x1, partnerSubjects.x2);
    const anchorX = Math.max(minX, Math.min(maxX, targetX));

    if (anchorX === targetX) {
      return {
        path: `M ${anchorX},${my} V ${targetY}`,
        labelX: anchorX,
        labelY: (my + targetY) / 2,
      };
    }

    const midY = (my + targetY) / 2;
    return {
      path: `M ${anchorX},${my} V ${midY} H ${targetX} V ${targetY}`,
      labelX: (anchorX + targetX) / 2,
      labelY: midY,
    };
  }

  if (partnerMidpoint) {
    const mx = partnerMidpoint.x;
    const my = partnerMidpoint.y;
    const midY = (my + targetY) / 2;
    return {
      path: `M ${mx},${my} V ${midY} H ${targetX} V ${targetY}`,
      labelX: (mx + targetX) / 2,
      labelY: midY,
    };
  }

  const midY = (sourceY + targetY) / 2;
  return {
    path: `M ${sourceX},${sourceY} V ${midY} H ${targetX} V ${targetY}`,
    labelX: (sourceX + targetX) / 2,
    labelY: midY,
  };
};

/* ──────────────────── Relation 렌더 ──────────────────── */

const renderRelationEdge = (
  status: (typeof RelationStatus)[keyof typeof RelationStatus] | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  color: string
): ReactNode => {
  const base = { stroke: color, strokeWidth: SW, fill: 'none' as const };

  switch (status) {
    case RelationStatus.Connected:
      return <path d={`M ${sx},${sy} L ${tx},${ty}`} {...base} />;

    case RelationStatus.Close:
      return (
        <>
          <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
          <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
        </>
      );

    case RelationStatus.Fused:
      return (
        <>
          <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP)} {...base} />
          <path d={`M ${sx},${sy} L ${tx},${ty}`} {...base} />
          <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP)} {...base} />
        </>
      );

    case RelationStatus.Distant:
      return (
        <path
          d={`M ${sx},${sy} L ${tx},${ty}`}
          {...base}
          strokeDasharray="5,5"
        />
      );

    case RelationStatus.Hostile:
      return (
        <polyline
          points={buildZigzagPoints(sx, sy, tx, ty)}
          {...base}
          strokeWidth={SW_SUB}
          strokeLinejoin="round"
        />
      );

    case RelationStatus.Close_Hostile:
      return (
        <>
          <path d={offsetLine(sx, sy, tx, ty, -PARALLEL_GAP * 2)} {...base} />
          <polyline
            points={buildZigzagPoints(sx, sy, tx, ty)}
            {...base}
            strokeWidth={SW_SUB}
            strokeLinejoin="round"
          />
          <path d={offsetLine(sx, sy, tx, ty, PARALLEL_GAP * 2)} {...base} />
        </>
      );

    case RelationStatus.Cutoff: {
      const dx = tx - sx;
      const dy = ty - sy;
      const { nx, ny } = getNormal(dx, dy);
      const { ux, uy, len } = getUnit(dx, dy);
      const cx = sx + ux * len * 0.5;
      const cy = sy + uy * len * 0.5;
      return (
        <>
          <path d={`M ${sx},${sy} L ${tx},${ty}`} {...base} />
          {/* 커팅 마크 2개 (법선 방향으로 살짝 분리) */}
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
      );
    }

    default:
      return <path d={`M ${sx},${sy} L ${tx},${ty}`} {...base} />;
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
  color: string
): ReactNode => {
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

  const base = { stroke: color, strokeWidth: SW, fill: 'none' as const };
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
      orient="auto-start-reverse"
    >
      <path
        d="M 0 0 L 10 5 L 0 10 z"
        fill="#ffffff"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </marker>
  );

  // 투명 가이드 직선 (화살표 방향 기준용, 지그재그 끝 방향에 영향받지 않음)
  const guideLine = `M ${x1},${y1} L ${x2},${y2}`;

  switch (status) {
    // 신체적 학대: 지그재그 + 채워진 화살표
    case InfluenceStatus.Physical_Abuse:
      return (
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
            strokeWidth={SW_SUB}
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
      );

    // 정신적 학대: 지그재그 + 빈 화살표
    case InfluenceStatus.Emotional_Abuse:
      return (
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
            strokeWidth={SW_SUB}
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
      );

    // 성적 학대: 평행선 2개 + 지그재그 + 채워진 화살표 (투명 중심선에 화살표)
    case InfluenceStatus.Sexual_Abuse:
      return (
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
            strokeWidth={SW_SUB}
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
      );

    // 집중됨: 직선 + 채워진 화살표
    case InfluenceStatus.Focused_On:
      return (
        <>
          <defs>{filledMarker}</defs>
          <path d={guideLine} {...base} markerEnd={`url(#${filledMarkerId})`} />
        </>
      );

    // 부정적 집중: 지그재그 + 직선 겹침 (동일 중심선) + 채워진 화살표
    case InfluenceStatus.Focused_On_Negatively:
      return (
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
            strokeWidth={SW_SUB}
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
      );

    // 기본: 직선 + 채워진 화살표
    default:
      return (
        <>
          <defs>{filledMarker}</defs>
          <path d={guideLine} {...base} markerEnd={`url(#${filledMarkerId})`} />
        </>
      );
  }
};

/* ──────────────────── Partner 렌더 ──────────────────── */

const renderPartnerEdge = (
  status: (typeof PartnerStatus)[keyof typeof PartnerStatus] | undefined,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  color: string
): ReactNode => {
  const bottomY = Math.max(sy, ty) + PARTNER_OFFSET;
  const midX = (sx + tx) / 2;
  const uPath = buildPartnerPath(sx, sy, tx, ty);
  const base = { stroke: color, strokeWidth: SW, fill: 'none' as const };

  switch (status) {
    // 결혼: U자 실선
    case PartnerStatus.Marriage:
      return <path d={uPath} {...base} />;

    // 별거: U자 + 사선 1개
    case PartnerStatus.Marital_Separation:
      return (
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
      );

    // 이혼: U자 + 사선 2개
    case PartnerStatus.Divorce:
      return (
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
      );

    // 재결합: U자 + 사선 2개 + 역방향 사선 1개
    case PartnerStatus.Remarriage:
      return (
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
      );

    // 연애: 수직 실선 2개 + 수평 점선
    case PartnerStatus.Couple_Relationship:
      return (
        <>
          <path d={`M ${sx},${sy} V ${bottomY}`} {...base} />
          <path d={`M ${tx},${ty} V ${bottomY}`} {...base} />
          <path
            d={`M ${sx},${bottomY} H ${tx}`}
            {...base}
            strokeDasharray="4,4"
          />
        </>
      );

    // 비밀 연애: 수직 실선 2개 + 수평 점선 + 삼각형
    case PartnerStatus.Secret_Affair: {
      const triSize = 6;
      return (
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
      );
    }

    // 기본
    default:
      return <path d={uPath} {...base} />;
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
  partnerSubjects?: { x1: number; x2: number } | null
): ReactNode => {
  const base = { stroke: color, strokeWidth: SW, fill: 'none' as const };
  const { path } = buildChildParentPath(
    sx,
    sy,
    tx,
    ty,
    partnerMidpoint,
    partnerSubjects
  );

  switch (status) {
    // 위탁자녀: 점선
    case ParentChildStatus.Foster_Child:
      return <path d={path} {...base} strokeDasharray="5,5" />;

    // 입양자녀: 이중선 (실선 + 점선)
    case ParentChildStatus.Adopted_Child: {
      // 꺾임 path를 그대로 2번 그리되 약간의 수평 offset
      const gap = 2.5;
      return (
        <>
          <path d={path} {...base} transform={`translate(${-gap}, 0)`} />
          <path
            d={path}
            {...base}
            strokeDasharray="4,3"
            transform={`translate(${gap}, 0)`}
          />
        </>
      );
    }

    // Twins, Identical_Twins: 현재 childRef가 단일 UUID이므로 일반 선으로 처리
    // (쌍둥이는 복합 커맨드로 2개 연결선이 생성되므로 개별 선은 일반과 동일)
    case ParentChildStatus.Twins:
    case ParentChildStatus.Identical_Twins:
    case ParentChildStatus.Biological_Child:
    case ParentChildStatus.Miscarriage:
    case ParentChildStatus.Abortion:
    case ParentChildStatus.Pregnancy:
    default:
      return <path d={path} {...base} />;
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
      label,
      sourceSizePx,
      targetSizePx,
      sourceShape,
      targetShape,
      partnerMidpoint,
      partnerSubjects,
    } = edgeData;
    const ct = connectionType || ConnectionType.Partner_Line;

    const baseColor = selected ? '#3b82f6' : STROKE;

    let edgeContent: ReactNode;
    let labelX: number;
    let labelY: number;

    switch (ct) {
      case ConnectionType.Partner_Line: {
        edgeContent = renderPartnerEdge(
          partnerStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor
        );
        labelX = (sourceX + targetX) / 2;
        labelY = Math.max(sourceY, targetY) + PARTNER_OFFSET;
        break;
      }

      case ConnectionType.Children_Parents_Line: {
        edgeContent = renderChildParentEdge(
          parentChildStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor,
          partnerMidpoint,
          partnerSubjects
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
        edgeContent = renderInfluenceEdge(
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
          baseColor
        );
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }

      case ConnectionType.Relation_Line:
      case ConnectionType.Group_Line:
      default: {
        edgeContent = renderRelationEdge(
          relationStatus,
          sourceX,
          sourceY,
          targetX,
          targetY,
          baseColor
        );
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }
    }

    return (
      <>
        {edgeContent}

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
