import type { TemplateListItem } from '../types';

/**
 * 상담 노트 양식 카테고리.
 * 서버에 카테고리 컬럼이 없어 프론트에서 템플릿 id로 매핑한다.
 */
export type NoteFormCategory = 'institution' | 'caseConceptualization';

/** 카테고리 표시 라벨 */
export const NOTE_FORM_CATEGORY_LABEL: Record<NoteFormCategory, string> = {
  institution: '기관 및 센터 제출용',
  caseConceptualization: '이론별 사례개념화',
};

/** 섹션 렌더 순서 */
export const NOTE_FORM_CATEGORY_ORDER: NoteFormCategory[] = [
  'institution',
  'caseConceptualization',
];

/**
 * 이론별 사례개념화 템플릿 id 목록.
 *
 * 서버에 카테고리 컬럼이 없어 프론트 상수로 관리한다. 여기 없는 id는
 * 기본값(기관 및 센터 제출용)으로 분류된다. 새 사례개념화 노트 추가 시 id를 더한다.
 */
export const CASE_CONCEPTUALIZATION_TEMPLATE_IDS = new Set<number>([
  1, 2, 3, 5, 7, 8, 11, 12, 18, 19, 21, 22, 25, 26, 27, 28, 29,
]);

/** 템플릿 id의 카테고리 (사례개념화 목록에 없으면 기관 및 센터 제출용). */
export function getNoteFormCategory(templateId: number): NoteFormCategory {
  return CASE_CONCEPTUALIZATION_TEMPLATE_IDS.has(templateId)
    ? 'caseConceptualization'
    : 'institution';
}

/** 카테고리별로 템플릿을 그룹핑 (순서는 NOTE_FORM_CATEGORY_ORDER). */
export function groupTemplatesByCategory(
  templates: TemplateListItem[]
): Record<NoteFormCategory, TemplateListItem[]> {
  const groups: Record<NoteFormCategory, TemplateListItem[]> = {
    institution: [],
    caseConceptualization: [],
  };
  for (const template of templates) {
    groups[getNoteFormCategory(template.id)].push(template);
  }
  return groups;
}
