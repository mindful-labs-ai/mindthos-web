import { Gender } from '../types/enums.js';
import { Point, UUID } from '../types/types.js';
import { NodeLayout, createNodeLayout } from '../layout/layout-state.js';
import { Person, createPerson } from '../models/person.js';
import { BaseCommand, EditorState } from './base.js';

export class AddPersonCommand extends BaseCommand {
  readonly type = 'ADD_PERSON';
  private person: Person;
  private layout: NodeLayout;

  constructor(name: string, gender: Gender, position: Point, generation = 0) {
    super();
    this.person = createPerson(name, gender);
    this.layout = createNodeLayout(this.person.id, position, generation);
  }

  execute(state: EditorState): EditorState {
    state.genogram.persons.set(this.person.id, { ...this.person });
    state.layout.nodes.set(this.layout.nodeId, { ...this.layout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.persons.delete(this.person.id);
    state.layout.nodes.delete(this.layout.nodeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getPersonId(): UUID {
    return this.person.id;
  }
}

export class DeletePersonCommand extends BaseCommand {
  readonly type = 'DELETE_PERSON';
  private personId: UUID;
  private backup?: { person: Person; layout: NodeLayout };

  constructor(personId: UUID) {
    super();
    this.personId = personId;
  }

  execute(state: EditorState): EditorState {
    const person = state.genogram.persons.get(this.personId);
    const layout = state.layout.nodes.get(this.personId);

    if (person && layout) {
      this.backup = { person: { ...person }, layout: { ...layout } };
    }

    state.genogram.persons.delete(this.personId);
    state.layout.nodes.delete(this.personId);

    state.genogram.relationships.forEach((rel, id) => {
      if (rel.sourceId === this.personId || rel.targetId === this.personId) {
        state.genogram.relationships.delete(id);
        state.layout.edges.delete(id);
      }
    });

    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.backup) {
      state.genogram.persons.set(this.personId, this.backup.person);
      state.layout.nodes.set(this.personId, this.backup.layout);
    }
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}

export class UpdatePersonCommand extends BaseCommand {
  readonly type = 'UPDATE_PERSON';
  private personId: UUID;
  private updates: Partial<Person>;
  private previousValues?: Partial<Person>;

  constructor(personId: UUID, updates: Partial<Person>) {
    super();
    this.personId = personId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const person = state.genogram.persons.get(this.personId);
    if (!person) return state;

    this.previousValues = {};
    Object.keys(this.updates).forEach((key) => {
      (this.previousValues as any)[key] = (person as any)[key];
    });

    Object.assign(person, this.updates);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    const person = state.genogram.persons.get(this.personId);
    if (!person || !this.previousValues) return state;

    Object.assign(person, this.previousValues);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return (
      other instanceof UpdatePersonCommand && other.personId === this.personId
    );
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof UpdatePersonCommand)) return this;
    const merged = new UpdatePersonCommand(this.personId, {
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
    return state;
  }

  undo(state: EditorState): EditorState {
    const layout = state.layout.nodes.get(this.nodeId);
    if (!layout || !this.previousPosition) return state;

    layout.position = { ...this.previousPosition };
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
    });
    return state;
  }

  undo(state: EditorState): EditorState {
    this.previousPositions.forEach((pos, nodeId) => {
      const layout = state.layout.nodes.get(nodeId);
      if (layout) {
        layout.position = { ...pos };
      }
    });
    return state;
  }
}
