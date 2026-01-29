import {
  ConnectionType,
  PartnerStatus,
  RelationStatus,
} from '@/genogram/core/types/enums';

export interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

export const getEdgeStyle = (
  connectionType: (typeof ConnectionType)[keyof typeof ConnectionType],
  partnerStatus?: (typeof PartnerStatus)[keyof typeof PartnerStatus],
  relationStatus?: (typeof RelationStatus)[keyof typeof RelationStatus]
): EdgeStyle => {
  const baseStyle: EdgeStyle = { stroke: '#374151', strokeWidth: 2 };

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
      case RelationStatus.Cutoff:
        return { stroke: '#374151', strokeWidth: 2, strokeDasharray: '2,6' };
      default:
        return { ...baseStyle, stroke: '#6b7280' };
    }
  }

  if (connectionType === ConnectionType.Influence_Line) {
    return { stroke: '#dc2626', strokeWidth: 3 };
  }

  return baseStyle;
};
