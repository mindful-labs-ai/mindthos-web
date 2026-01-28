import { NodeSize } from '../types/enums';
import type { Point, UUID } from '../types/types';

// Canvas (editor-only runtime state)
export interface CanvasState {
  zoomLevel: number;
  offset: Point;
  gridSnap: boolean;
  gridSize: number;
  backgroundColor: string;
}

export function createCanvasState(): CanvasState {
  return {
    zoomLevel: 1.0,
    offset: { x: 0, y: 0 },
    gridSnap: false,
    gridSize: 30,
    backgroundColor: '#FFFFFF',
  };
}

// Node Layout (editor runtime - selection/visibility state for subjects)
export interface NodeLayout {
  nodeId: UUID;
  position: Point;
  generation: number;
  size: typeof NodeSize[keyof typeof NodeSize];
  zIndex: number;
  isSelected: boolean;
  isLocked: boolean;
  isVisible: boolean;
}

export function createNodeLayout(
  nodeId: UUID,
  position: Point,
  generation: number = 0
): NodeLayout {
  return {
    nodeId,
    position,
    generation,
    size: NodeSize.Default,
    zIndex: 10,
    isSelected: false,
    isLocked: false,
    isVisible: true,
  };
}

// Edge Layout (editor runtime - selection state for connections)
export interface EdgeLayout {
  edgeId: UUID;
  zIndex: number;
  isSelected: boolean;
  isVisible: boolean;
}

export function createEdgeLayout(edgeId: UUID): EdgeLayout {
  return {
    edgeId,
    zIndex: 5,
    isSelected: false,
    isVisible: true,
  };
}

// Text Layout (editor runtime - selection state for annotations)
export interface TextLayout {
  textId: UUID;
  position: Point;
  zIndex: number;
  isSelected: boolean;
  isVisible: boolean;
}

export function createTextLayout(
  textId: UUID,
  position: Point
): TextLayout {
  return {
    textId,
    position,
    zIndex: 15,
    isSelected: false,
    isVisible: true,
  };
}

// Full Layout State (editor runtime)
export interface LayoutState {
  canvas: CanvasState;
  nodes: Map<string, NodeLayout>;
  edges: Map<string, EdgeLayout>;
  texts: Map<string, TextLayout>;
}

export function createLayoutState(): LayoutState {
  return {
    canvas: createCanvasState(),
    nodes: new Map(),
    edges: new Map(),
    texts: new Map(),
  };
}

// Serialization
export interface SerializedLayoutState {
  canvas: CanvasState;
  nodes: [string, NodeLayout][];
  edges: [string, EdgeLayout][];
  texts: [string, TextLayout][];
}

export function serializeLayout(state: LayoutState): SerializedLayoutState {
  return {
    canvas: state.canvas,
    nodes: Array.from(state.nodes.entries()),
    edges: Array.from(state.edges.entries()),
    texts: Array.from(state.texts.entries()),
  };
}

export function deserializeLayout(data: SerializedLayoutState): LayoutState {
  return {
    canvas: data.canvas,
    nodes: new Map(data.nodes),
    edges: new Map(data.edges),
    texts: new Map(data.texts),
  };
}
