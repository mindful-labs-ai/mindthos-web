import type { Command, EditorState } from './base';
import { CompositeCommand } from './base';

export type HistoryEvent = 'execute' | 'undo' | 'redo' | 'clear';
export type HistoryListener = (event: HistoryEvent, command?: Command) => void;

export interface CommandManagerConfig {
  maxHistorySize: number;
  autoMerge: boolean;
  mergeThreshold: number;
}

const DEFAULT_CONFIG: CommandManagerConfig = {
  maxHistorySize: 100,
  autoMerge: true,
  mergeThreshold: 300,
};

export class CommandManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private lastExecuteTime = 0;
  private savedIndex = -1;
  private listeners: HistoryListener[] = [];
  private config: CommandManagerConfig;

  constructor(config: Partial<CommandManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  execute(command: Command, state: EditorState): EditorState {
    // UI 상태 변경(선택, 줌, 팬 등)은 실행만 하고 히스토리에 기록하지 않음
    if (!command.recordInHistory) {
      return command.execute(state);
    }

    const now = Date.now();

    if (
      this.config.autoMerge &&
      this.undoStack.length > 0 &&
      now - this.lastExecuteTime < this.config.mergeThreshold
    ) {
      const last = this.undoStack[this.undoStack.length - 1];
      if (last.canMerge(command)) {
        const merged = last.merge(command);
        this.undoStack[this.undoStack.length - 1] = merged;
        this.lastExecuteTime = now;
        const undone = last.undo(state);
        const result = merged.execute(undone);
        this.notify('execute', merged);
        return result;
      }
    }

    const newState = command.execute(state);
    this.undoStack.push(command);

    if (this.undoStack.length > this.config.maxHistorySize) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.lastExecuteTime = now;
    this.notify('execute', command);

    return newState;
  }

  executeTransaction(commands: Command[], state: EditorState): EditorState {
    if (commands.length === 0) return state;

    const result = commands.reduce((s, cmd) => cmd.execute(s), state);

    if (commands.length === 1) {
      this.undoStack.push(commands[0]);
    } else {
      this.undoStack.push(new CompositeCommand(commands));
    }

    if (this.undoStack.length > this.config.maxHistorySize) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    this.notify('execute');
    return result;
  }

  undo(state: EditorState): EditorState {
    if (!this.canUndo()) return state;

    const command = this.undoStack.pop()!;
    const newState = command.undo(state);
    this.redoStack.push(command);
    this.notify('undo', command);

    return newState;
  }

  redo(state: EditorState): EditorState {
    if (!this.canRedo()) return state;

    const command = this.redoStack.pop()!;
    const newState = command.execute(state);
    this.undoStack.push(command);
    this.notify('redo', command);

    return newState;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.savedIndex = -1;
    this.notify('clear');
  }

  markSaved(): void {
    this.savedIndex = this.undoStack.length;
  }

  hasUnsavedChanges(): boolean {
    return this.undoStack.length !== this.savedIndex;
  }

  getUndoCount(): number {
    return this.undoStack.length;
  }

  getRedoCount(): number {
    return this.redoStack.length;
  }

  addListener(listener: HistoryListener): void {
    this.listeners.push(listener);
  }

  removeListener(listener: HistoryListener): void {
    const idx = this.listeners.indexOf(listener);
    if (idx !== -1) this.listeners.splice(idx, 1);
  }

  private notify(event: HistoryEvent, command?: Command): void {
    this.listeners.forEach((fn) => fn(event, command));
  }
}
