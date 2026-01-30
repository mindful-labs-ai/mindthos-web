import type { LayoutState } from '../layout/layout-state';
import type { Genogram } from '../models/genogram';
import { generateId } from '../types/types';

export interface EditorState {
  genogram: Genogram;
  layout: LayoutState;
}

export interface Command {
  readonly id: string;
  readonly type: string;
  /** false이면 실행은 하되 undo 스택에 기록하지 않음 (선택, 줌, 팬 등 UI 상태) */
  readonly recordInHistory: boolean;
  execute(state: EditorState): EditorState;
  undo(state: EditorState): EditorState;
  canMerge(other: Command): boolean;
  merge(other: Command): Command;
}

export class BaseCommand implements Command {
  readonly id: string = generateId();
  readonly type: string = '';
  readonly recordInHistory: boolean = true;

  execute(_state: EditorState): EditorState {
    throw new Error('Not implemented');
  }

  undo(_state: EditorState): EditorState {
    throw new Error('Not implemented');
  }

  canMerge(_other: Command): boolean {
    return false;
  }

  merge(_other: Command): Command {
    return this;
  }
}

export class CompositeCommand extends BaseCommand {
  override readonly type = 'COMPOSITE';
  private readonly _commands: Command[];

  constructor(commands: Command[]) {
    super();
    this._commands = commands;
  }

  override execute(state: EditorState): EditorState {
    return this._commands.reduce((s, cmd) => cmd.execute(s), state);
  }

  override undo(state: EditorState): EditorState {
    return [...this._commands].reverse().reduce((s, cmd) => cmd.undo(s), state);
  }
}
