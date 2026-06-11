/**
 * 다회기 분석(AI 슈퍼비전) 결과 JSON 스키마 (고정 구조 V2).
 *
 * 머신이 strict 스키마로 client_analyses.content에 고정 구조 JSON으로 저장한다.
 * 라벨(label)은 AI가 템플릿 지침대로 채우고, 섹션 제목·S3 표 헤더·S0 유무는
 * 프론트 config(template_id별, `@/widgets/client/supervision/structure`)가 제공한다.
 *
 * (구 버전 row는 Markdown 문자열 또는 구 section/block JSON이라 하위호환으로 별도 처리됨)
 */

/** 라벨/본문 한 쌍. 라벨은 굵게, value는 본문 문단으로 렌더. */
export interface KVItem {
  label: string;
  value: string;
}

/** section0/1/4/5: 라벨-본문 목록만 가진 섹션. */
export interface KVSection {
  items: KVItem[];
}

/** section2의 회기별 평가 블록. */
export interface S2Session {
  session_label: string;
  items: KVItem[];
}

/** section2: 회기별 상세 평가 + 전체 변화 궤적. */
export interface S2Section {
  sessions: S2Session[];
  trajectory: string;
}

/** section3 축어록 표의 한 행 (회기 / 발언 / 이론 분석 / 대안). */
export interface S3Row {
  session: string;
  speech: string;
  analysis: string;
  alternative: string;
}

/** section3: 축어록 정밀 분석 표. */
export interface S3Section {
  rows: S3Row[];
}

/** section6: 촉진적 질문 목록. */
export interface S6Section {
  questions: string[];
}

/**
 * 고정 구조 다회기 분석 보고서.
 * section0은 자동감지 템플릿에서만 존재(없으면 null).
 */
export interface SupervisionReportV2 {
  section0: KVSection | null;
  section1: KVSection;
  section2: S2Section;
  section3: S3Section;
  section4: KVSection;
  section5: KVSection;
  section6: S6Section;
}

/** 고정 구조 보고서의 섹션 키. */
export type SupervisionSectionKey =
  | 'section0'
  | 'section1'
  | 'section2'
  | 'section3'
  | 'section4'
  | 'section5'
  | 'section6';
