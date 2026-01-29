import { memo } from 'react';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

import {
  ConnectionType,
  PartnerStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';
import type { InfluenceStatus } from '@/genogram/core/types/enums';

export interface RelationshipEdgeData {
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType];
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus];
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus];
  influenceStatus?: InfluenceStatus;
  label?: string;
  [key: string]: unknown;
}

const getEdgeStyle = (
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType],
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus],
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus]
): { stroke: string; strokeWidth: number; strokeDasharray?: string } => {
  const baseStyle = { stroke: '#374151', strokeWidth: 2 };

  if (connectionType === ConnectionType.Partner_Line) {
    switch (partnerStatus) {
      case PartnerStatus.Marriage:
        return { ...baseStyle, strokeWidth: 2 };
      case PartnerStatus.Divorce:
        return { ...baseStyle, strokeDasharray: '5,5' };
      case PartnerStatus.Marital_Separation:
        return { ...baseStyle, strokeDasharray: '10,5' };
      case PartnerStatus.Couple_Relationship:
        return { ...baseStyle, strokeDasharray: '2,2' };
      default:
        return baseStyle;
    }
  }

  if (connectionType === ConnectionType.Children_Parents_Line) {
    return baseStyle;
  }

  if (connectionType === ConnectionType.Relation_Line) {
    switch (relationStatus) {
      case RelationStatus.Close:
        return { stroke: '#22c55e', strokeWidth: 2 };
      case RelationStatus.Fused:
        return { stroke: '#22c55e', strokeWidth: 3 };
      case RelationStatus.Distant:
        return { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' };
      case RelationStatus.Hostile:
        return { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '8,4' };
      case RelationStatus.Close_Hostile:
        return { stroke: '#ef4444', strokeWidth: 2 };
      default:
        return { ...baseStyle, stroke: '#6b7280' };
    }
  }

  if (connectionType === ConnectionType.Influence_Line) {
    return { stroke: '#dc2626', strokeWidth: 3 };
  }

  return baseStyle;
};

export const RelationshipEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    selected,
  }: EdgeProps) => {
    const edgeData = (data || {}) as RelationshipEdgeData;
    const { connectionType, partnerStatus, relationStatus, label } = edgeData;

    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 8,
    });

    const style = getEdgeStyle(
      connectionType || ConnectionType.Partner_Line,
      partnerStatus,
      relationStatus
    );

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{
            ...style,
            stroke: selected ? '#3b82f6' : style.stroke,
          }}
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
