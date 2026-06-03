export interface RegisteredAssessmentEntry {
  id: string;
  fileName: string;
  testDate: string; // YYYY.MM.DD 형식
  pageCount: number;
  categoryLabel: string; // e.g. '다면적 인성검사'
  /** 있으면 testDate|pageCount|categoryLabel 대신 이 문자열을 메타로 표시 (실데이터용) */
  metaLabel?: string;
}

export interface TranscriptEntry {
  id: string;
  title: string; // e.g. '내담자 축어록'
  metaLabel: string; // e.g. '총 8회기 상담 기록'
}
