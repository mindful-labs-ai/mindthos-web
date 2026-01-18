import { Command, EditorState } from '../commands/base.js';
import {
  AddChildRelationshipCommand,
  AddEmotionalRelationshipCommand,
  AddPartnerRelationshipCommand,
  DeleteRelationshipCommand,
  SetArrowDirectionCommand,
  SetEdgeLabelCommand,
  UpdateEdgeStyleCommand,
} from '../commands/edge-commands.js';
import { CommandManager, CommandManagerConfig } from '../commands/manager.js';
import {
  AddPersonCommand,
  DeletePersonCommand,
  MoveMultipleNodesCommand,
  MoveNodeCommand,
  UpdatePersonCommand,
} from '../commands/node-commands.js';
import {
  DeselectAllCommand,
  SelectNodesCommand,
  SetOffsetCommand,
  SetZoomCommand,
  ToggleGridSnapCommand,
} from '../commands/view-commands.js';
import {
  ArrowDirection,
  AssetType,
  ChildStatus,
  EmotionalStatus,
  Gender,
  PartnerStatus,
  ToolMode,
} from '../types/enums.js';
import { Point, Rect, UUID } from '../types/types.js';
import { LayoutConfig, LayoutEngine } from '../layout/layout-engine.js';
import {
  EdgeLayout,
  LayoutState,
  NodeLayout,
  SerializedLayoutState,
  createLayoutState,
  deserializeLayout,
  serializeLayout,
} from '../layout/layout-state.js';
import {
  Genogram,
  SerializedGenogram,
  createGenogram,
  deserializeGenogram,
  serializeGenogram,
} from '../models/genogram.js';
import { Person } from '../models/person.js';
import {
  InteractionState,
  SelectedItem,
  createInteractionState,
  endConnectionPreview,
  endDrag,
  endSelectionBox,
  hideNodeCreationPreview,
  setHoveredItem,
  setToolMode as setInteractionToolMode,
  setSelectedItems,
  showNodeCreationPreview,
  startConnectionPreview,
  startDrag,
  startSelectionBox,
  updateConnectionPreview,
  updateDrag,
  updateMousePosition,
  updateSelectionBox,
} from './interaction-state.js';
import { ViewDisplaySettings, ViewSettings } from './view-settings.js';

export type EditorEventType =
  | 'state-change'
  | 'selection-change'
  | 'view-change'
  | 'tool-change'
  | 'interaction-change';

export type EditorEventListener = (
  event: EditorEventType,
  data?: unknown
) => void;

export interface EditorConfig {
  commandManager?: Partial<CommandManagerConfig>;
  layout?: Partial<LayoutConfig>;
  autoSaveInterval?: number;
}

export interface SerializedEditor {
  genogram: SerializedGenogram;
  layout: SerializedLayoutState;
  viewSettings: ViewDisplaySettings;
}

export class GenogramEditor {
  private state: EditorState;
  private commandManager: CommandManager;
  private layoutEngine: LayoutEngine;
  private viewSettings: ViewSettings;
  private interaction: InteractionState;
  private listeners: EditorEventListener[] = [];
  private autoSaveTimer?: ReturnType<typeof setInterval>;

