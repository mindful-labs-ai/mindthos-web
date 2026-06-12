import type { QnaQuestion, QnaQuestionType } from '../types';

/** 질문 유형 라벨 — 유형 드롭다운 표기 (아이콘은 @/shared/icons의 QnaQuestionTypeIcons) */
export const QNA_QUESTION_TYPE_LABEL: Record<QnaQuestionType, string> = {
  single: '단일 선택',
  multiple: '다중 선택',
  short: '단답형',
  long: '장문형',
  score: '점수',
  section: '제목 및 설명',
};

/** 새 질문 기본값 — 단일 선택 + 빈 옵션 1개로 시작 (옵션 N은 placeholder) */
export function createQnaQuestion(): QnaQuestion {
  return {
    id: `question-${Date.now()}`,
    type: 'single',
    title: '',
    options: [''],
    hasEtcOption: false,
  };
}

/** 선택형(옵션 목록 사용) 유형 여부 */
export function isChoiceQuestion(type: QnaQuestionType): boolean {
  return type === 'single' || type === 'multiple';
}

/** 선택형 질문에 빈 옵션이 있는지 — 있으면 저장 비활성 */
export function hasEmptyQnaOption(question: QnaQuestion): boolean {
  return (
    isChoiceQuestion(question.type) &&
    question.options.some((option) => option.trim().length === 0)
  );
}

/** 저장된 질문 JSON 파싱 — 형식이 다르면 빈 목록 */
export function parseQnaQuestions(content: string | null): QnaQuestion[] {
  if (!content) return [];
  try {
    const parsed: unknown = JSON.parse(content);
    return Array.isArray(parsed) ? (parsed as QnaQuestion[]) : [];
  } catch {
    return [];
  }
}

/** 질문 복제 — 새 id 부여, 옵션 배열 분리 */
export function duplicateQnaQuestion(source: QnaQuestion): QnaQuestion {
  return {
    ...source,
    id: `question-${Date.now()}`,
    options: [...source.options],
  };
}
