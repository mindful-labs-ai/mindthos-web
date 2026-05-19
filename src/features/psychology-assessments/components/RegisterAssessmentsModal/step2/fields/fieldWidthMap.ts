import type { LeafInputType } from '../../../../utils/schemaToFields';

/**
 * input 종류별 최대 너비 (px).
 * undefined면 full width.
 * 추후 디자인 확정 시 이 매핑만 조정.
 */
export const FIELD_MAX_WIDTH: Record<LeafInputType, number | undefined> = {
  text: 302,
  number: 81,
  date: 186,
  percent: 81,
  enum: undefined, // chip group — auto
  textarea: undefined, // full
  'array-of-numbers': undefined,
  union: 200,
};
