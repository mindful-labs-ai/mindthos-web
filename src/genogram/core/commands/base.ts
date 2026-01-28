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
  execute(state: EditorState): EditorState;
  undo(state: EditorState): EditorState;
  canMerge(other: Command): boolean;
  merge(other: Command): Command;
}

export class BaseCommand implements Command {
  readonly id: string = generateId();
  readonly type: string = '';

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
