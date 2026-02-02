import { createTextLayout } from '../layout/layout-state';
import type { TextLayout } from '../layout/layout-state';
import type { Annotation, AnnotationUpdate } from '../models/text-annotation';
import { createAnnotation } from '../models/text-annotation';
import type { Point, UUID } from '../types/types';

import type { EditorState } from './base';
import { BaseCommand } from './base';

export class AddAnnotationCommand extends BaseCommand {
  readonly type = 'ADD_ANNOTATION';
  private annotation: Annotation;
  private textLayout: TextLayout;

  constructor(text: string, position: Point, id?: UUID) {
    super();
    this.annotation = createAnnotation(text, position, id);
    this.textLayout = createTextLayout(this.annotation.id, position);
  }

  execute(state: EditorState): EditorState {
    state.genogram.annotations.set(this.annotation.id, { ...this.annotation });
    state.layout.texts.set(this.textLayout.textId, { ...this.textLayout });
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    state.genogram.annotations.delete(this.annotation.id);
    state.layout.texts.delete(this.textLayout.textId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  getAnnotationId(): UUID {
    return this.annotation.id;
  }
}

export class DeleteAnnotationCommand extends BaseCommand {
  readonly type = 'DELETE_ANNOTATION';
  private annotationId: UUID;
  private annotationBackup?: Annotation;
  private textLayoutBackup?: TextLayout;

  constructor(annotationId: UUID) {
    super();
    this.annotationId = annotationId;
  }

  execute(state: EditorState): EditorState {
    const annotation = state.genogram.annotations.get(this.annotationId);
    const textLayout = state.layout.texts.get(this.annotationId);

    if (!this.annotationBackup && annotation) this.annotationBackup = structuredClone(annotation);
    if (!this.textLayoutBackup && textLayout) this.textLayoutBackup = { ...textLayout, position: { ...textLayout.position } };

    state.genogram.annotations.delete(this.annotationId);
    state.layout.texts.delete(this.annotationId);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (this.annotationBackup) {
      state.genogram.annotations.set(this.annotationId, this.annotationBackup);
    }
    if (this.textLayoutBackup) {
      state.layout.texts.set(this.annotationId, this.textLayoutBackup);
    }
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }
}

export class UpdateAnnotationCommand extends BaseCommand {
  readonly type = 'UPDATE_ANNOTATION';
  private annotationId: UUID;
  private updates: AnnotationUpdate;
  private previousValues?: Annotation;

  constructor(annotationId: UUID, updates: AnnotationUpdate) {
    super();
    this.annotationId = annotationId;
    this.updates = updates;
  }

  execute(state: EditorState): EditorState {
    const annotation = state.genogram.annotations.get(this.annotationId);
    if (!annotation) return state;

    if (!this.previousValues) this.previousValues = structuredClone(annotation);

    if (this.updates.text !== undefined) {
      annotation.text = this.updates.text;
    }
    if (this.updates.layout) {
      annotation.layout = { ...annotation.layout, ...this.updates.layout };
    }

    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  undo(state: EditorState): EditorState {
    if (!this.previousValues) return state;
    state.genogram.annotations.set(this.annotationId, this.previousValues);
    state.genogram.metadata.updatedAt = new Date();
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return (
      other instanceof UpdateAnnotationCommand &&
      other.annotationId === this.annotationId
    );
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof UpdateAnnotationCommand)) return this;
    const merged = new UpdateAnnotationCommand(this.annotationId, {
      ...this.updates,
      ...other.updates,
    });
    merged.previousValues = this.previousValues;
    return merged;
  }
}

export class MoveAnnotationCommand extends BaseCommand {
  readonly type = 'MOVE_ANNOTATION';
  private annotationId: UUID;
  private newPosition: Point;
  private previousPosition?: Point;

  constructor(annotationId: UUID, newPosition: Point) {
    super();
    this.annotationId = annotationId;
    this.newPosition = { ...newPosition };
  }

  execute(state: EditorState): EditorState {
    const annotation = state.genogram.annotations.get(this.annotationId);
    const textLayout = state.layout.texts.get(this.annotationId);
    if (!annotation || !textLayout) return state;

    if (!this.previousPosition) this.previousPosition = { ...annotation.layout.center };
    annotation.layout.center = { ...this.newPosition };
    textLayout.position = { ...this.newPosition };
    return state;
  }

  undo(state: EditorState): EditorState {
    if (!this.previousPosition) return state;
    const annotation = state.genogram.annotations.get(this.annotationId);
    const textLayout = state.layout.texts.get(this.annotationId);
    if (!annotation || !textLayout) return state;

    annotation.layout.center = { ...this.previousPosition };
    textLayout.position = { ...this.previousPosition };
    return state;
  }

  canMerge(other: BaseCommand): boolean {
    return (
      other instanceof MoveAnnotationCommand &&
      other.annotationId === this.annotationId
    );
  }

  merge(other: BaseCommand): BaseCommand {
    if (!(other instanceof MoveAnnotationCommand)) return this;
    const merged = new MoveAnnotationCommand(
      this.annotationId,
      other.newPosition
    );
    merged.previousPosition = this.previousPosition;
    return merged;
  }
}
