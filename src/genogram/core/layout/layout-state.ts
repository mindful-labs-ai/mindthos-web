import { ArrowDirection, LineStyle, NodeSize } from '../types/enums';
import type { Point, UUID } from '../types/types';

// Canvas
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
    gridSnap: true,
    gridSize: 20,
    backgroundColor: '#FFFFFF',
  };
}

// Node Layout
export interface NodeLayout {
  nodeId: UUID;
  position: Point;
  generation: number;
  size: NodeSize;
  fillColor?: string;
  borderColor?: string;
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

// Edge Layout
export interface EdgeLayout {
  edgeId: UUID;
  pathPoints: Point[];
  virtualAnchor?: Point;
  strokeColor: string;
  strokeWeight: number;
  lineStyle: LineStyle;
  arrowDirection: ArrowDirection;
  label?: string;
  labelPosition?: Point;
  zIndex: number;
  isSelected: boolean;
  isVisible: boolean;
}

export function createEdgeLayout(
  edgeId: UUID,
  sourcePos: Point,
  targetPos: Point
): EdgeLayout {
  return {
    edgeId,
    pathPoints: [sourcePos, targetPos],
    strokeColor: '#000000',
    strokeWeight: 2,
    lineStyle: LineStyle.Solid,
    arrowDirection: ArrowDirection.None,
    zIndex: 5,
    isSelected: false,
    isVisible: true,
  };
}

// Text Layout
export interface TextLayout {
  textId: UUID;
  targetId: UUID | null;
  position: Point;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  zIndex: number;
  isSelected: boolean;
  isVisible: boolean;
}

export function createTextLayout(
  textId: UUID,
  position: Point,
  targetId: UUID | null = null
): TextLayout {
  return {
    textId,
    targetId,
    position,
    color: '#000000',
    fontSize: 14,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    zIndex: 15,
    isSelected: false,
    isVisible: true,
  };
}

// Full Layout State
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
