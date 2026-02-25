/**
 * PDF 보고서 JSON 스키마
 * 피그마 템플릿의 각 블록이 ReportSection 타입에 대응
 */

// ============================================
// 보고서 전체 구조
// ============================================

export interface GenogramReport {
  meta: ReportMeta;
  sections: ReportSection[];
}

export interface ReportMeta {
  title: string;
  clientName: string;
  counselorName: string;
  createdAt: string;
  logoUrl?: string;
}

// ============================================
// 섹션 타입 (Discriminated Union)
// ============================================

export type ReportSection =
  | CoverSection
  | HeadingSection
  | SubHeadingSection
  | ParagraphSection
  | GenogramImageSection
  | ScoreTableSection
  | BulletListSection
  | KeyValueSection
  | InfoTableSection
  | ProfileSelectSection
  | LetterBoxSection
  | DividerSection
  | PageBreakSection;

/** 표지 - 동적 변수는 4개만 (나머지는 고정 텍스트) */
export interface CoverSection {
  type: 'cover';
  /** 내담자명 */
  clientName: string;
  /** 보고서 생성일 (예: "2026년 2월 23일") */
  createdAt: string;
  /** 상담 기관명 */
  organization: string;
  /** 상담사명 */
  counselorName: string;
}

/** 제목/소제목 */
export interface HeadingSection {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

/** 본문 텍스트 (유동 길이 → 자동 페이지 오버플로우) */
export interface ParagraphSection {
  type: 'paragraph';
  content: string;
  style?: 'normal' | 'highlight' | 'quote';
}

/** 가계도 이미지 */
export interface GenogramImageSection {
  type: 'genogram_image';
  imageData: string; // base64 data URI 또는 URL
  caption?: string;
  width?: number; // pt 단위
  height?: number;
}

/** 점수/평가표 */
export interface ScoreTableSection {
  type: 'score_table';
  title?: string;
  columns: string[];
  rows: ScoreTableRow[];
}

export interface ScoreTableRow {
  label: string;
  score: number;
  maxScore: number;
  description?: string;
}

/** 항목 리스트 */
export interface BulletListSection {
  type: 'bullet_list';
  title?: string;
  items: string[];
}

/** 라벨-값 쌍 (프로필 정보 등) */
export interface KeyValueSection {
  type: 'key_value';
  title?: string;
  pairs: { key: string; value: string }[];
}

/** 구분선 */
export interface DividerSection {
  type: 'divider';
}

/** 2열 정보 테이블 (좌/우 키-값 쌍) */
export interface InfoTableSection {
  type: 'info_table';
  title: string;
  rows: {
    left: { key: string; value: string };
    right: { key: string; value: string };
  }[];
}

/** 프로파일 단일 선택 (체크박스 행) */
export interface ProfileSelectSection {
  type: 'profile_select';
  title: string;
  options: string[];
  /** 선택된 옵션 인덱스 */
  selectedIndex: number;
  description: string;
}

/** 레터박스 (소제목 + 내용 묶음, 테두리 박스) */
export interface LetterBoxSection {
  type: 'letter_box';
  /** 그라데이션 타이틀 바 (없으면 타이틀 바 없이 렌더링) */
  title?: string;
  entries: {
    subtitle: string;
    contents: string[];
  }[];
}

/** 서브 헤딩 (아이콘 + 제목) */
export interface SubHeadingSection {
  type: 'sub_heading';
  text: string;
}

/** 강제 페이지 나눔 */
export interface PageBreakSection {
  type: 'page_break';
}
