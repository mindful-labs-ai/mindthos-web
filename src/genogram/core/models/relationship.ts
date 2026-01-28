import { ConnectionType, StrokeWidth } from '../types/enums';
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
}

export interface PartnerAttribute {
  status: PartnerStatus;
  subjects: [UUID, UUID];
  detail: PartnerDetail;
}

export interface ParentChildAttribute {
  status: ParentChildStatus;
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
    strokeColor: '#000000',
    textColor: '#000000',
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
      type: ConnectionType.관계선,
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
      type: ConnectionType.영향선,
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
      type: ConnectionType.파트너선,
      attribute: {
        status,
        subjects: [subjectId1, subjectId2],
        detail: {
          marriedDate: null,
          divorcedDate: null,
          reunitedDate: null,
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
      type: ConnectionType.부모자식선,
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
      type: ConnectionType.그룹선,
      attribute: {
        subjects,
      } satisfies GroupAttribute,
      memo: null,
    },
    layout: createDefaultConnectionLayout(),
  };
}

export type ConnectionUpdate = Partial<Omit<Connection, 'id'>>;
