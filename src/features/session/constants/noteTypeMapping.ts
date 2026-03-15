import type { NoteType } from '../types';

/**
 * Template ID를 Note Type으로 매핑하는 상수
 * 필요에 따라 이 매핑을 수정하여 사용
 */
export const TEMPLATE_ID_TO_NOTE_TYPE: Record<number, NoteType> = {
  1: '마음토스 노트',
  2: '인간중심',
  3: 'ACT',
  5: 'CBT',
  7: '사티어',
  8: '보웬',
  11: '미누친',
  12: 'EFT',
  13: 'EAP',
  15: '가족센터',
  16: '접수면접',
  18: '대상관계이론',
  19: '게슈탈트',
  20: 'Wee',
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
 * - succeeded 상태인 노트만 포함
 * - title이 있으면 title 사용, 없으면 template_id 매핑 사용
 */
export function getNoteTypesFromProgressNotes(
  progressNotes: Array<{
    template_id: number | null;
    title?: string | null;
    processing_status?: string;
  }>
): NoteType[] {
  if (!progressNotes || progressNotes.length === 0) {
    return [];
  }

  // succeeded 상태인 노트만 필터링
  const succeededNotes = progressNotes.filter(
    (pn) => pn.processing_status === 'succeeded'
  );

  if (succeededNotes.length === 0) {
    return [];
  }

  const types = succeededNotes
    .map((pn) => {
      // title이 있으면 title 사용
      if (pn.title) {
        return pn.title as NoteType;
      }
      // 없으면 template_id 매핑 사용
      return getNoteTypeFromTemplateId(pn.template_id);
    })
    .filter((type): type is NoteType => type !== null);

  // 중복 제거
  const uniqueTypes = Array.from(new Set(types));

  return uniqueTypes;
}
