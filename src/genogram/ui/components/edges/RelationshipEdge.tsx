import { memo } from 'react';

import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

import { ConnectionType } from '@/genogram/core/types/enums';
import type {
  InfluenceStatus,
  PartnerStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

import { DEFAULT_NODE_SIZE } from '../../constants/grid';
import { getEdgeStyle } from '../../utils/edge-style';

/** 노드 도형 타입 */
export type NodeShape = 'circle' | 'rect' | 'diamond';

export interface RelationshipEdgeData {
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType];
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus];
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  influenceStatus?: InfluenceStatus;
  label?: string;
  sourceSizePx?: number;
  targetSizePx?: number;
  sourceShape?: NodeShape;
  targetShape?: NodeShape;
  partnerMidpoint?: { x: number; y: number } | null;
  partnerSubjects?: { x1: number; x2: number } | null;
  [key: string]: unknown;
}

/** Partner_Line: U자 꺾임선 (양쪽 하단에서 아래로 내려갔다 수평 연결) */
const buildPartnerPath = (
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string => {
  const offset = 40;
  const bottomY = Math.max(sy, ty) + offset;
  return `M ${sx},${sy} V ${bottomY} H ${tx} V ${ty}`;
};

/**
 * Children_Parents_Line 경로.
 */
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
      const path = `M ${anchorX},${my} V ${targetY}`;
      return { path, labelX: anchorX, labelY: (my + targetY) / 2 };
    }

    const midY = (my + targetY) / 2;
    const path = `M ${anchorX},${my} V ${midY} H ${targetX} V ${targetY}`;
    return { path, labelX: (anchorX + targetX) / 2, labelY: midY };
  }

  if (partnerMidpoint) {
    const mx = partnerMidpoint.x;
    const my = partnerMidpoint.y;
    const midY = (my + targetY) / 2;
    const path = `M ${mx},${my} V ${midY} H ${targetX} V ${targetY}`;
    return { path, labelX: (mx + targetX) / 2, labelY: midY };
  }

  const midY = (sourceY + targetY) / 2;
  const path = `M ${sourceX},${sourceY} V ${midY} H ${targetX} V ${targetY}`;
  return { path, labelX: (sourceX + targetX) / 2, labelY: midY };
};

/**
 * 도형 경계 교차점까지의 거리를 계산.
 * - circle: 반지름
 * - rect: 각도에 따라 사각형 변과의 교차점 (대각선일 때 모퉁이에 잘리지 않도록)
 * - diamond: 각도에 따라 다이아몬드 변과의 교차점
 */
const getShapeInset = (
  dx: number,
  dy: number,
  halfSize: number,
  shape: NodeShape
): number => {
  if (shape === 'circle') {
    return halfSize;
  }

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return halfSize;

  if (shape === 'rect') {
    // 사각형: 중심에서 (dx, dy) 방향으로 사각형 변과의 교차점까지 거리
    // halfSize = 사각형 반변 길이
    // t = min(halfSize / |dx|, halfSize / |dy|) → 교차점 = center + t * (dx, dy)
    const tx = absDx > 0 ? halfSize / absDx : Infinity;
    const ty = absDy > 0 ? halfSize / absDy : Infinity;
    const t = Math.min(tx, ty);
    return t * len;
  }

  // diamond: 중심에서 다이아몬드 변과의 교차점까지 거리
  // 다이아몬드 변의 방정식: |x|/halfSize + |y|/halfSize = 1
  // 방향벡터 (dx/len, dy/len)로 t를 구하면: t = halfSize / (|dx/len| + |dy/len|)
  const sum = absDx / len + absDy / len;
  return sum > 0 ? halfSize / sum : halfSize;
};

/**
 * shape-aware 직선 경로.
 * 도형 종류에 따라 경계 교차점을 계산하여 노드에 가려지지 않게 한다.
 */
const buildShapeAwarePath = (
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  srcHalf: number,
  tgtHalf: number,
  srcShape: NodeShape,
  tgtShape: NodeShape
): string => {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const srcInset = getShapeInset(dx, dy, srcHalf, srcShape);
  const tgtInset = getShapeInset(-dx, -dy, tgtHalf, tgtShape);

  if (len < srcInset + tgtInset) {
    return `M ${sx},${sy} L ${tx},${ty}`;
  }

  const ux = dx / len;
  const uy = dy / len;
  return `M ${sx + ux * srcInset},${sy + uy * srcInset} L ${tx - ux * tgtInset},${ty - uy * tgtInset}`;
};

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
      label,
      sourceSizePx,
      targetSizePx,
      sourceShape,
      targetShape,
      partnerMidpoint,
      partnerSubjects,
    } = edgeData;
    const ct = connectionType || ConnectionType.Partner_Line;

    const style = getEdgeStyle(ct, partnerStatus, relationStatus);
    const strokeColor = selected ? '#3b82f6' : style.stroke;

    let edgePath: string;
    let labelX: number;
    let labelY: number;

    switch (ct) {
      case ConnectionType.Partner_Line: {
        edgePath = buildPartnerPath(sourceX, sourceY, targetX, targetY);
        labelX = (sourceX + targetX) / 2;
        labelY = Math.max(sourceY, targetY) + 40;
        break;
      }

      case ConnectionType.Children_Parents_Line: {
        const result = buildChildParentPath(
          sourceX,
          sourceY,
          targetX,
          targetY,
          partnerMidpoint,
          partnerSubjects
        );
        edgePath = result.path;
        labelX = result.labelX;
        labelY = result.labelY;
        break;
      }

      case ConnectionType.Influence_Line: {
        // Influence만 노드 경계에서 끊어서 화살표가 보이게
        const srcHalf = (sourceSizePx ?? DEFAULT_NODE_SIZE) / 2;
        const tgtHalf = (targetSizePx ?? DEFAULT_NODE_SIZE) / 2;
        edgePath = buildShapeAwarePath(
          sourceX,
          sourceY,
          targetX,
          targetY,
          srcHalf,
          tgtHalf,
          sourceShape ?? 'circle',
          targetShape ?? 'circle'
        );
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }

      case ConnectionType.Relation_Line:
      case ConnectionType.Group_Line:
      default: {
        // 끊김 없는 직선 (노드 중심 간)
        edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
        break;
      }
    }

    const isInfluence = ct === ConnectionType.Influence_Line;
    const markerId = `arrow-${id}`;

    return (
      <>
        {isInfluence && (
          <defs>
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="8"
              markerHeight="8"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
            </marker>
          </defs>
        )}

        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            ...style,
            stroke: strokeColor,
          }}
          markerEnd={isInfluence ? `url(#${markerId})` : undefined}
        />

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
