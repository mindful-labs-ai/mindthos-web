import type { UUID } from '../types/types';
import { generateId } from '../types/types';

export interface TextAnnotation {
  id: UUID;
  content: string;
  memo?: string;
}

export function createTextAnnotation(
  content: string = '',
  id: UUID = generateId()
): TextAnnotation {
  return { id, content };
}

export type TextAnnotationUpdate = Partial<Omit<TextAnnotation, 'id'>>;