  constructor(config: EditorConfig = {}) {
    this.state = {
      genogram: createGenogram('Untitled'),
      layout: createLayoutState(),
    };

    this.commandManager = new CommandManager(config.commandManager);
    this.layoutEngine = new LayoutEngine(config.layout);
    this.viewSettings = new ViewSettings();
    this.interaction = createInteractionState();

    if (config.autoSaveInterval && config.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        this.emit('state-change', { autoSave: true });
      }, config.autoSaveInterval);
    }
  }

  dispose(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    this.listeners = [];
  }

  // State Access
  getGenogram(): Readonly<Genogram> {
    return this.state.genogram;
  }

  getLayout(): Readonly<LayoutState> {
    return this.state.layout;
  }

  getInteraction(): Readonly<InteractionState> {
    return this.interaction;
  }

  getViewSettings(): ViewDisplaySettings {
    return this.viewSettings.getSettings();
  }

  getLayoutEngine(): LayoutEngine {
    return this.layoutEngine;
  }

  // Tool Mode
  setToolMode(mode: ToolMode): void {
    setInteractionToolMode(this.interaction, mode);
    this.emit('tool-change', mode);
  }

  getToolMode(): ToolMode {
    return this.interaction.toolMode;
  }

  // Commands
  private execute(command: Command): void {
    this.state = this.commandManager.execute(command, this.state);
    this.emit('state-change');
  }

  private executeMultiple(commands: Command[]): void {
    if (commands.length === 0) return;
    this.state = this.commandManager.executeTransaction(commands, this.state);
    this.emit('state-change');
  }

  undo(): boolean {
    if (!this.commandManager.canUndo()) return false;
    this.state = this.commandManager.undo(this.state);
    this.syncSelectionFromLayout();
    this.emit('state-change');
    return true;
  }

  redo(): boolean {
    if (!this.commandManager.canRedo()) return false;
    this.state = this.commandManager.redo(this.state);
    this.syncSelectionFromLayout();
    this.emit('state-change');
    return true;
  }

  canUndo(): boolean {
    return this.commandManager.canUndo();
  }

  canRedo(): boolean {
    return this.commandManager.canRedo();
  }

  hasUnsavedChanges(): boolean {
    return this.commandManager.hasUnsavedChanges();
  }

  markSaved(): void {
    this.commandManager.markSaved();
  }

  // Person Operations
  addPerson(
    name: string,
    gender: Gender,
    position: Point,
    generation = 0
  ): UUID {
    const snapped = this.state.layout.canvas.gridSnap
      ? this.layoutEngine.snapToGrid(
          position,
          this.state.layout.canvas.gridSize
        )
      : position;

    const nodes = Array.from(this.state.layout.nodes.values());
    const finalPos = this.layoutEngine.findNonCollidingPosition(snapped, nodes);

    const cmd = new AddPersonCommand(name, gender, finalPos, generation);
    this.execute(cmd);
    return cmd.getPersonId();
  }

  deletePerson(personId: UUID): void {
    this.execute(new DeletePersonCommand(personId));
  }

  updatePerson(personId: UUID, updates: Partial<Person>): void {
    this.execute(new UpdatePersonCommand(personId, updates));
  }

  movePerson(personId: UUID, position: Point): void {
    const snapped = this.state.layout.canvas.gridSnap
      ? this.layoutEngine.snapToGrid(
          position,
          this.state.layout.canvas.gridSize
        )
      : position;
    this.execute(new MoveNodeCommand(personId, snapped));
  }

  moveMultiplePersons(moves: { personId: UUID; position: Point }[]): void {
    const gridSize = this.state.layout.canvas.gridSize;
    const snap = this.state.layout.canvas.gridSnap;

    const snappedMoves = moves.map((m) => ({
      nodeId: m.personId,
      newPosition: snap
        ? this.layoutEngine.snapToGrid(m.position, gridSize)
        : m.position,
    }));

    this.execute(new MoveMultipleNodesCommand(snappedMoves));
  }

  // Relationship Operations
  addPartnerRelationship(
    personId1: UUID,
    personId2: UUID,
    status: PartnerStatus = PartnerStatus.Married
  ): UUID {
    const pos1 = this.state.layout.nodes.get(personId1)?.position ?? {
      x: 0,
      y: 0,
    };
    const pos2 = this.state.layout.nodes.get(personId2)?.position ?? {
      x: 0,
      y: 0,
    };

    const cmd = new AddPartnerRelationshipCommand(
      personId1,
      personId2,
      pos1,
      pos2,
      status
    );
    this.execute(cmd);
    return cmd.getRelationshipId();
  }

  addChildRelationship(
    parentId: UUID,
    childId: UUID,
    status: ChildStatus = ChildStatus.Biological,
    parentRelationshipId?: UUID
  ): UUID {
    const parentPos = this.state.layout.nodes.get(parentId)?.position ?? {
      x: 0,
      y: 0,
    };
    const childPos = this.state.layout.nodes.get(childId)?.position ?? {
      x: 0,
      y: 0,
    };

    let sourcePos = parentPos;
    if (parentRelationshipId) {
      const edge = this.state.layout.edges.get(parentRelationshipId);
      if (edge?.virtualAnchor) {
        sourcePos = edge.virtualAnchor;
      }
    }

    const cmd = new AddChildRelationshipCommand(
      parentId,
      childId,
      sourcePos,
      childPos,
      status,
      parentRelationshipId
    );
    this.execute(cmd);
    return cmd.getRelationshipId();
  }

  addEmotionalRelationship(
    personId1: UUID,
    personId2: UUID,
    status: EmotionalStatus = EmotionalStatus.Basic
  ): UUID {
    const pos1 = this.state.layout.nodes.get(personId1)?.position ?? {
      x: 0,
      y: 0,
    };
    const pos2 = this.state.layout.nodes.get(personId2)?.position ?? {
      x: 0,
      y: 0,
    };

    const cmd = new AddEmotionalRelationshipCommand(
      personId1,
      personId2,
      pos1,
      pos2,
      status
    );
    this.execute(cmd);
    return cmd.getRelationshipId();
  }

  deleteRelationship(relationshipId: UUID): void {
    this.execute(new DeleteRelationshipCommand(relationshipId));
  }

  setEdgeArrowDirection(edgeId: UUID, direction: ArrowDirection): void {
    this.execute(new SetArrowDirectionCommand(edgeId, direction));
  }

  setEdgeLabel(edgeId: UUID, label: string): void {
    this.execute(new SetEdgeLabelCommand(edgeId, label));
  }

  updateEdgeStyle(edgeId: UUID, updates: Partial<EdgeLayout>): void {
    this.execute(new UpdateEdgeStyleCommand(edgeId, updates));
  }

  // Selection
  select(ids: UUID[], clearOthers = true): void {
    this.execute(new SelectNodesCommand(ids, clearOthers));
    this.syncSelectionFromLayout();
    this.emit('selection-change', this.interaction.selectedItems);
  }

  deselectAll(): void {
    this.execute(new DeselectAllCommand());
    setSelectedItems(this.interaction, []);
    this.emit('selection-change', []);
  }

  getSelectedItems(): SelectedItem[] {
    return [...this.interaction.selectedItems];
  }

  deleteSelected(): void {
    const items = this.interaction.selectedItems;
    if (items.length === 0) return;

    const commands: Command[] = [];

    items.forEach((item) => {
      if (item.type === AssetType.Node) {
        commands.push(new DeletePersonCommand(item.id));
      } else if (item.type === AssetType.Edge) {
        commands.push(new DeleteRelationshipCommand(item.id));
      }
    });

    if (commands.length > 0) {
      this.executeMultiple(commands);
      setSelectedItems(this.interaction, []);
      this.emit('selection-change', []);
    }
  }

  private syncSelectionFromLayout(): void {
    const items: SelectedItem[] = [];

    this.state.layout.nodes.forEach((node, id) => {
      if (node.isSelected) items.push({ id, type: AssetType.Node });
    });
    this.state.layout.edges.forEach((edge, id) => {
      if (edge.isSelected) items.push({ id, type: AssetType.Edge });
    });
    this.state.layout.texts.forEach((text, id) => {
      if (text.isSelected) items.push({ id, type: AssetType.Text });
    });

    setSelectedItems(this.interaction, items);
  }

  // Canvas
  setZoom(zoom: number): void {
    this.execute(new SetZoomCommand(zoom));
  }

  getZoom(): number {
    return this.state.layout.canvas.zoomLevel;
  }

  setOffset(offset: Point): void {
    this.execute(new SetOffsetCommand(offset));
  }

  getOffset(): Point {
    return { ...this.state.layout.canvas.offset };
  }

  toggleGridSnap(): void {
    this.execute(new ToggleGridSnapCommand());
  }

  isGridSnapEnabled(): boolean {
    return this.state.layout.canvas.gridSnap;
  }

  // View Settings
  updateViewSettings(updates: Partial<ViewDisplaySettings>): void {
    this.viewSettings.updateSettings(updates);
    this.emit('view-change', this.viewSettings.getSettings());
  }

  // Interaction Handlers
  handleMouseDown(point: Point): void {
    const mode = this.interaction.toolMode;
    const node = this.layoutEngine.findNodeAtPoint(this.state.layout, point);

    updateMousePosition(this.interaction, point);

    switch (mode) {
      case ToolMode.Select:
        if (node) {
          if (!node.isSelected) {
            this.select([node.nodeId]);
          }
          const selectedIds = this.interaction.selectedItems
            .filter((i) => i.type === AssetType.Node)
            .map((i) => i.id);
          startDrag(this.interaction, point, selectedIds);
        } else {
          this.deselectAll();
        }
        break;

      case ToolMode.MultiSelect:
        startSelectionBox(this.interaction, point);
        break;

      case ToolMode.Pan:
        startDrag(this.interaction, point, []);
        break;

      case ToolMode.Connect:
        if (node) {
          startConnectionPreview(this.interaction, node.nodeId, node.position);
        }
        break;

      case ToolMode.CreateNode:
        showNodeCreationPreview(this.interaction, point);
        break;
    }

    this.emit('interaction-change', this.interaction);
  }

  handleMouseMove(point: Point): void {
    updateMousePosition(this.interaction, point);

    const node = this.layoutEngine.findNodeAtPoint(this.state.layout, point);
    setHoveredItem(
      this.interaction,
      node?.nodeId ?? null,
      node ? AssetType.Node : null
    );

    if (this.interaction.drag.isDragging) {
      updateDrag(this.interaction, point);
    }

    if (this.interaction.connectionPreview.isActive) {
      updateConnectionPreview(this.interaction, point);
    }

    if (this.interaction.selectionBox.isActive) {
      updateSelectionBox(this.interaction, point);
    }

    if (this.interaction.nodeCreationPreview.isActive) {
      showNodeCreationPreview(this.interaction, point);
    }

    this.emit('interaction-change', this.interaction);
  }

  handleMouseUp(point: Point): void {
    const mode = this.interaction.toolMode;

    if (this.interaction.drag.isDragging) {
      const result = endDrag(this.interaction);
      if (result && result.ids.length > 0) {
        const dx = result.endPoint.x - result.startPoint.x;
        const dy = result.endPoint.y - result.startPoint.y;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          const moves = result.ids.map((id) => {
            const node = this.state.layout.nodes.get(id);
            return {
              personId: id,
              position: {
                x: (node?.position.x ?? 0) + dx,
                y: (node?.position.y ?? 0) + dy,
              },
            };
          });
          this.moveMultiplePersons(moves);
        }
      } else if (mode === ToolMode.Pan && result) {
        const dx = result.endPoint.x - result.startPoint.x;
        const dy = result.endPoint.y - result.startPoint.y;
        const current = this.state.layout.canvas.offset;
        this.setOffset({ x: current.x + dx, y: current.y + dy });
      }
    }

    if (this.interaction.connectionPreview.isActive) {
      const result = endConnectionPreview(this.interaction);
      if (result) {
        const targetNode = this.layoutEngine.findNodeAtPoint(
          this.state.layout,
          point
        );
        if (targetNode && targetNode.nodeId !== result.sourceId) {
          this.addEmotionalRelationship(result.sourceId, targetNode.nodeId);
        }
      }
    }

    if (this.interaction.selectionBox.isActive) {
      const rect = endSelectionBox(this.interaction);
      if (rect) {
        const nodes = this.layoutEngine.findNodesInRect(
          this.state.layout,
          rect
        );
        if (nodes.length > 0) {
          this.select(nodes.map((n) => n.nodeId));
        }
      }
    }

    if (this.interaction.nodeCreationPreview.isActive) {
      hideNodeCreationPreview(this.interaction);
    }

    this.emit('interaction-change', this.interaction);
  }

  handleWheel(delta: number): void {
    const current = this.state.layout.canvas.zoomLevel;
    const factor = delta > 0 ? 0.9 : 1.1;
    this.setZoom(current * factor);
  }

  // Hit Testing
  getNodeAtPoint(point: Point): NodeLayout | undefined {
    return this.layoutEngine.findNodeAtPoint(this.state.layout, point);
  }

  getNodesInRect(rect: Rect): NodeLayout[] {
    return this.layoutEngine.findNodesInRect(this.state.layout, rect);
  }

  // Auto Layout
  autoLayout(): void {
    this.layoutEngine.autoLayoutByGeneration(this.state.layout);
    this.emit('state-change');
  }

  // Serialization
  serialize(): SerializedEditor {
    return {
      genogram: serializeGenogram(this.state.genogram),
      layout: serializeLayout(this.state.layout),
      viewSettings: this.viewSettings.getSettings(),
    };
  }

  deserialize(data: SerializedEditor): void {
    this.state = {
      genogram: deserializeGenogram(data.genogram),
      layout: deserializeLayout(data.layout),
    };
    this.viewSettings.updateSettings(data.viewSettings);
    this.commandManager.clear();
    this.syncSelectionFromLayout();
    this.emit('state-change');
  }

  toJSON(): string {
    return JSON.stringify(this.serialize());
  }

  fromJSON(json: string): void {
    this.deserialize(JSON.parse(json));
  }

  // Event System
  on(listener: EditorEventListener): () => void {
    this.listeners.push(listener);
    return () => this.off(listener);
  }

  off(listener: EditorEventListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  private emit(event: EditorEventType, data?: unknown): void {
    this.listeners.forEach((fn) => fn(event, data));
  }
}
