import {
  ArrowDirection,
  ChildStatus,
  EmotionalStatus,
  PartnerStatus,
} from "../core/enums.js";
import { Point, UUID } from "../core/types.js";
import { EdgeLayout, createEdgeLayout } from "../layout/layout-state.js";
import {
  ChildRelationship,
  EmotionalRelationship,
  PartnerRelationship,
  Relationship,
  createChildRelationship,
  createEmotionalRelationship,
  createPartnerRelationship,
} from "../models/relationship.js";
import { BaseCommand, EditorState } from "./base.js";

export class AddPartnerRelationshipCommand extends BaseCommand {
  readonly type = "ADD_PARTNER_RELATIONSHIP";
  private relationship: PartnerRelationship;
  private edgeLayout: EdgeLayout;

  constructor(
    sourceId: UUID,
    targetId: UUID,
    sourcePos: Point,
    targetPos: Point,
    status: PartnerStatus = PartnerStatus.Married,
  ) {
    super();
    this.relationship = createPartnerRelationship(sourceId, targetId, status);
    this.edgeLayout = createEdgeLayout(
      this.relationship.id,
      sourcePos,
      targetPos,
    );
    this.edgeLayout.virtualAnchor = {
      x: (sourcePos.x + targetPos.x) / 2,
      y: (sourcePos.y + targetPos.y) / 2,
    };
  }

  execute(state: EditorState): EditorState {
    state.genogram.relationships.set(this.relationship.id, {
      ...this.relationship,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.relationships.delete(this.relationship.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getRelationshipId(): UUID {
    return this.relationship.id;
  }
}

export class AddChildRelationshipCommand extends BaseCommand {
  readonly type = "ADD_CHILD_RELATIONSHIP";
  private relationship: ChildRelationship;
  private edgeLayout: EdgeLayout;

  constructor(
    sourceId: UUID,
    targetId: UUID,
    sourcePos: Point,
    targetPos: Point,
    status: ChildStatus = ChildStatus.Biological,
    parentRelationshipId?: UUID,
  ) {
    super();
    this.relationship = createChildRelationship(
      sourceId,
      targetId,
      status,
      parentRelationshipId,
    );
    this.edgeLayout = createEdgeLayout(
      this.relationship.id,
      sourcePos,
      targetPos,
    );
  }

  execute(state: EditorState): EditorState {
    state.genogram.relationships.set(this.relationship.id, {
      ...this.relationship,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.relationships.delete(this.relationship.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getRelationshipId(): UUID {
    return this.relationship.id;
  }
}

export class AddEmotionalRelationshipCommand extends BaseCommand {
  readonly type = "ADD_EMOTIONAL_RELATIONSHIP";
  private relationship: EmotionalRelationship;
  private edgeLayout: EdgeLayout;

  constructor(
    sourceId: UUID,
    targetId: UUID,
    sourcePos: Point,
    targetPos: Point,
    status: EmotionalStatus = EmotionalStatus.Basic,
  ) {
    super();
    this.relationship = createEmotionalRelationship(sourceId, targetId, status);
    this.edgeLayout = createEdgeLayout(
      this.relationship.id,
      sourcePos,
      targetPos,
    );
  }

  execute(state: EditorState): EditorState {
    state.genogram.relationships.set(this.relationship.id, {
      ...this.relationship,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.relationships.delete(this.relationship.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getRelationshipId(): UUID {
    return this.relationship.id;
  }
}

export class DeleteRelationshipCommand extends BaseCommand {
  readonly type = "DELETE_RELATIONSHIP";
  private relationshipId: UUID;
  private backup?: { relationship: Relationship; layout: EdgeLayout };

  constructor(relationshipId: UUID) {
    super();
    this.relationshipId = relationshipId;
  }

  execute(state: EditorState): EditorState {
    const rel = state.genogram.relationships.get(this.relationshipId);
    const layout = state.layout.edges.get(this.relationshipId);

    if (rel && layout) {
      this.backup = {
        relationship: { ...rel } as Relationship,
        layout: { ...layout },
      };
    }

    state.genogram.relationships.delete(this.relationshipId);
    state.layout.edges.delete(this.relationshipId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.backup) {
      state.genogram.relationships.set(
        this.relationshipId,
        this.backup.relationship,
      );
      state.layout.edges.set(this.relationshipId, this.backup.layout);
    }
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}

export class UpdateEdgeStyleCommand extends BaseCommand {
  readonly type = "UPDATE_EDGE_STYLE";
  private edgeId: UUID;
  private updates: Partial<EdgeLayout>;
  private previousValues?: Partial<EdgeLayout>;

  constructor(edgeId: UUID, updates: Partial<EdgeLayout>) {
    super();
    this.edgeId = edgeId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge) return state;

    this.previousValues = {};
    Object.keys(this.updates).forEach((key) => {
      (this.previousValues as any)[key] = (edge as any)[key];
    });

    Object.assign(edge, this.updates);
    return state;
  }

  undo(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge || !this.previousValues) return state;

    Object.assign(edge, this.previousValues);
    return state;
  }
}

export class UpdateEdgePathCommand extends BaseCommand {
  readonly type = "UPDATE_EDGE_PATH";
  private edgeId: UUID;
  private newPath: Point[];
  private previousPath?: Point[];

  constructor(edgeId: UUID, newPath: Point[]) {
    super();
    this.edgeId = edgeId;
    this.newPath = newPath.map((p) => ({ ...p }));
  }

  execute(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge) return state;

    this.previousPath = edge.pathPoints.map((p) => ({ ...p }));
    edge.pathPoints = this.newPath.map((p) => ({ ...p }));
    return state;
  }

  undo(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge || !this.previousPath) return state;

    edge.pathPoints = this.previousPath.map((p) => ({ ...p }));
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return (
      other instanceof UpdateEdgePathCommand && other.edgeId === this.edgeId
    );
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof UpdateEdgePathCommand)) return this;
    const merged = new UpdateEdgePathCommand(this.edgeId, other.newPath);
    merged.previousPath = this.previousPath;
    return merged;
  }
}

export class SetArrowDirectionCommand extends BaseCommand {
  readonly type = "SET_ARROW_DIRECTION";
  private edgeId: UUID;
  private direction: ArrowDirection;
  private previousDirection?: ArrowDirection;

  constructor(edgeId: UUID, direction: ArrowDirection) {
    super();
    this.edgeId = edgeId;
    this.direction = direction;
  }

  execute(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge) return state;

    this.previousDirection = edge.arrowDirection;
    edge.arrowDirection = this.direction;
    return state;
  }

  undo(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge || this.previousDirection === undefined) return state;

    edge.arrowDirection = this.previousDirection;
    return state;
  }
}

export class SetEdgeLabelCommand extends BaseCommand {
  readonly type = "SET_EDGE_LABEL";
  private edgeId: UUID;
  private label: string;
  private previousLabel?: string;

  constructor(edgeId: UUID, label: string) {
    super();
    this.edgeId = edgeId;
    this.label = label;
  }

  execute(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge) return state;

    this.previousLabel = edge.label;
    edge.label = this.label;
    return state;
  }

  undo(state: EditorState): EditorState {
    const edge = state.layout.edges.get(this.edgeId);
    if (!edge) return state;

    edge.label = this.previousLabel;
    return state;
  }
}
