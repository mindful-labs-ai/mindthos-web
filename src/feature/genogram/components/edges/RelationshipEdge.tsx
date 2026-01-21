import React, { memo } from 'react';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';

import {
  EmotionalStatus,
  PartnerStatus,
  RelationType,
} from '@/genogram/core/types/enums';

export interface RelationshipEdgeData {
  relationType: RelationType;
  partnerStatus?: PartnerStatus;
  emotionalStatus?: EmotionalStatus;
  label?: string;
  [key: string]: unknown;
}

const getEdgeStyle = (
  relationType: RelationType,
  partnerStatus?: PartnerStatus,
  emotionalStatus?: EmotionalStatus
): { stroke: string; strokeWidth: number; strokeDasharray?: string } => {
  const baseStyle = { stroke: '#374151', strokeWidth: 2 };

  if (relationType === RelationType.Partner) {
    switch (partnerStatus) {
      case PartnerStatus.Married:
        return { ...baseStyle, strokeWidth: 2 };
      case PartnerStatus.Divorced:
        return { ...baseStyle, strokeDasharray: '5,5' };
      case PartnerStatus.Separated:
        return { ...baseStyle, strokeDasharray: '10,5' };
      case PartnerStatus.Dating:
        return { ...baseStyle, strokeDasharray: '2,2' };
      default:
        return baseStyle;
    }
  }

  if (relationType === RelationType.Child) {
    return baseStyle;
  }

  if (relationType === RelationType.Emotional) {
    switch (emotionalStatus) {
      case EmotionalStatus.Close:
        return { stroke: '#22c55e', strokeWidth: 2 };
      case EmotionalStatus.Fused:
        return { stroke: '#22c55e', strokeWidth: 3 };
      case EmotionalStatus.Distant:
        return { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' };
      case EmotionalStatus.Hostile:
        return { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '8,4' };
      case EmotionalStatus.Cutoff:
        return { stroke: '#ef4444', strokeWidth: 2 };
      case EmotionalStatus.Abuse:
        return { stroke: '#dc2626', strokeWidth: 3 };
      default:
        return { ...baseStyle, stroke: '#6b7280' };
    }
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
    const { relationType, partnerStatus, emotionalStatus, label } = edgeData;

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
      relationType || RelationType.Partner,
      partnerStatus,
      emotionalStatus
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
