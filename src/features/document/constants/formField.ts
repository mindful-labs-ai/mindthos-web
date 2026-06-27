import {
  FORM_CONTENT_VERSION,
  type DocumentContent,
  type FormField,
  type FormFieldOption,
  type FormFieldType,
} from '../types';

/** 필드 유형 라벨 — 유형 드롭다운 표기 (아이콘은 @/shared/icons의 FormFieldTypeIcons) */
export const FIELD_TYPE_LABEL: Record<FormFieldType, string> = {
  section: '제목 및 설명',
  richtext: '안내문(본문)',
  short: '단답형',
  long: '장문형',
  single: '단일 선택',
  multiple: '다중 선택',
  score: '점수',
  consent: '동의 항목',
  signature: '서명',
};

/** 선택형(옵션 목록 사용) 유형 여부 */
export function isChoiceField(type: FormFieldType): boolean {
  return type === 'single' || type === 'multiple';
}

/** 새 필드 key 생성용 증가 카운터 — 한 세션 내 고유 보장 */
let fieldKeySeq = 0;

/** 새 필드 key — `field-{seq}` (충돌 없는 안정 식별자) */
function nextFieldKey(): string {
  fieldKeySeq += 1;
  return `field-${Date.now()}-${fieldKeySeq}`;
}

/** 새 옵션 value 생성용 증가 카운터 — 인덱스 기반 충돌(중간 삭제 후 재추가) 방지 */
let optionValueSeq = 0;

/** 새 옵션 value — `option-{시각}-{seq}` (개수와 무관한 고유 식별자) */
function nextOptionValue(): string {
  optionValueSeq += 1;
  return `option-${Date.now()}-${optionValueSeq}`;
}

/** 선택형 옵션 1개 생성 — label은 빈값, value는 충돌 없는 안정 식별자 */
function newOption(): FormFieldOption {
  return { value: nextOptionValue(), label: '' };
}

