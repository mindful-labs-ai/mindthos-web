import { generateId } from "../core/types.js";
import { LayoutState } from "../layout/layout-state.js";
import { Genogram } from "../models/genogram.js";

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

export abstract class BaseCommand implements Command {
  readonly id: string = generateId();
  abstract readonly type: string;

  abstract execute(state: EditorState): EditorState;
  abstract undo(state: EditorState): EditorState;

  canMerge(_other: Command): boolean {
    return false;
  }

  merge(_other: Command): Command {
    return this;
  }
}

export class CompositeCommand extends BaseCommand {
  readonly type = "COMPOSITE";

  constructor(private readonly commands: Command[]) {
    super();
  }

  execute(state: EditorState): EditorState {
    return this.commands.reduce((s, cmd) => cmd.execute(s), state);
  }

  undo(state: EditorState): EditorState {
    return [...this.commands].reverse().reduce((s, cmd) => cmd.undo(s), state);
  }
}
