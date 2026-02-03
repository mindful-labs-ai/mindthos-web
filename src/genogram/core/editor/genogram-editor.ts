import {
  AddAnnotationCommand,
  DeleteAnnotationCommand,
  MoveAnnotationCommand,
  UpdateAnnotationCommand,
} from '../commands/annotation-commands';
import type { Command, EditorState } from '../commands/base';
import {
  AddConnectionCommand,
  DeleteConnectionCommand,
  UpdateConnectionEntityCommand,
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
  resolveFetusStatus,
} from '../commands/node-commands';
import {
  DeselectAllCommand,
  SelectNodesCommand,
  SetOffsetCommand,
  SetZoomCommand,
  ToggleGridSnapCommand,
} from '../commands/view-commands';
import { GRID_GAP } from '../constants/grid';
import type { LayoutConfig } from '../layout/layout-engine';
import { LayoutEngine } from '../layout/layout-engine';
import type {
  LayoutState,
  NodeLayout,
  SerializedLayoutState,
} from '../layout/layout-state';
import {
  createEdgeLayout,
  createLayoutState,
  createNodeLayout,
  createTextLayout,
  deserializeLayout,
  serializeLayout,
} from '../layout/layout-state';
import { ConnectionIndex } from '../models/connection-index';
import type { Genogram, SerializedGenogram } from '../models/genogram';
import {
  createGenogram,
  deserializeGenogram,
  serializeGenogram,
} from '../models/genogram';
import type { Subject } from '../models/person';
import {
  createAnimalSubject,
  createFetusSubject,
  createPersonSubject,
} from '../models/person';
import {
  createRelationConnection,
  createInfluenceConnection,
  createPartnerConnection,
  createParentChildConnection,
  createGroupConnection,
} from '../models/relationship';
import type {
  Connection,
  ConnectionLayout,
  GroupMemberPosition,
} from '../models/relationship';
import type { AnnotationUpdate } from '../models/text-annotation';
import {
  AssetType,
  ConnectionType,
  Gender as GenderEnum,
  Illness,
  ParentChildStatus as ParentChildStatusEnum,
  PartnerStatus,
  RelationStatus,
  SubjectType as SubjectTypeEnum,
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
      connectionIndex: new ConnectionIndex(),
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
    const cmd = this.createAddSubjectCmd(
      createPersonSubject(gender, position),
      position,
      generation
    );
    this.execute(cmd);
    return cmd.getSubjectId();
  }

  addAnimal(position: Point, generation = 0): UUID {
    const cmd = this.createAddSubjectCmd(
      createAnimalSubject(position),
      position,
      generation
    );
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
    status: (typeof RelationStatus)[keyof typeof RelationStatus] = RelationStatus.Connected
  ): UUID {
    const cmd = new AddConnectionCommand(
      createRelationConnection(subjectId1, subjectId2, status)
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addInfluenceConnection(
    startRef: UUID,
    endRef: UUID,
    status: InfluenceStatus
  ): UUID {
    const cmd = new AddConnectionCommand(
      createInfluenceConnection(startRef, endRef, status)
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addPartnerConnection(
    subjectId1: UUID,
    subjectId2: UUID,
    status: (typeof PartnerStatus)[keyof typeof PartnerStatus] = PartnerStatus.Marriage
  ): UUID {
    const cmd = new AddConnectionCommand(
      createPartnerConnection(subjectId1, subjectId2, status)
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addParentChildConnection(
    parentRef: UUID,
    childRef: UUID | [UUID, UUID],
    status: ParentChildStatus
  ): UUID {
    const cmd = new AddConnectionCommand(
      createParentChildConnection(parentRef, childRef, status)
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  addGroupConnection(
    memberIds: UUID[],
    memberPositions: GroupMemberPosition[]
  ): UUID {
    const cmd = new AddConnectionCommand(
      createGroupConnection(memberIds, memberPositions)
    );
    this.execute(cmd);
    return cmd.getConnectionId();
  }

  deleteConnection(connectionId: UUID): void {
    this.execute(new DeleteConnectionCommand(connectionId));
  }

  updateConnectionEntity(
    connectionId: UUID,
    updates: Partial<Connection>
  ): void {
    if (updates.entity) {
      this.execute(
        new UpdateConnectionEntityCommand(connectionId, updates.entity)
      );
    }
    if (updates.layout) {
      this.execute(
        new UpdateConnectionLayoutCommand(connectionId, updates.layout)
      );
    }
  }

  updateConnectionLayout(
    connectionId: UUID,
    updates: Partial<ConnectionLayout>
  ): void {
    this.execute(new UpdateConnectionLayoutCommand(connectionId, updates));
  }

  /**
   * 가족 복합 생성: 아버지 + 어머니 + 자녀(남성) + 파트너선 + 부모-자녀선
   * 단일 트랜잭션으로 실행되어 undo 한 번에 전체 롤백.
   */
  addFamily(clickPosition: Point): {
    fatherId: UUID;
    motherId: UUID;
    childId: UUID;
  } {
    const gap = GRID_GAP;

    const fatherPos = {
      x: clickPosition.x - 3 * gap,
      y: clickPosition.y - 2 * gap,
    };
    const motherPos = {
      x: clickPosition.x + 3 * gap,
      y: clickPosition.y - 2 * gap,
    };
    const childPos = { x: clickPosition.x, y: clickPosition.y + 3 * gap };

    const fatherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Male, fatherPos),
      fatherPos,
      0
    );
    const motherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Female, motherPos),
      motherPos,
      0
    );
    const childCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Male, childPos),
      childPos,
      1
    );

    const partnerCmd = new AddConnectionCommand(
      createPartnerConnection(
        fatherCmd.getSubjectId(),
        motherCmd.getSubjectId(),
        PartnerStatus.Marriage
      )
    );

    const parentChildCmd = new AddConnectionCommand(
      createParentChildConnection(
        partnerCmd.getConnectionId(),
        childCmd.getSubjectId(),
        ParentChildStatusEnum.Biological_Child
      )
    );

    this.executeMultiple([
      fatherCmd,
      motherCmd,
      childCmd,
      partnerCmd,
      parentChildCmd,
    ]);

    return {
      fatherId: fatherCmd.getSubjectId(),
      motherId: motherCmd.getSubjectId(),
      childId: childCmd.getSubjectId(),
    };
  }

  /**
   * 부모 쌍 복합 생성: 아버지 + 어머니 + 파트너선 + 부모-자녀선
   * 선택된 자녀 Subject의 위쪽에 배치. 단일 트랜잭션으로 undo 한 번에 전체 롤백.
   */
  addParentPair(childId: UUID): {
    fatherId: UUID;
    motherId: UUID;
    partnerLineId: UUID;
    parentChildLineId: UUID;
  } {
    const childLayout = this.state.layout.nodes.get(childId);
    if (!childLayout) {
      throw new Error(`Subject layout not found: ${childId}`);
    }

    const gap = GRID_GAP;
    const childPos = childLayout.position;

    const fatherPos = {
      x: childPos.x - 3 * gap,
      y: childPos.y - 5 * gap,
    };
    const motherPos = {
      x: childPos.x + 3 * gap,
      y: childPos.y - 5 * gap,
    };

    const fatherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Male, fatherPos),
      fatherPos,
      0
    );
    const motherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Female, motherPos),
      motherPos,
      0
    );

    const partnerCmd = new AddConnectionCommand(
      createPartnerConnection(
        fatherCmd.getSubjectId(),
        motherCmd.getSubjectId(),
        PartnerStatus.Marriage
      )
    );

    const parentChildCmd = new AddConnectionCommand(
      createParentChildConnection(
        partnerCmd.getConnectionId(),
        childId,
        ParentChildStatusEnum.Biological_Child
      )
    );

    this.executeMultiple([fatherCmd, motherCmd, partnerCmd, parentChildCmd]);

    return {
      fatherId: fatherCmd.getSubjectId(),
      motherId: motherCmd.getSubjectId(),
      partnerLineId: partnerCmd.getConnectionId(),
      parentChildLineId: parentChildCmd.getConnectionId(),
    };
  }

  /**
   * 파트너 Subject를 생성하고 파트너선을 연결합니다.
   * 소스 Subject의 성별에 따라 반대 성별을 자동 선택합니다.
   * 단일 트랜잭션으로 undo 한 번에 전체 롤백.
   */
  addPartnerAtPosition(
    sourceId: UUID,
    position: Point
  ): { partnerId: UUID; partnerLineId: UUID } {
    const source = this.state.genogram.subjects.get(sourceId);
    let partnerGender: Gender = GenderEnum.Male;
    if (source?.entity.type === SubjectTypeEnum.Person) {
      const sourceGender = (source.entity.attribute as { gender?: Gender })
        .gender;
      if (sourceGender === GenderEnum.Male) partnerGender = GenderEnum.Female;
      else if (sourceGender === GenderEnum.Female)
        partnerGender = GenderEnum.Male;
    }

    const partnerCmd = this.createAddSubjectCmd(
      createPersonSubject(partnerGender, position),
      position,
      0
    );
    const connectionCmd = new AddConnectionCommand(
      createPartnerConnection(
        sourceId,
        partnerCmd.getSubjectId(),
        PartnerStatus.Marriage
      )
    );

    this.executeMultiple([partnerCmd, connectionCmd]);

    return {
      partnerId: partnerCmd.getSubjectId(),
      partnerLineId: connectionCmd.getConnectionId(),
    };
  }

  /**
   * Subject의 타입(Person↔Animal)을 변환하거나 Person의 성별을 변경합니다.
   * Person→Animal: 이름·사망여부를 보존하고 나머지 Person 속성은 버림
   * Animal→Person: 이름·사망여부를 보존하고 Person 기본값으로 초기화
   * Person→Person: 성별만 변경
   */
  convertSubjectType(subjectId: UUID, targetType: string): void {
    const subject = this.state.genogram.subjects.get(subjectId);
    if (!subject) return;

    // Fetus Subject는 타입 변환 대상이 아님
    if (subject.entity.type === SubjectTypeEnum.Fetus) return;

    const currentAttr = subject.entity.attribute;
    const currentName =
      'name' in currentAttr ? (currentAttr.name as string | null) : null;
    const currentIsDead =
      'isDead' in currentAttr ? (currentAttr.isDead as boolean) : false;
    const currentMemo = subject.entity.memo;

    if (targetType === SubjectTypeEnum.Animal) {
      // → Animal 전환
      this.updateSubject(subjectId, {
        entity: {
          type: SubjectTypeEnum.Animal,
          attribute: { name: currentName, isDead: currentIsDead },
          memo: currentMemo,
        },
      });
    } else {
      // → Person 전환 또는 성별 변경
      const genderValue = targetType as Gender;
      if (subject.entity.type === SubjectTypeEnum.Animal) {
        this.updateSubject(subjectId, {
          entity: {
            type: SubjectTypeEnum.Person,
            attribute: {
              gender: genderValue,
              name: currentName,
              isDead: currentIsDead,
              lifeSpan: { birth: null, death: null },
              age: null,
              illness: Illness.None,
              extraInfo: {
                enable: false,
                job: null,
                education: null,
                region: null,
              },
            },
            memo: currentMemo,
          },
        });
      } else {
        // Person → Person 성별 변경
        this.updateSubject(subjectId, {
          entity: {
            ...subject.entity,
            attribute: { ...currentAttr, gender: genderValue },
          },
        });
      }
    }
  }

  /**
   * 지정된 Subject가 태아 타입(유산/낙태/임신 중)인지 확인합니다.
   */
  isFetusSubject(subjectId: UUID): boolean {
    const subject = this.state.genogram.subjects.get(subjectId);
    if (!subject) return false;
    return subject.entity.type === SubjectTypeEnum.Fetus;
  }

  /**
   * parentRef(파트너선 ID 또는 Subject ID) 아래에 자녀 Subject를 생성하고
   * 부모-자녀선을 연결합니다.
   * 쌍둥이(Twins, Identical_Twins)일 때는 자녀 2명을 생성합니다.
   */
  addChildToParentRef(
    parentRef: UUID,
    childStatus: ParentChildStatus
  ): { childIds: UUID[]; parentChildLineId: UUID } {
    const gap = GRID_GAP;
    let basePos: Point;

    // parentRef가 파트너선인지 Subject인지 판별
    const connection = this.state.genogram.connections.get(parentRef);
    if (connection && 'subjects' in connection.entity.attribute) {
      // 파트너선 → 두 부모의 중간 아래
      const attr = connection.entity
        .attribute as import('../models/relationship').PartnerAttribute;
      const sourceLayout = this.state.layout.nodes.get(attr.subjects[0]);
      const targetLayout = this.state.layout.nodes.get(attr.subjects[1]);
      if (!sourceLayout || !targetLayout) {
        throw new Error('Partner source/target layout not found');
      }
      const midX = (sourceLayout.position.x + targetLayout.position.x) / 2;
      const bottomY = Math.max(
        sourceLayout.position.y,
        targetLayout.position.y
      );
      basePos = { x: midX, y: bottomY + 4 * gap };
    } else {
      // Subject ID → 해당 Subject 바로 아래
      const parentLayout = this.state.layout.nodes.get(parentRef);
      if (!parentLayout) {
        throw new Error(`Parent layout not found: ${parentRef}`);
      }
      basePos = {
        x: parentLayout.position.x,
        y: parentLayout.position.y + 4 * gap,
      };
    }

    const isTwins =
      childStatus === ParentChildStatusEnum.Twins ||
      childStatus === ParentChildStatusEnum.Identical_Twins;

    const fetusStatus = resolveFetusStatus(childStatus);

    const existingCenters = Array.from(this.state.layout.nodes.values()).map(
      (n) => n.position
    );

    const avoidCollision = (pos: Point): Point => {
      let finalPos = pos;
      for (const center of existingCenters) {
        if (
          Math.abs(center.x - finalPos.x) < gap &&
          Math.abs(center.y - finalPos.y) < gap
        ) {
          finalPos = { x: finalPos.x + 2 * gap, y: finalPos.y };
        }
      }
      return finalPos;
    };

    if (isTwins) {
      // 쌍둥이: 자녀 2명 생성, childRef = [UUID, UUID]
      const pos1 = avoidCollision({
        x: basePos.x - 2 * gap,
        y: basePos.y,
      });
      const pos2 = avoidCollision({
        x: basePos.x + 2 * gap,
        y: basePos.y,
      });
      const child1Cmd = this.createAddSubjectCmd(
        createPersonSubject(GenderEnum.Male, pos1),
        pos1,
        0
      );
      const child2Cmd = this.createAddSubjectCmd(
        createPersonSubject(GenderEnum.Female, pos2),
        pos2,
        0
      );
      const parentChildCmd = new AddConnectionCommand(
        createParentChildConnection(
          parentRef,
          [child1Cmd.getSubjectId(), child2Cmd.getSubjectId()],
          childStatus
        )
      );
      this.executeMultiple([child1Cmd, child2Cmd, parentChildCmd]);
      return {
        childIds: [child1Cmd.getSubjectId(), child2Cmd.getSubjectId()],
        parentChildLineId: parentChildCmd.getConnectionId(),
      };
    }

    // 단일 자녀
    const finalPos = avoidCollision(basePos);
    const childCmd = fetusStatus
      ? this.createAddSubjectCmd(
          createFetusSubject(fetusStatus, finalPos),
          finalPos,
          0
        )
      : this.createAddSubjectCmd(
          createPersonSubject(GenderEnum.Male, finalPos),
          finalPos,
          0
        );
    const parentChildCmd = new AddConnectionCommand(
      createParentChildConnection(
        parentRef,
        childCmd.getSubjectId(),
        childStatus
      )
    );
    this.executeMultiple([childCmd, parentChildCmd]);
    return {
      childIds: [childCmd.getSubjectId()],
      parentChildLineId: parentChildCmd.getConnectionId(),
    };
  }

  /**
   * 기존 Subject를 parentRef(파트너선 ID 또는 Subject ID)에 자녀로 연결합니다.
   */
  addChildConnectionToParentRef(
    parentRef: UUID,
    childId: UUID,
    childStatus: ParentChildStatus
  ): UUID {
    return this.addParentChildConnection(parentRef, childId, childStatus);
  }

  /**
   * 형제자매 추가: 선택된 Subject의 부모 연결을 찾아 형제를 추가합니다.
   * - 부모 연결(Children_Parents_Line)이 있으면 그 parentRef로 자녀 추가
   * - 부모 연결이 없으면 먼저 부모 쌍을 생성한 후 형제 추가
   */
  addSibling(subjectId: UUID): { siblingId: UUID } {
    // 1. 해당 Subject를 childRef로 참조하는 Children_Parents_Line 찾기
    const connIds = this.state.connectionIndex.getBySubject(subjectId);
    let parentRef: UUID | null = null;

    for (const connId of connIds) {
      const conn = this.state.genogram.connections.get(connId);
      if (!conn) continue;
      if (conn.entity.type !== ConnectionType.Children_Parents_Line) continue;
      const attr = conn.entity.attribute as { parentRef: UUID; childRef: UUID | [UUID, UUID] };
      // childRef가 이 subject를 포함하는지 확인
      const childRef = attr.childRef;
      const isChild = Array.isArray(childRef)
        ? childRef.includes(subjectId)
        : childRef === subjectId;
      if (isChild) {
        parentRef = attr.parentRef;
        break;
      }
    }

    if (parentRef) {
      // 부모 연결이 있으면 그 parentRef로 형제 추가
      const result = this.addChildToParentRef(
        parentRef,
        ParentChildStatusEnum.Biological_Child
      );
      return { siblingId: result.childIds[0] };
    }

    // 부모 연결이 없으면 부모 쌍 + 형제를 한 트랜잭션으로 생성 (undo 1회)
    const childLayout = this.state.layout.nodes.get(subjectId);
    if (!childLayout) {
      throw new Error(`Subject layout not found: ${subjectId}`);
    }
    const gap = GRID_GAP;
    const childPos = childLayout.position;

    // 어머니를 기존보다 4칸 오른쪽으로 → 형제가 자연스럽게 원래 자녀 옆에 배치
    const fatherPos = { x: childPos.x - 3 * gap, y: childPos.y - 5 * gap };
    const motherPos = { x: childPos.x + 7 * gap, y: childPos.y - 5 * gap };
    const siblingPos = { x: childPos.x + 4 * gap, y: childPos.y };

    const fatherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Male, fatherPos), fatherPos, 0
    );
    const motherCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Female, motherPos), motherPos, 0
    );
    const partnerCmd = new AddConnectionCommand(
      createPartnerConnection(
        fatherCmd.getSubjectId(), motherCmd.getSubjectId(), PartnerStatus.Marriage
      )
    );
    const childLineCmd = new AddConnectionCommand(
      createParentChildConnection(
        partnerCmd.getConnectionId(), subjectId, ParentChildStatusEnum.Biological_Child
      )
    );
    const siblingCmd = this.createAddSubjectCmd(
      createPersonSubject(GenderEnum.Male, siblingPos), siblingPos, 0
    );
    const siblingLineCmd = new AddConnectionCommand(
      createParentChildConnection(
        partnerCmd.getConnectionId(), siblingCmd.getSubjectId(), ParentChildStatusEnum.Biological_Child
      )
    );

    this.executeMultiple([fatherCmd, motherCmd, partnerCmd, childLineCmd, siblingCmd, siblingLineCmd]);
    return { siblingId: siblingCmd.getSubjectId() };
  }

  // Annotation Operations
  addAnnotation(text: string, position: Point): UUID {
    const cmd = new AddAnnotationCommand(text, position);
    this.execute(cmd);
    return cmd.getAnnotationId();
  }

  deleteAnnotation(annotationId: UUID): void {
    this.execute(new DeleteAnnotationCommand(annotationId));
  }

  updateAnnotation(annotationId: UUID, updates: AnnotationUpdate): void {
    this.execute(new UpdateAnnotationCommand(annotationId, updates));
  }

  moveAnnotation(annotationId: UUID, position: Point): void {
    this.execute(new MoveAnnotationCommand(annotationId, position));
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
      } else if (item.type === AssetType.Text) {
        commands.push(new DeleteAnnotationCommand(item.id));
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
      case ToolMode.Select_Tool:
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

      case ToolMode.Multi_Select_Tool:
        startSelectionBox(this.interaction, point);
        break;

      case ToolMode.Pan_Tool:
        startDrag(this.interaction, point, []);
        break;

      case ToolMode.Create_Connection_Tool:
        if (node) {
          startConnectionPreview(this.interaction, node.nodeId, node.position);
        }
        break;

      case ToolMode.Create_Subject_Tool:
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
      } else if (mode === ToolMode.Pan_Tool && result) {
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
    const genogram = deserializeGenogram(data.genogram);
    const connectionIndex = new ConnectionIndex();
    connectionIndex.rebuild(genogram.connections);

    this.state = {
      genogram,
      layout: deserializeLayout(data.layout),
      connectionIndex,
    };
    this.viewSettings.updateSettings(data.viewSettings);
    this.commandManager.clear();
    this.syncSelectionFromLayout();
    this.emit('state-change');
  }

  toJSON(): string {
    // ViewSettings → genogram.view.visibility 동기화
    this.state.genogram.view.visibility = {
      ...this.viewSettings.getSettings(),
    };
    return JSON.stringify(serializeGenogram(this.state.genogram), null, 2);
  }

  fromJSON(json: string): void {
    const serialized = JSON.parse(json) as SerializedGenogram;
    const genogram = deserializeGenogram(serialized);
    const connectionIndex = new ConnectionIndex();
    connectionIndex.rebuild(genogram.connections);

    const layout = createLayoutState();
    genogram.subjects.forEach((subject, id) => {
      layout.nodes.set(id, createNodeLayout(id, subject.layout.center));
    });
    genogram.connections.forEach((_conn, id) => {
      layout.edges.set(id, createEdgeLayout(id));
    });
    genogram.annotations.forEach((annotation, id) => {
      layout.texts.set(id, createTextLayout(id, annotation.layout.center));
    });

    this.state = { genogram, layout, connectionIndex };
    // genogram.view.visibility → ViewSettings 동기화
    this.viewSettings.updateSettings(genogram.view.visibility);
    this.commandManager.clear();
    this.syncSelectionFromLayout();
    this.emit('state-change');
    this.emit('view-change', this.viewSettings.getSettings());
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

  private createAddSubjectCmd(
    subject: Subject,
    position: Point,
    generation: number
  ): AddSubjectCommand {
    const layout = createNodeLayout(subject.id, position, generation);
    return new AddSubjectCommand(subject, layout);
  }
}
