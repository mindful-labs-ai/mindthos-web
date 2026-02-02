import {
  ConnectionType,
  PartnerStatus as PartnerStatusEnum,
  StrokeWidth,
} from '../types/enums';
import type {
  InfluenceStatus,
  ParentChildStatus,
  PartnerStatus,
  RelationStatus,
} from '../types/enums';
import type { UUID } from '../types/types';
import { generateId } from '../types/types';

// Connection Entity variants
export interface RelationAttribute {
  status: RelationStatus;
  subjects: [UUID, UUID];
}

export interface InfluenceAttribute {
  status: InfluenceStatus;
  startRef: UUID;
  endRef: UUID;
}

export interface PartnerDetail {
  marriedDate?: string | null;
  divorcedDate?: string | null;
  reunitedDate?: string | null;
  relationshipStartDate?: string | null;
}

export interface PartnerAttribute {
  status: PartnerStatus;
  subjects: [UUID, UUID];
  detail: PartnerDetail;
}

export interface ParentChildAttribute {
  status: ParentChildStatus;
  /** 파트너선(Partner_Line) Connection ID — 이 선의 중간 지점에서 자녀 방향으로 연결 */
  parentRef: UUID;
  childRef: UUID | [UUID, UUID];
}

export interface GroupAttribute {
  subjects: UUID[];
}

export type ConnectionAttribute =
  | RelationAttribute
  | InfluenceAttribute
  | PartnerAttribute
  | ParentChildAttribute
  | GroupAttribute;

// Connection Entity
export interface ConnectionEntity {
  type: (typeof ConnectionType)[keyof typeof ConnectionType];
  attribute: ConnectionAttribute;
  memo: string | null;
}

// Connection Layout
export interface ConnectionLayout {
  strokeWidth: (typeof StrokeWidth)[keyof typeof StrokeWidth];
  strokeColor: string;
  textColor: string;
}

// Connection
export interface Connection {
  id: UUID;
  entity: ConnectionEntity;
  layout: ConnectionLayout;
}

function createDefaultConnectionLayout(): ConnectionLayout {
  return {
    strokeWidth: StrokeWidth.Default,
    strokeColor: '#374151',
    textColor: '#1f2937',
  };
}

export function createRelationConnection(
  subjectId1: UUID,
  subjectId2: UUID,
  status: RelationStatus,
  id: UUID = generateId()
): Connection {
  return {
    id,
    entity: {
      type: ConnectionType.Relation_Line,
      attribute: {
        status,
        subjects: [subjectId1, subjectId2],
      } satisfies RelationAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export function createInfluenceConnection(
  startRef: UUID,
  endRef: UUID,
  status: InfluenceStatus,
  id: UUID = generateId()
): Connection {
  return {
    id,
    entity: {
      type: ConnectionType.Influence_Line,
      attribute: {
        status,
        startRef,
        endRef,
      } satisfies InfluenceAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export function createPartnerConnection(
  subjectId1: UUID,
  subjectId2: UUID,
  status: PartnerStatus,
  id: UUID = generateId()
): Connection {
  return {
    id,
    entity: {
      type: ConnectionType.Partner_Line,
      attribute: {
        status,
        subjects: [subjectId1, subjectId2],
        detail: {
          marriedDate: null,
          divorcedDate: null,
          reunitedDate: null,
          relationshipStartDate: null,
        },
      } satisfies PartnerAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export function createParentChildConnection(
  parentRef: UUID,
  childRef: UUID | [UUID, UUID],
  status: ParentChildStatus,
  id: UUID = generateId()
): Connection {
  return {
    id,
    entity: {
      type: ConnectionType.Children_Parents_Line,
      attribute: {
        status,
        parentRef,
        childRef,
      } satisfies ParentChildAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export function createGroupConnection(
  subjects: UUID[],
  id: UUID = generateId()
): Connection {
  return {
    id,
    entity: {
      type: ConnectionType.Group_Line,
      attribute: {
        subjects,
      } satisfies GroupAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export type ConnectionUpdate = Partial<Omit<Connection, 'id'>>;

/**
 * PartnerStatus에 따라 각 날짜 필드의 표시 여부를 반환합니다.
 */
export function getPartnerDateVisibility(status: PartnerStatus): {
  showMarried: boolean;
  showDivorced: boolean;
  showReunited: boolean;
  showRelStart: boolean;
} {
  return {
    showMarried:
      status === PartnerStatusEnum.Marriage ||
      status === PartnerStatusEnum.Marital_Separation ||
      status === PartnerStatusEnum.Divorce ||
      status === PartnerStatusEnum.Remarriage,
    showDivorced:
      status === PartnerStatusEnum.Divorce ||
      status === PartnerStatusEnum.Remarriage,
    showReunited: status === PartnerStatusEnum.Remarriage,
    showRelStart:
      status === PartnerStatusEnum.Couple_Relationship ||
      status === PartnerStatusEnum.Secret_Affair,
  };
}
