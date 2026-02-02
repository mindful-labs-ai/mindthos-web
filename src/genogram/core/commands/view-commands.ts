import type { Point, UUID } from '../types/types';

import type { EditorState } from './base';
import { BaseCommand } from './base';

export class SetZoomCommand extends BaseCommand {
  override readonly recordInHistory = false;
  readonly type = 'SET_ZOOM';
  private newZoom: number;
  private previousZoom?: number;

  constructor(zoom: number) {
    super();
    this.newZoom = Math.max(0.1, Math.min(5.0, zoom));
  }

  execute(state: EditorState): EditorState {
    this.previousZoom = state.layout.canvas.zoomLevel;
    state.layout.canvas.zoomLevel = this.newZoom;
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.previousZoom !== undefined) {
      state.layout.canvas.zoomLevel = this.previousZoom;
    }
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return other instanceof SetZoomCommand;
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof SetZoomCommand)) return this;
    const merged = new SetZoomCommand(other.newZoom);
    merged.previousZoom = this.previousZoom;
    return merged;
  }
}

export class SetOffsetCommand extends BaseCommand {
  override readonly recordInHistory = false;
  readonly type = 'SET_OFFSET';
  private newOffset: Point;
  private previousOffset?: Point;

  constructor(offset: Point) {
    super();
    this.newOffset = { ...offset };
  }

  execute(state: EditorState): EditorState {
    this.previousOffset = { ...state.layout.canvas.offset };
    state.layout.canvas.offset = { ...this.newOffset };
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.previousOffset) {
      state.layout.canvas.offset = { ...this.previousOffset };
    }
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return other instanceof SetOffsetCommand;
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof SetOffsetCommand)) return this;
    const merged = new SetOffsetCommand(other.newOffset);
    merged.previousOffset = this.previousOffset;
    return merged;
  }
}

export class ToggleGridSnapCommand extends BaseCommand {
  override readonly recordInHistory = false;
  readonly type = 'TOGGLE_GRID_SNAP';

  execute(state: EditorState): EditorState {
    state.layout.canvas.gridSnap = !state.layout.canvas.gridSnap;
    return state;
  }

  undo(state: EditorState): EditorState {
    state.layout.canvas.gridSnap = !state.layout.canvas.gridSnap;
    return state;
  }
}

export class SelectNodesCommand extends BaseCommand {
  override readonly recordInHistory = false;
  readonly type = 'SELECT_NODES';
  private ids: UUID[];
  private clearOthers: boolean;
  private previousSelectedNodes: UUID[] = [];
  private previousSelectedEdges: UUID[] = [];

  constructor(ids: UUID[], clearOthers = true) {
    super();
    this.ids = [...ids];
    this.clearOthers = clearOthers;
  }

  execute(state: EditorState): EditorState {
    state.layout.nodes.forEach((node, id) => {
      if (node.isSelected) this.previousSelectedNodes.push(id);
    });
    state.layout.edges.forEach((edge, id) => {
      if (edge.isSelected) this.previousSelectedEdges.push(id);
    });

    if (this.clearOthers) {
      state.layout.nodes.forEach((n) => (n.isSelected = false));
      state.layout.edges.forEach((e) => (e.isSelected = false));
      state.layout.texts.forEach((t) => (t.isSelected = false));
    }

    this.ids.forEach((id) => {
      const node = state.layout.nodes.get(id);
      if (node) {
        node.isSelected = true;
        return;
      }
      const edge = state.layout.edges.get(id);
      if (edge) {
        edge.isSelected = true;
        return;
      }
      const text = state.layout.texts.get(id);
      if (text) {
        text.isSelected = true;
      }
    });

    return state;
  }

  undo(state: EditorState): EditorState {
    this.ids.forEach((id) => {
      const node = state.layout.nodes.get(id);
      if (node) node.isSelected = false;
      const edge = state.layout.edges.get(id);
      if (edge) edge.isSelected = false;
      const text = state.layout.texts.get(id);
      if (text) text.isSelected = false;
    });

    this.previousSelectedNodes.forEach((id) => {
      const node = state.layout.nodes.get(id);
      if (node) node.isSelected = true;
    });
    this.previousSelectedEdges.forEach((id) => {
      const edge = state.layout.edges.get(id);
      if (edge) edge.isSelected = true;
    });

    return state;
  }
}

export class DeselectAllCommand extends BaseCommand {
  override readonly recordInHistory = false;
  readonly type = 'DESELECT_ALL';
  private previousNodeIds: UUID[] = [];
  private previousEdgeIds: UUID[] = [];
  private previousTextIds: UUID[] = [];

  execute(state: EditorState): EditorState {
    state.layout.nodes.forEach((n, id) => {
      if (n.isSelected) {
        this.previousNodeIds.push(id);
        n.isSelected = false;
      }
    });
    state.layout.edges.forEach((e, id) => {
      if (e.isSelected) {
        this.previousEdgeIds.push(id);
        e.isSelected = false;
      }
    });
    state.layout.texts.forEach((t, id) => {
      if (t.isSelected) {
        this.previousTextIds.push(id);
        t.isSelected = false;
      }
    });
    return state;
  }

  undo(state: EditorState): EditorState {
    this.previousNodeIds.forEach((id) => {
      const n = state.layout.nodes.get(id);
      if (n) n.isSelected = true;
    });
    this.previousEdgeIds.forEach((id) => {
      const e = state.layout.edges.get(id);
      if (e) e.isSelected = true;
    });
    this.previousTextIds.forEach((id) => {
      const t = state.layout.texts.get(id);
      if (t) t.isSelected = true;
    });
    return state;
  }
}
