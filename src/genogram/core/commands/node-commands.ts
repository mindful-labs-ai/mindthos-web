import type { EdgeLayout, NodeLayout } from '../layout/layout-state';
import { createNodeLayout } from '../layout/layout-state';
import type { Subject } from '../models/person';
import {
  createAnimalSubject,
  createPersonSubject,
  createSpecialChildSubject,
} from '../models/person';
import type { Connection } from '../models/relationship';
import type { Gender } from '../types/enums';
import { SubjectType } from '../types/enums';
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

export class AddAnimalSubjectCommand extends BaseCommand {
  readonly type = 'ADD_ANIMAL_SUBJECT';
  private subject: Subject;
  private layout: NodeLayout;

  constructor(position: Point, generation = 0) {
    super();
    this.subject = createAnimalSubject(position);
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

export class AddSpecialChildSubjectCommand extends BaseCommand {
  readonly type = 'ADD_SPECIAL_CHILD_SUBJECT';
  private subject: Subject;
  private layout: NodeLayout;

  constructor(
    subjectType:
      | typeof SubjectType.Miscarriage
      | typeof SubjectType.Abortion
      | typeof SubjectType.Pregnancy,
    position: Point,
    generation = 0
  ) {
    super();
    this.subject = createSpecialChildSubject(subjectType, position);
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
  private subjectBackup?: { subject: Subject; layout: NodeLayout };
  private deletedConnections: {
    connection: Connection;
    layout: EdgeLayout;
  }[] = [];

  constructor(subjectId: UUID) {
    super();
    this.subjectId = subjectId;
  }

  execute(state: EditorState): EditorState {
    const subject = state.genogram.subjects.get(this.subjectId);
    const layout = state.layout.nodes.get(this.subjectId);

    if (subject && layout) {
      this.subjectBackup = { subject: { ...subject }, layout: { ...layout } };
    }

    state.genogram.subjects.delete(this.subjectId);
    state.layout.nodes.delete(this.subjectId);

    // 1차: 인덱스를 통해 Subject를 직접 참조하는 Connection 수집 — O(1)
    this.deletedConnections = [];
    const directDeleteIds = new Set<UUID>(
      state.connectionIndex.getBySubject(this.subjectId)
    );

    // 2차: 삭제될 Connection을 parentRef로 참조하는 자녀선 수집 — O(k)
    const cascadeDeleteIds = new Set<UUID>();
    for (const directId of directDeleteIds) {
      for (const childId of state.connectionIndex.getByParentRef(directId)) {
        if (!directDeleteIds.has(childId)) {
          cascadeDeleteIds.add(childId);
        }
      }
    }

    // 백업 후 삭제 (인덱스도 갱신)
    const allDeleteIds = [...directDeleteIds, ...cascadeDeleteIds];
    for (const id of allDeleteIds) {
      const conn = state.genogram.connections.get(id);
      const edgeLayout = state.layout.edges.get(id);
      if (conn && edgeLayout) {
        this.deletedConnections.push({
          connection: { ...conn },
          layout: { ...edgeLayout },
        });
        state.connectionIndex.remove(conn);
      }
      state.genogram.connections.delete(id);
      state.layout.edges.delete(id);
    }

    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    // Connection 먼저 복원 (파트너선이 있어야 자녀선 참조가 유효) + 인덱스 복원
    for (const { connection, layout } of this.deletedConnections) {
      state.genogram.connections.set(connection.id, connection);
      state.layout.edges.set(layout.edgeId, layout);
      state.connectionIndex.add(connection);
    }

    if (this.subjectBackup) {
      state.genogram.subjects.set(this.subjectId, this.subjectBackup.subject);
      state.layout.nodes.set(this.subjectId, this.subjectBackup.layout);
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

    this.previousValues = { ...subject };

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
