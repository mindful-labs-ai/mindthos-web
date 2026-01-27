import type { NodeLayout } from '../layout/layout-state';
import { createNodeLayout } from '../layout/layout-state';
import type { Subject } from '../models/person';
import { createPersonSubject } from '../models/person';
import type { Gender } from '../types/enums';
import type { Point, UUID } from '../types/types';

import type { EditorState } from './base';
import { BaseCommand } from './base';

export class AddSubjectCommand extends BaseCommand {
  readonly type = 'ADD_SUBJECT';
  private subject: Subject;
  private layout: NodeLayout;

  constructor(gender: Gender, position: Point, generation = 0) {
    super();
    this.subject = createPersonSubject(gender, position);
    this.layout = createNodeLayout(this.subject.id, position, generation);
  }

  execute(state: EditorState): EditorState {
    state.genogram.subjects.set(this.subject.id, { ...this.subject });
    state.layout.nodes.set(this.layout.nodeId, { ...this.layout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.subjects.delete(this.subject.id);
    state.layout.nodes.delete(this.layout.nodeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getSubjectId(): UUID {
    return this.subject.id;
  }
}

export class DeleteSubjectCommand extends BaseCommand {
  readonly type = 'DELETE_SUBJECT';
  private subjectId: UUID;
  private backup?: { subject: Subject; layout: NodeLayout };

  constructor(subjectId: UUID) {
    super();
    this.subjectId = subjectId;
  }

  execute(state: EditorState): EditorState {
    const subject = state.genogram.subjects.get(this.subjectId);
    const layout = state.layout.nodes.get(this.subjectId);

    if (subject && layout) {
      this.backup = { subject: { ...subject }, layout: { ...layout } };
    }

    state.genogram.subjects.delete(this.subjectId);
    state.layout.nodes.delete(this.subjectId);

    // Remove related connections
    state.genogram.connections.forEach((conn, id) => {
      const attr = conn.entity.attribute;
      const isRelated =
        ('subjects' in attr &&
          Array.isArray(attr.subjects) &&
          attr.subjects.includes(this.subjectId)) ||
        ('startRef' in attr && attr.startRef === this.subjectId) ||
        ('endRef' in attr && attr.endRef === this.subjectId) ||
        ('parentRef' in attr && attr.parentRef === this.subjectId) ||
        ('childRef' in attr &&
          (attr.childRef === this.subjectId ||
            (Array.isArray(attr.childRef) &&
              attr.childRef.includes(this.subjectId))));

      if (isRelated) {
        state.genogram.connections.delete(id);
        state.layout.edges.delete(id);
      }
    });

    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.backup) {
      state.genogram.subjects.set(this.subjectId, this.backup.subject);
      state.layout.nodes.set(this.subjectId, this.backup.layout);
    }
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}

export class UpdateSubjectCommand extends BaseCommand {
  readonly type = 'UPDATE_SUBJECT';
  private subjectId: UUID;
  private updates: Partial<Subject>;
  private previousValues?: Partial<Subject>;

  constructor(subjectId: UUID, updates: Partial<Subject>) {
    super();
    this.subjectId = subjectId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const subject = state.genogram.subjects.get(this.subjectId);
    if (!subject) return state;

    this.previousValues = {};
    Object.keys(this.updates).forEach((key) => {
      (this.previousValues as any)[key] = (subject as any)[key];
    });

    Object.assign(subject, this.updates);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    const subject = state.genogram.subjects.get(this.subjectId);
    if (!subject || !this.previousValues) return state;

    Object.assign(subject, this.previousValues);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return (
      other instanceof UpdateSubjectCommand &&
      other.subjectId === this.subjectId
    );
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof UpdateSubjectCommand)) return this;
    const merged = new UpdateSubjectCommand(this.subjectId, {
      ...this.updates,
      ...other.updates,
    });
    merged.previousValues = this.previousValues;
    return merged;
  }
}

export class MoveNodeCommand extends BaseCommand {
  readonly type = 'MOVE_NODE';
  private nodeId: UUID;
  private newPosition: Point;
  private previousPosition?: Point;

  constructor(nodeId: UUID, newPosition: Point) {
    super();
    this.nodeId = nodeId;
    this.newPosition = { ...newPosition };
  }

  execute(state: EditorState): EditorState {
    const layout = state.layout.nodes.get(this.nodeId);
    if (!layout) return state;

    this.previousPosition = { ...layout.position };
    layout.position = { ...this.newPosition };

    // Also update Subject layout.center
    const subject = state.genogram.subjects.get(this.nodeId);
    if (subject) {
      subject.layout.center = { ...this.newPosition };
    }

    return state;
  }

  undo(state: EditorState): EditorState {
    const layout = state.layout.nodes.get(this.nodeId);
    if (!layout || !this.previousPosition) return state;

    layout.position = { ...this.previousPosition };

    const subject = state.genogram.subjects.get(this.nodeId);
    if (subject) {
      subject.layout.center = { ...this.previousPosition };
    }

    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return other instanceof MoveNodeCommand && other.nodeId === this.nodeId;
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof MoveNodeCommand)) return this;
    const merged = new MoveNodeCommand(this.nodeId, other.newPosition);
    merged.previousPosition = this.previousPosition;
    return merged;
  }
}

export class MoveMultipleNodesCommand extends BaseCommand {
  readonly type = 'MOVE_MULTIPLE_NODES';
  private moves: { nodeId: UUID; newPosition: Point }[];
  private previousPositions = new Map<UUID, Point>();

  constructor(moves: { nodeId: UUID; newPosition: Point }[]) {
    super();
    this.moves = moves.map((m) => ({
      nodeId: m.nodeId,
      newPosition: { ...m.newPosition },
    }));
  }

  execute(state: EditorState): EditorState {
    this.moves.forEach(({ nodeId, newPosition }) => {
      const layout = state.layout.nodes.get(nodeId);
      if (layout) {
        this.previousPositions.set(nodeId, { ...layout.position });
        layout.position = { ...newPosition };
      }
      const subject = state.genogram.subjects.get(nodeId);
      if (subject) {
        subject.layout.center = { ...newPosition };
      }
    });
    return state;
  }

  undo(state: EditorState): EditorState {
    this.previousPositions.forEach((pos, nodeId) => {
      const layout = state.layout.nodes.get(nodeId);
      if (layout) {
        layout.position = { ...pos };
      }
      const subject = state.genogram.subjects.get(nodeId);
      if (subject) {
        subject.layout.center = { ...pos };
      }
    });
    return state;
  }
}
