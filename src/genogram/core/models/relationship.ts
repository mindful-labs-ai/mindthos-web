import {
  ChildStatus,
  EmotionalStatus,
  PartnerStatus,
  RelationType,
} from '../types/enums';
import type { UUID } from '../types/types';
import { generateId } from '../types/types';

export interface RelationshipEvent {
  type: string;
  date: string;
  description?: string;
}

interface BaseRelationship {
  id: UUID;
  sourceId: UUID;
  targetId: UUID;
  type: RelationType;
  events: RelationshipEvent[];
  memo?: string;
}

export interface PartnerRelationship extends BaseRelationship {
  type: RelationType.Partner;
  status: PartnerStatus;
}

export interface ChildRelationship extends BaseRelationship {
  type: RelationType.Child;
  status: ChildStatus;
  parentRelationshipId?: UUID;
}

export interface EmotionalRelationship extends BaseRelationship {
  type: RelationType.Emotional;
  status: EmotionalStatus;
}

export interface GroupRelationship extends BaseRelationship {
  type: RelationType.Group;
  memberIds: UUID[];
  groupName?: string;
}

export type Relationship =
  | PartnerRelationship
  | ChildRelationship
  | EmotionalRelationship
  | GroupRelationship;

export function createPartnerRelationship(
  sourceId: UUID,
  targetId: UUID,
  status: PartnerStatus = PartnerStatus.Married,
  id: UUID = generateId()
): PartnerRelationship {
  return {
    id,
    sourceId,
    targetId,
    type: RelationType.Partner,
    status,
    events: [],
  };
}

export function createChildRelationship(
  sourceId: UUID,
  targetId: UUID,
  status: ChildStatus = ChildStatus.Biological,
  parentRelationshipId?: UUID,
  id: UUID = generateId()
): ChildRelationship {
  return {
    id,
    sourceId,
    targetId,
    type: RelationType.Child,
    status,
    parentRelationshipId,
    events: [],
  };
}

export function createEmotionalRelationship(
  sourceId: UUID,
  targetId: UUID,
  status: EmotionalStatus = EmotionalStatus.Basic,
  id: UUID = generateId()
): EmotionalRelationship {
  return {
    id,
    sourceId,
    targetId,
    type: RelationType.Emotional,
    status,
    events: [],
  };
}

export function createGroupRelationship(
  memberIds: UUID[],
  groupName?: string,
  id: UUID = generateId()
): GroupRelationship {
  return {
    id,
    sourceId: memberIds[0] ?? '',
    targetId: memberIds[1] ?? '',
    type: RelationType.Group,
    memberIds,
    groupName,
    events: [],
  };
}

export type RelationshipUpdate = Partial<Omit<Relationship, 'id' | 'type'>>;
