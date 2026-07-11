/** 노트 양식 분류 — 서버 enum(templates.category) 값. */
export type TemplateCategoryValue = 'SUBMISSION' | 'CASE_CONCEPTUALIZATION';

export interface Template {
  id: number;
  title: string;
  description: string;
  prompt: string;
  created_at: string;
  /**
   * 노트 양식 분류(DB). 마이그레이션 전 환경/구 데이터에선 없을 수 있어 optional —
   * 없으면 기본값(기관·센터 제출용)으로 분류한다.
   */
  category?: TemplateCategoryValue;
}

export interface TemplateListItem extends Template {
  pin: boolean;
  is_default: boolean;
}
