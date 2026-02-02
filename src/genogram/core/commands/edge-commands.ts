import type { EdgeLayout } from '../layout/layout-state';
import { createEdgeLayout } from '../layout/layout-state';
import {
  type Connection,
  type ConnectionEntity,
  type ConnectionLayout,
} from '../models/relationship';
import type { UUID } from '../types/types';

import type { EditorState } from './base';
import { BaseCommand } from './base';

export class AddConnectionCommand extends BaseCommand {
  readonly type = 'ADD_CONNECTION';
  private connection: Connection;
  private edgeLayout: EdgeLayout;

  constructor(connection: Connection, edgeLayout?: EdgeLayout) {
    super();
    this.connection = connection;
    this.edgeLayout = edgeLayout ?? createEdgeLayout(connection.id);
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

    if (!this.backup && conn && layout) {
      this.backup = {
        connection: structuredClone(conn) as Connection,
        layout: { ...layout },
      };
    }
    if (conn) {
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

    if (!this.previousValues) this.previousValues = { ...conn.layout };

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

    if (!this.previousEntity) {
      this.previousEntity = {
        ...conn.entity,
        attribute: { ...conn.entity.attribute },
      };
    }

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