/** 새 필드 — 유형별 기본값. 미지정 시 단일 선택(옵션 1개)로 시작. */
export function createField(type: FormFieldType = 'single'): FormField {
  const key = nextFieldKey();
  switch (type) {
    case 'section':
      return { key, type: 'section', title: '', description: '' };
    case 'richtext':
      return { key, type: 'richtext', html: '' };
    case 'short':
      return { key, type: 'short', label: '', required: true };
    case 'long':
      return { key, type: 'long', label: '', required: true };
    case 'single':
      return {
        key,
        type: 'single',
        label: '',
        required: true,
        options: [newOption()],
      };
    case 'multiple':
      return {
        key,
        type: 'multiple',
        label: '',
        required: true,
        options: [newOption()],
      };
    case 'score':
      return { key, type: 'score', label: '', required: true, min: 1, max: 5 };
    case 'consent':
      return {
        key,
        type: 'consent',
        label: '',
        required: true,
        sensitive: false,
      };
    case 'signature':
      return { key, type: 'signature', label: '', required: true };
    default: {
      // 모든 유형 처리 보장 (컴파일 타임 exhaustiveness)
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** 선택형 필드에 빈 옵션(공백 value/label)이 있는지 — 있으면 저장 비활성 */
export function hasEmptyOption(field: FormField): boolean {
  if (field.type !== 'single' && field.type !== 'multiple') return false;
  return field.options.some(
    (o) => o.value.trim().length === 0 || o.label.trim().length === 0
  );
}

/** 새 옵션 — 충돌 없는 안정 value 부여(개수 비의존) */
export function createOption(): FormFieldOption {
  return newOption();
}

/** content jsonb 파싱 — DocumentContent 형태가 아니면 null */
export function parseContent(content: unknown): DocumentContent | null {
  if (!content) return null;
  let value: unknown = content;
  if (typeof content === 'string') {
    try {
      value = JSON.parse(content);
    } catch {
      return null;
    }
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'fields' in value &&
    Array.isArray((value as { fields: unknown }).fields)
  ) {
    return value as DocumentContent;
  }
  return null;
}

/** content → 필드 목록 (없거나 형식이 다르면 빈 목록) */
export function parseFields(content: unknown): FormField[] {
  return parseContent(content)?.fields ?? [];
}

/** 필드 목록 → content jsonb 봉투 */
export function buildContent(fields: FormField[]): DocumentContent {
  return { version: FORM_CONTENT_VERSION, fields };
}

/**
 * 동의서(kind=consent) content 빌드 — 본문(richtext) + 표준 동의·서명 필드.
 * 동의서 에디터는 본문 HTML만 작성하고, 동의·서명은 자동 부착한다(내담자 화면의
 * 동의 CTA·서명란이 이 필드들에 응답을 저장 — 필드가 없으면 서명이 보관되지 않음).
 */
export function buildConsentContent(html: string): DocumentContent {
  return {
    version: FORM_CONTENT_VERSION,
    fields: [
      { key: nextFieldKey(), type: 'richtext', html },
      {
        key: nextFieldKey(),
        type: 'consent',
        label: '위 내용을 모두 확인하였으며 이에 동의합니다.',
        required: true,
        sensitive: false,
      },
      { key: nextFieldKey(), type: 'signature', label: '서명', required: true },
    ],
  };
}

/** 동의서 content → 본문 HTML(첫 richtext 필드). 편집 진입 시 에디터 초기값. */
export function extractConsentHtml(content: unknown): string {
  const richtext = parseContent(content)?.fields.find(
    (f) => f.type === 'richtext'
  );
  return richtext?.type === 'richtext' ? richtext.html : '';
}

const ALL_FIELD_TYPES: ReadonlySet<FormFieldType> = new Set<FormFieldType>([
  'section',
  'richtext',
  'short',
  'long',
  'single',
  'multiple',
  'score',
  'consent',
  'signature',
]);

/** 단일 필드 유효성 — 서버 validateFields 규칙 미러 */
function isValidField(field: FormField): boolean {
  if (!ALL_FIELD_TYPES.has(field.type)) return false;
  if (typeof field.key !== 'string' || field.key.trim().length === 0) {
    return false;
  }
  switch (field.type) {
    case 'section':
      // 서버 validate-user-document와 동일하게 비어있지 않은 제목 요구(빈 문자 거부).
      return field.title.trim().length > 0;
    case 'richtext':
      return field.html.trim().length > 0;
    case 'short':
    case 'long':
      return field.label.trim().length > 0;
    case 'single':
    case 'multiple': {
      const optionsValid =
        field.label.trim().length > 0 &&
        field.options.length > 0 &&
        field.options.every(
          (o) => o.value.trim().length > 0 && o.label.trim().length > 0
        );
      if (!optionsValid) return false;
      // 한 필드 내 옵션 value 유일(응답 selected가 value 기반 — 중복 시 식별 불가). 서버 규칙 미러.
      const values = field.options.map((o) => o.value);
      return new Set(values).size === values.length;
    }
    case 'score':
      return field.label.trim().length > 0 && field.min < field.max;
    case 'consent':
    case 'signature':
      return field.label.trim().length > 0;
    default:
      return false;
  }
}

/** 필드 목록 전체 유효성 — 비어있지 않고, key 고유, 모든 필드 유효. */
export function validateFields(fields: FormField[]): boolean {
  if (fields.length === 0) return false;
  const keys = new Set<string>();
  for (const field of fields) {
    if (keys.has(field.key)) return false;
    keys.add(field.key);
    if (!isValidField(field)) return false;
  }
  return true;
}

/**
 * 필드 복제 — 새 key 부여 + 옵션 value도 **재발급**.
 * value를 그대로 베끼면 원본과 복제본이 같은 옵션 value를 갖게 되는데, value는
 * 응답 `selected`의 식별자라 "한 필드 내 고유"라는 가정이 깨진다(인덱스 충돌과 같은 부류).
 * 복제는 신규 빈 필드라 기존 응답이 없으므로 value 재발급으로 인한 매핑 단절 위험 없음.
 */
export function duplicateField(source: FormField): FormField {
  const key = nextFieldKey();
  if (source.type === 'single' || source.type === 'multiple') {
    return {
      ...source,
      key,
      options: source.options.map((o) => ({ ...o, value: nextOptionValue() })),
    };
  }
  if (source.type === 'score') {
    return {
      ...source,
      key,
      scaleOptions: source.scaleOptions?.map((o) => ({
        ...o,
        value: nextOptionValue(),
      })),
    };
  }
  return { ...source, key };
}
