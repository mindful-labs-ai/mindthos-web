import type { NoteType } from '../types';

/**
 * Template ID를 Note Type으로 매핑하는 상수
 * 필요에 따라 이 매핑을 수정하여 사용
 */
export const TEMPLATE_ID_TO_NOTE_TYPE: Record<number, NoteType> = {
  1: '마음토스 노트',
  2: 'CBT',
  3: '보웬 가족치료',
  4: '인간중심',
  5: '사티어 경험적가족치료',
  6: 'DBT',
  7: '미누친 구조적가족치료',
  8: 'MI',
  9: '슈퍼바이저',
  10: 'EAP',
  11: '아들러 심리치료',
  12: '가족센터 노트',
  13: '게슈탈트 심리치료',
  14: 'ACT',
  15: '접수면접 노트',
};

/**
 * 기본 노트 타입 (템플릿이 없거나 매핑되지 않은 경우)
 */
export const DEFAULT_NOTE_TYPE: NoteType = '마음토스 노트';

/**
 * Template ID를 기반으로 Note Type 반환
 */
export function getNoteTypeFromTemplateId(
  templateId: number | null
): NoteType | null {
  if (templateId === null) return null;
  return TEMPLATE_ID_TO_NOTE_TYPE[templateId] || null;
}

/**
 * Progress Notes 배열을 Note Types 배열로 변환
 */
export function getNoteTypesFromProgressNotes(
  progressNotes: Array<{ template_id: number | null }>
): NoteType[] {
  if (!progressNotes || progressNotes.length === 0) {
    return [DEFAULT_NOTE_TYPE];
  }

  const types = progressNotes
    .map((pn) => getNoteTypeFromTemplateId(pn.template_id))
    .filter((type): type is NoteType => type !== null);

  // 중복 제거
  const uniqueTypes = Array.from(new Set(types));

  return uniqueTypes.length > 0 ? uniqueTypes : [DEFAULT_NOTE_TYPE];
}
