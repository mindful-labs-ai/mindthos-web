import { NodeSize } from '../types/enums';
import type { Point, UUID } from '../types/types';
import { generateId } from '../types/types';

// Annotation Style
export interface AnnotationStyle {
  size: typeof NodeSize[keyof typeof NodeSize];
  bgColor: string;
  textColor: string;
  borderStyle: string;
  borderColor: string;
}

// Annotation Layout (style은 layout 하위)
export interface AnnotationLayout {
  center: Point;
  style: AnnotationStyle;
}

// Annotation
export interface Annotation {
  id: UUID;
  text: string;
  layout: AnnotationLayout;
}

export function createAnnotation(
  text: string = '',
  position: Point,
  id: UUID = generateId()
): Annotation {
  return {
    id,
    text,
    layout: {
      center: position,
      style: {
        size: NodeSize.Default,
        bgColor: '#FFFFFF',
        textColor: '#000000',
        borderStyle: 'solid',
        borderColor: '#000000',
      },
    },
  };
}

export type AnnotationUpdate = Partial<Omit<Annotation, 'id'>>;
