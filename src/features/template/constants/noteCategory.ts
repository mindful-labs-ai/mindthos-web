import type { TemplateCategoryValue, TemplateListItem } from '../types';

/**
 * 상담 노트 양식 카테고리.
 * DB(templates.category)의 서버 enum을 프론트 표시 키로 매핑한다.
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

/** 서버 enum(templates.category) → 프론트 카테고리 키. */
const SERVER_CATEGORY_TO_NOTE_FORM: Record<
  TemplateCategoryValue,
  NoteFormCategory
> = {
  SUBMISSION: 'institution',
  CASE_CONCEPTUALIZATION: 'caseConceptualization',
};

/**
 * 템플릿의 카테고리 — DB category 값으로 판정.
 * 값이 없거나(마이그레이션 전/구 데이터) 알 수 없으면 기본값(기관 및 센터 제출용).
 */
export function getNoteFormCategory(
  template: Pick<TemplateListItem, 'category'>
): NoteFormCategory {
  const category = template.category;
  if (!category) return 'institution';
  return SERVER_CATEGORY_TO_NOTE_FORM[category] ?? 'institution';
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
    groups[getNoteFormCategory(template)].push(template);
  }
  return groups;
}
