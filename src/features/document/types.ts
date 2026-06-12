/**
 * 질문·응답 양식의 질문(항목) 객체 모델.
 * 유형은 카드 우하단 드롭다운으로 변경 — 현재 상세 뷰는 단일 선택만,
 * 나머지 유형은 상태만 보관하고 뷰는 유형별로 순차 작업 예정.
 */
export type QnaQuestionType =
  | 'single'
  | 'multiple'
  | 'short'
  | 'long'
  | 'score'
  | 'section';

export interface QnaQuestion {
  id: string;
  type: QnaQuestionType;
  /** 질문 텍스트 */
  title: string;
  /** 선택지 — 선택형 유형에서 사용 */
  options: string[];
  /** '기타 :' 자유 입력 옵션 포함 여부 (질문당 1개) */
  hasEtcOption: boolean;
  /** 부가 설명 — section(제목 및 설명)에서 사용 */
  description?: string;
  /** 점수 범위 — score에서 사용 (미지정 시 1~5) */
  scoreMin?: number;
  scoreMax?: number;
  /** 점수 최소/최대 라벨 (선택 사항) — score에서 사용 */
  scoreMinLabel?: string;
  scoreMaxLabel?: string;
}

/** 뷰 페이지에서 채우는 응답 값 — 화면 표시·출력용, 저장하지 않는다 */
export interface QnaAnswer {
  /** 선택된 옵션 인덱스 — single은 1개, multiple은 여러 개 */
  selected?: number[];
  /** '기타' 선택 여부 */
  etcChecked?: boolean;
  /** '기타' 자유 입력 텍스트 */
  etcText?: string;
  /** 단답/장문 응답 텍스트 */
  text?: string;
  /** 점수 선택 값 */
  score?: number;
}
