import type { EdgeLayout } from '../layout/layout-state';
import { createEdgeLayout } from '../layout/layout-state';
import type {
  Connection,
  ConnectionEntity,
  ConnectionLayout,
} from '../models/relationship';
import {
  createRelationConnection,
  createInfluenceConnection,
  createPartnerConnection,
  createParentChildConnection,
  createGroupConnection,
} from '../models/relationship';
import type { InfluenceStatus, ParentChildStatus } from '../types/enums';
import { PartnerStatus, RelationStatus } from '../types/enums';
import type { UUID } from '../types/types';

import type { EditorState } from './base';
import { BaseCommand } from './base';

export class AddRelationConnectionCommand extends BaseCommand {
  readonly type = 'ADD_RELATION_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(
    subjectId1: UUID,
    subjectId2: UUID,
    status: RelationStatus = RelationStatus.Connected
  ) {
    super();
    this.connection = createRelationConnection(subjectId1, subjectId2, status);
    this.edgeLayout = createEdgeLayout(this.connection.id);
  }

  execute(state: EditorState): EditorState {
    state.genogram.connections.set(this.connection.id, {
      ...this.connection,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.connectionIndex.add(this.connection);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.connectionIndex.remove(this.connection);
    state.genogram.connections.delete(this.connection.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getConnectionId(): UUID {
    return this.connection.id;
  }
}

export class AddInfluenceConnectionCommand extends BaseCommand {
  readonly type = 'ADD_INFLUENCE_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(startRef: UUID, endRef: UUID, status: InfluenceStatus) {
    super();
    this.connection = createInfluenceConnection(startRef, endRef, status);
    this.edgeLayout = createEdgeLayout(this.connection.id);
  }

  execute(state: EditorState): EditorState {
    state.genogram.connections.set(this.connection.id, {
      ...this.connection,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.connectionIndex.add(this.connection);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.connectionIndex.remove(this.connection);
    state.genogram.connections.delete(this.connection.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getConnectionId(): UUID {
    return this.connection.id;
  }
}

export class AddPartnerConnectionCommand extends BaseCommand {
  readonly type = 'ADD_PARTNER_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(
    subjectId1: UUID,
    subjectId2: UUID,
    status: PartnerStatus = PartnerStatus.Marriage
  ) {
    super();
    this.connection = createPartnerConnection(subjectId1, subjectId2, status);
    this.edgeLayout = createEdgeLayout(this.connection.id);
  }

  execute(state: EditorState): EditorState {
    state.genogram.connections.set(this.connection.id, {
      ...this.connection,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.connectionIndex.add(this.connection);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.connectionIndex.remove(this.connection);
    state.genogram.connections.delete(this.connection.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getConnectionId(): UUID {
    return this.connection.id;
  }
}

export class AddParentChildConnectionCommand extends BaseCommand {
  readonly type = 'ADD_PARENT_CHILD_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(
    parentRef: UUID,
    childRef: UUID | [UUID, UUID],
    status: ParentChildStatus
  ) {
    super();
    this.connection = createParentChildConnection(parentRef, childRef, status);
    this.edgeLayout = createEdgeLayout(this.connection.id);
  }

  execute(state: EditorState): EditorState {
    state.genogram.connections.set(this.connection.id, {
      ...this.connection,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.connectionIndex.add(this.connection);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.connectionIndex.remove(this.connection);
    state.genogram.connections.delete(this.connection.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getConnectionId(): UUID {
    return this.connection.id;
  }
}

export class AddGroupConnectionCommand extends BaseCommand {
  readonly type = 'ADD_GROUP_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(subjects: UUID[]) {
    super();
    this.connection = createGroupConnection(subjects);
    this.edgeLayout = createEdgeLayout(this.connection.id);
  }

  execute(state: EditorState): EditorState {
    state.genogram.connections.set(this.connection.id, {
      ...this.connection,
    });
    state.layout.edges.set(this.edgeLayout.edgeId, { ...this.edgeLayout });
    state.connectionIndex.add(this.connection);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.connectionIndex.remove(this.connection);
    state.genogram.connections.delete(this.connection.id);
    state.layout.edges.delete(this.edgeLayout.edgeId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getConnectionId(): UUID {
    return this.connection.id;
  }
}

export class DeleteConnectionCommand extends BaseCommand {
  readonly type = 'DELETE_CONNECTION';
  private connectionId: UUID;
  private backup?: { connection: Connection; layout: EdgeLayout };

  constructor(connectionId: UUID) {
    super();
    this.connectionId = connectionId;
  }

  execute(state: EditorState): EditorState {
    const conn = state.genogram.connections.get(this.connectionId);
    const layout = state.layout.edges.get(this.connectionId);

    if (conn && layout) {
      this.backup = {
        connection: { ...conn } as Connection,
        layout: { ...layout },
      };
      state.connectionIndex.remove(conn);
    }

    state.genogram.connections.delete(this.connectionId);
    state.layout.edges.delete(this.connectionId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.backup) {
      state.genogram.connections.set(this.connectionId, this.backup.connection);
      state.layout.edges.set(this.connectionId, this.backup.layout);
      state.connectionIndex.add(this.backup.connection);
    }
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}

export class UpdateConnectionLayoutCommand extends BaseCommand {
  readonly type = 'UPDATE_CONNECTION_LAYOUT';
  private connectionId: UUID;
  private updates: Partial<ConnectionLayout>;
  private previousValues?: Partial<ConnectionLayout>;

  constructor(connectionId: UUID, updates: Partial<ConnectionLayout>) {
    super();
    this.connectionId = connectionId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const conn = state.genogram.connections.get(this.connectionId);
    if (!conn) return state;

    this.previousValues = { ...conn.layout };

    Object.assign(conn.layout, this.updates);
    return state;
  }

  undo(state: EditorState): EditorState {
    const conn = state.genogram.connections.get(this.connectionId);
    if (!conn || !this.previousValues) return state;

    Object.assign(conn.layout, this.previousValues);
    return state;
  }
}

export class UpdateConnectionEntityCommand extends BaseCommand {
  readonly type = 'UPDATE_CONNECTION_ENTITY';
  private connectionId: UUID;
  private updates: Partial<ConnectionEntity>;
  private previousEntity?: ConnectionEntity;

  constructor(connectionId: UUID, updates: Partial<ConnectionEntity>) {
    super();
    this.connectionId = connectionId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const conn = state.genogram.connections.get(this.connectionId);
    if (!conn) return state;

    this.previousEntity = {
      ...conn.entity,
      attribute: { ...conn.entity.attribute },
    };

    const newEntity = { ...conn.entity };
    if (this.updates.attribute) {
      newEntity.attribute = {
        ...conn.entity.attribute,
        ...this.updates.attribute,
      };
    }
    if (this.updates.memo !== undefined) {
      newEntity.memo = this.updates.memo;
    }

    state.genogram.connections.set(this.connectionId, {
      ...conn,
      entity: newEntity,
    });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    const conn = state.genogram.connections.get(this.connectionId);
    if (!conn || !this.previousEntity) return state;

    state.genogram.connections.set(this.connectionId, {
      ...conn,
      entity: this.previousEntity,
    });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}
