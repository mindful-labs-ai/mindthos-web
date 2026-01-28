import type { Command, EditorState } from '../commands/base';
import {
  AddRelationConnectionCommand,
  AddInfluenceConnectionCommand,
  AddPartnerConnectionCommand,
  AddParentChildConnectionCommand,
  AddGroupConnectionCommand,
  DeleteConnectionCommand,
  UpdateConnectionLayoutCommand,
} from '../commands/edge-commands';
import type { CommandManagerConfig } from '../commands/manager';
import { CommandManager } from '../commands/manager';
import {
  AddSubjectCommand,
  DeleteSubjectCommand,
  MoveMultipleNodesCommand,
  MoveNodeCommand,
  UpdateSubjectCommand,
} from '../commands/node-commands';
import {
  DeselectAllCommand,
  SelectNodesCommand,
  SetOffsetCommand,
  SetZoomCommand,
  ToggleGridSnapCommand,
} from '../commands/view-commands';
import type { LayoutConfig } from '../layout/layout-engine';
import { LayoutEngine } from '../layout/layout-engine';
import type {
  LayoutState,
  NodeLayout,
  SerializedLayoutState,
} from '../layout/layout-state';
import {
  createLayoutState,
  deserializeLayout,
  serializeLayout,
} from '../layout/layout-state';
import type { Genogram, SerializedGenogram } from '../models/genogram';
import {
  createGenogram,
  deserializeGenogram,
  serializeGenogram,
} from '../models/genogram';
import type { Subject } from '../models/person';
import type { ConnectionLayout } from '../models/relationship';
import {
  AssetType,
  PartnerStatus,
  RelationStatus,
  ToolMode,
} from '../types/enums';
import type {
  Gender,
  InfluenceStatus,
  ParentChildStatus,
} from '../types/enums';
import type { Point, Rect, UUID } from '../types/types';

import type { InteractionState, SelectedItem } from './interaction-state';
import {
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
} from './interaction-state';
import type { ViewDisplaySettings } from './view-settings';
import { ViewSettings } from './view-settings';

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
  setToolMode(mode: (typeof ToolMode)[keyof typeof ToolMode]): void {
    setInteractionToolMode(this.interaction, mode);
    this.emit('tool-change', mode);
  }

  getToolMode(): (typeof ToolMode)[keyof typeof ToolMode] {
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

  // Subject Operations
  addSubject(gender: Gender, position: Point, generation = 0): UUID {
    const cmd = new AddSubjectCommand(gender, position, generation);
    this.execute(cmd);
    return cmd.getSubjectId();
  }

  deleteSubject(subjectId: UUID): void {
    this.execute(new DeleteSubjectCommand(subjectId));
  }

  updateSubject(subjectId: UUID, updates: Partial<Subject>): void {
    this.execute(new UpdateSubjectCommand(subjectId, updates));
  }

  moveSubject(subjectId: UUID, position: Point): void {
    const snapped = this.state.layout.canvas.gridSnap
      ? this.layoutEngine.snapToGrid(
          position,
          this.state.layout.canvas.gridSize
        )
      : position;
    this.execute(new MoveNodeCommand(subjectId, snapped));
  }

  moveMultipleSubjects(moves: { subjectId: UUID; position: Point }[]): void {
    const gridSize = this.state.layout.canvas.gridSize;
    const snap = this.state.layout.canvas.gridSnap;

    const snappedMoves = moves.map((m) => ({
      nodeId: m.subjectId,
      newPosition: snap
        ? this.layoutEngine.snapToGrid(m.position, gridSize)
        : m.position,
    }));

    this.execute(new MoveMultipleNodesCommand(snappedMoves));
  }

  // Connection Operations
  addRelationConnection(
    subjectId1: UUID,
    subjectId2: UUID,
    status: (typeof RelationStatus)[keyof typeof RelationStatus] = RelationStatus.연결
  ): UUID {
    const cmd = new AddRelationConnectionCommand(
      subjectId1,
      subjectId2,
      status
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addInfluenceConnection(
    startRef: UUID,
    endRef: UUID,
    status: InfluenceStatus
  ): UUID {
    const cmd = new AddInfluenceConnectionCommand(startRef, endRef, status);
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addPartnerConnection(
    subjectId1: UUID,
    subjectId2: UUID,
    status: (typeof PartnerStatus)[keyof typeof PartnerStatus] = PartnerStatus.결혼
  ): UUID {
    const cmd = new AddPartnerConnectionCommand(subjectId1, subjectId2, status);
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addParentChildConnection(
    parentRef: UUID,
    childRef: UUID | [UUID, UUID],
    status: ParentChildStatus
  ): UUID {
    const cmd = new AddParentChildConnectionCommand(
      parentRef,
      childRef,
      status
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addGroupConnection(subjects: UUID[]): UUID {
    const cmd = new AddGroupConnectionCommand(subjects);
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  deleteConnection(connectionId: UUID): void {
    this.execute(new DeleteConnectionCommand(connectionId));
  }

  updateConnectionLayout(
    connectionId: UUID,
    updates: Partial<ConnectionLayout>
  ): void {
    this.execute(new UpdateConnectionLayoutCommand(connectionId, updates));
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
        commands.push(new DeleteSubjectCommand(item.id));
      } else if (item.type === AssetType.Edge) {
        commands.push(new DeleteConnectionCommand(item.id));
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
      case ToolMode.단일선택도구:
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

      case ToolMode.다중선택도구:
        startSelectionBox(this.interaction, point);
        break;

      case ToolMode.이동도구:
        startDrag(this.interaction, point, []);
        break;

      case ToolMode.관계추가도구:
        if (node) {
          startConnectionPreview(this.interaction, node.nodeId, node.position);
        }
        break;

      case ToolMode.인물추가도구:
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
              subjectId: id,
              position: {
                x: (node?.position.x ?? 0) + dx,
                y: (node?.position.y ?? 0) + dy,
              },
            };
          });
          this.moveMultipleSubjects(moves);
        }
      } else if (mode === ToolMode.이동도구 && result) {
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
          this.addRelationConnection(result.sourceId, targetNode.nodeId);
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
    return JSON.stringify(serializeGenogram(this.state.genogram), null, 2);
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
