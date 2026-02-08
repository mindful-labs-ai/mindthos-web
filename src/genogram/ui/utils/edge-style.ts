import {
  DEFAULT_FG,
  INFLUENCE_STROKE,
  RELATION_CLOSE,
  RELATION_CUTOFF,
  RELATION_DEFAULT,
  RELATION_DISTANT,
  RELATION_HOSTILE,
} from '@/genogram/core/constants/colors';
import {
  STROKE_WIDTH_DEFAULT,
  STROKE_WIDTH_THICK,
  STROKE_WIDTH_THIN,
} from '@/genogram/core/constants/strokes';
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
  const baseStyle: EdgeStyle = { stroke: DEFAULT_FG, strokeWidth: STROKE_WIDTH_DEFAULT };

  if (connectionType === ConnectionType.Partner_Line) {
    switch (partnerStatus) {
      case PartnerStatus.Marriage:
        return { ...baseStyle, strokeWidth: STROKE_WIDTH_DEFAULT };
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
        return { stroke: RELATION_CLOSE, strokeWidth: STROKE_WIDTH_DEFAULT };
      case RelationStatus.Fused:
        return { stroke: RELATION_CLOSE, strokeWidth: STROKE_WIDTH_THICK };
      case RelationStatus.Distant:
        return {
          stroke: RELATION_DISTANT,
          strokeWidth: STROKE_WIDTH_THIN,
          strokeDasharray: '5,5',
        };
      case RelationStatus.Hostile:
        return {
          stroke: RELATION_HOSTILE,
          strokeWidth: STROKE_WIDTH_DEFAULT,
          strokeDasharray: '8,4',
        };
      case RelationStatus.Close_Hostile:
        return { stroke: RELATION_HOSTILE, strokeWidth: STROKE_WIDTH_DEFAULT };
      case RelationStatus.Cutoff:
        return {
          stroke: RELATION_CUTOFF,
          strokeWidth: STROKE_WIDTH_DEFAULT,
          strokeDasharray: '2,6',
        };
      default:
        return { ...baseStyle, stroke: RELATION_DEFAULT };
    }
  }

  if (connectionType === ConnectionType.Influence_Line) {
    return { stroke: INFLUENCE_STROKE, strokeWidth: STROKE_WIDTH_THICK };
  }

  return baseStyle;
};
