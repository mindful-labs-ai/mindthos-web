import { AssetType, ToolMode } from '../types/enums';
import type { Point, Rect, UUID } from '../types/types';

export interface SelectedItem {
  id: UUID;
  type: AssetType;
}

export interface DragState {
  isDragging: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  draggedIds: UUID[];
}

export interface ConnectionPreview {
  isActive: boolean;
  sourceId: UUID | null;
  sourcePoint: Point | null;
  currentPoint: Point | null;
}

export interface SelectionBox {
  isActive: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
}

export interface NodeCreationPreview {
  isActive: boolean;
  position: Point | null;
}

export interface InteractionState {
  toolMode: ToolMode;
  selectedItems: SelectedItem[];
  hoveredItemId: UUID | null;
  hoveredItemType: AssetType | null;
  drag: DragState;
  connectionPreview: ConnectionPreview;
  selectionBox: SelectionBox;
  nodeCreationPreview: NodeCreationPreview;
  mousePosition: Point | null;
}

export function createInteractionState(): InteractionState {
  return {
    toolMode: ToolMode.Select,
    selectedItems: [],
    hoveredItemId: null,
    hoveredItemType: null,
    drag: {
      isDragging: false,
      startPoint: null,
      currentPoint: null,
      draggedIds: [],
    },
    connectionPreview: {
      isActive: false,
      sourceId: null,
      sourcePoint: null,
      currentPoint: null,
    },
    selectionBox: {
      isActive: false,
      startPoint: null,
      currentPoint: null,
    },
    nodeCreationPreview: {
      isActive: false,
      position: null,
    },
    mousePosition: null,
  };
}

export function setToolMode(state: InteractionState, mode: ToolMode): void {
  state.toolMode = mode;
  resetAllPreviews(state);
}

export function startDrag(
  state: InteractionState,
  point: Point,
  itemIds: UUID[]
): void {
  state.drag = {
    isDragging: true,
    startPoint: { ...point },
    currentPoint: { ...point },
    draggedIds: [...itemIds],
  };
}

export function updateDrag(state: InteractionState, point: Point): void {
  if (state.drag.isDragging) {
    state.drag.currentPoint = { ...point };
  }
}

export function endDrag(
  state: InteractionState
): { startPoint: Point; endPoint: Point; ids: UUID[] } | null {
  if (
    !state.drag.isDragging ||
    !state.drag.startPoint ||
    !state.drag.currentPoint
  ) {
    return null;
  }

  const result = {
    startPoint: { ...state.drag.startPoint },
    endPoint: { ...state.drag.currentPoint },
    ids: [...state.drag.draggedIds],
  };

  state.drag = {
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    draggedIds: [],
  };

  return result;
}

export function startConnectionPreview(
  state: InteractionState,
  sourceId: UUID,
  sourcePoint: Point
): void {
  state.connectionPreview = {
    isActive: true,
    sourceId,
    sourcePoint: { ...sourcePoint },
    currentPoint: { ...sourcePoint },
  };
}

export function updateConnectionPreview(
  state: InteractionState,
  point: Point
): void {
  if (state.connectionPreview.isActive) {
    state.connectionPreview.currentPoint = { ...point };
  }
}

export function endConnectionPreview(
  state: InteractionState
): { sourceId: UUID; sourcePoint: Point; endPoint: Point } | null {
  if (
    !state.connectionPreview.isActive ||
    !state.connectionPreview.sourceId ||
    !state.connectionPreview.sourcePoint ||
    !state.connectionPreview.currentPoint
  ) {
    return null;
  }

  const result = {
    sourceId: state.connectionPreview.sourceId,
    sourcePoint: { ...state.connectionPreview.sourcePoint },
    endPoint: { ...state.connectionPreview.currentPoint },
  };

  state.connectionPreview = {
    isActive: false,
    sourceId: null,
    sourcePoint: null,
    currentPoint: null,
  };

  return result;
}

export function startSelectionBox(state: InteractionState, point: Point): void {
  state.selectionBox = {
    isActive: true,
    startPoint: { ...point },
    currentPoint: { ...point },
  };
}

export function updateSelectionBox(
  state: InteractionState,
  point: Point
): void {
  if (state.selectionBox.isActive) {
    state.selectionBox.currentPoint = { ...point };
  }
}

export function endSelectionBox(state: InteractionState): Rect | null {
  if (
    !state.selectionBox.isActive ||
    !state.selectionBox.startPoint ||
    !state.selectionBox.currentPoint
  ) {
    return null;
  }

  const s = state.selectionBox.startPoint;
  const e = state.selectionBox.currentPoint;

  const rect: Rect = {
    x: Math.min(s.x, e.x),
    y: Math.min(s.y, e.y),
    width: Math.abs(e.x - s.x),
    height: Math.abs(e.y - s.y),
  };

  state.selectionBox = {
    isActive: false,
    startPoint: null,
    currentPoint: null,
  };

  return rect;
}

export function showNodeCreationPreview(
  state: InteractionState,
  position: Point
): void {
  state.nodeCreationPreview = {
    isActive: true,
    position: { ...position },
  };
}

export function hideNodeCreationPreview(state: InteractionState): void {
  state.nodeCreationPreview = {
    isActive: false,
    position: null,
  };
}

export function updateMousePosition(
  state: InteractionState,
  point: Point | null
): void {
  state.mousePosition = point ? { ...point } : null;
}

export function setHoveredItem(
  state: InteractionState,
  id: UUID | null,
  type: AssetType | null
): void {
  state.hoveredItemId = id;
  state.hoveredItemType = type;
}

export function setSelectedItems(
  state: InteractionState,
  items: SelectedItem[]
): void {
  state.selectedItems = items.map((i) => ({ ...i }));
}

export function clearSelection(state: InteractionState): void {
  state.selectedItems = [];
}

export function resetAllPreviews(state: InteractionState): void {
  state.drag = {
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    draggedIds: [],
  };
  state.connectionPreview = {
    isActive: false,
    sourceId: null,
    sourcePoint: null,
    currentPoint: null,
  };
  state.selectionBox = {
    isActive: false,
    startPoint: null,
    currentPoint: null,
  };
  state.nodeCreationPreview = {
    isActive: false,
    position: null,
  };
}
