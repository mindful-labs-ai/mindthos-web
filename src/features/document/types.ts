/**
 * 문서(동의서·질문지) content의 단일 모델 — `FormField` discriminated union.
 * mindthos-server `entity/document-template/type/form-field.type.ts`의 웹 미러(필드/키 동일).
 *
 * content jsonb 봉투: `{ version, fields: FormField[] }`. CONSENT/QNA 공통(kind는 카테고리·UX 힌트일 뿐
 * content 모양은 동일). 각 변형은 field `type`으로 판별되며 변형별 필수 키만 가진다.
 *
 * 내담자 응답: `{ answers: Record<fieldKey, FieldAnswer> }`. FieldAnswer는 해당 필드 type에 대응.
 */

export const FORM_CONTENT_VERSION = 1 as const;

export type FormFieldType =
  | 'section'
  | 'richtext'
  | 'short'
  | 'long'
  | 'single'
  | 'multiple'
  | 'score'
  | 'consent';

/** 선택형(single/multiple) 옵션. value는 안정 식별자, label은 표시 텍스트. */
export interface FormFieldOption {
  value: string;
  label: string;
  crisis?: boolean;
}

interface FormFieldBase {
  /** 문서 내 고유 키(응답 답변맵의 키이자 안정 식별자). */
  key: string;
}

/** 헤딩(제목·설명) — 응답 없음. */
export interface SectionField extends FormFieldBase {
  type: 'section';
  title: string;
  description?: string;
}

/** 동의서 안내문 본문(리치 HTML) — 응답 없음. */
export interface RichtextField extends FormFieldBase {
  type: 'richtext';
  html: string;
}

/** 단답 입력. */
export interface ShortField extends FormFieldBase {
  type: 'short';
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
}

/** 장문 입력. area는 SCT 등 정성 해석 메타. */
export interface LongField extends FormFieldBase {
  type: 'long';
  label: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  area?: string;
}

/** 단일 선택. */
export interface SingleField extends FormFieldBase {
  type: 'single';
  label: string;
  required: boolean;
  options: FormFieldOption[];
  allowOther?: boolean;
}

/** 다중 선택. */
export interface MultipleField extends FormFieldBase {
  type: 'multiple';
  label: string;
  required: boolean;
  options: FormFieldOption[];
  allowOther?: boolean;
}

/** 점수/척도. PHQ/GAD는 각 값에 라벨이 필요해 scaleOptions로 표현. */
export interface ScoreField extends FormFieldBase {
  type: 'score';
  label: string;
  required: boolean;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  scaleOptions?: FormFieldOption[];
}

/** 항목별 동의 체크. sensitive=true면 민감정보(개보법 §23 별도 동의) 항목. */
export interface ConsentField extends FormFieldBase {
  type: 'consent';
  label: string;
  required: boolean;
  sensitive: boolean;
}

export type FormField =
  | SectionField
  | RichtextField
  | ShortField
  | LongField
  | SingleField
  | MultipleField
  | ScoreField
  | ConsentField;

/**
 * content jsonb 봉투 — 동의서/질문지 공통.
 * requireSignature: 동의서 등 최종 서명이 필요한 문서. true면 제출 시 내담자 최종 서명(1회)을 요구하고,
 *   문서 하단에 이름(내담자)/날짜(제출일)/서명을 자동 렌더한다. 서명은 더 이상 필드가 아니라 문서 레벨이다.
 */
export interface DocumentContent {
  version: typeof FORM_CONTENT_VERSION;
  fields: FormField[];
  requireSignature?: boolean;
}

// ── 응답 ─────────────────────────────────────────────────────────────────────

/** short/long 응답. */
export interface TextAnswer {
  text: string;
}
/** single/multiple 응답 — 선택된 옵션 value 목록(single은 1개). otherText는 '기타' 자유입력. */
export interface ChoiceAnswer {
  selected: string[];
  otherText?: string;
}
/** score 응답. */
export interface ScoreAnswer {
  score: number;
}
/** consent 응답. */
export interface ConsentAnswer {
  agreed: boolean;
}

/** 필드 1개 답변 — 대응 필드 type으로 형태가 정해진다. */
export type FieldAnswer =
  | TextAnswer
  | ChoiceAnswer
  | ScoreAnswer
  | ConsentAnswer;

/**
 * 내담자 제출 응답(jsonb) — 필드키 → 답변. section/richtext는 키 없음.
 * signatureDataUrl: 문서 레벨 최종 서명 이미지(data:image/ URL). requireSignature 문서에서 필수.
 *   서명자명=내담자명, 서명일=제출 시각으로 렌더 시 파생한다.
 */
export interface DocumentResponse {
  answers: Record<string /* fieldKey */, FieldAnswer>;
  signatureDataUrl?: string;
}
