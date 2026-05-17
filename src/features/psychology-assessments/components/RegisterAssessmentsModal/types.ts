/** 모달 step (1: 등록 / 2: 확인 / 3: 완료) */
export type RegisterStep = 1 | 2 | 3;

/** 검사 종류 ID */
export type AssessmentTypeId = 'mmpi' | 'tci' | 'sct' | 'other';

export interface AssessmentTypeOption {
  id: AssessmentTypeId;
  label: string;
}

export const ASSESSMENT_TYPES: AssessmentTypeOption[] = [
  { id: 'mmpi', label: '다면적 인성검사' },
  { id: 'tci', label: '기질 검사' },
  { id: 'sct', label: '문장 완성 검사' },
];

/** 업로드된 파일 단위 */
export interface UploadedFile {
  id: string;
  fileName: string;
  sizeMB: number;
  pageCount?: number;
  /** 미지정이면 검사 종류 선택 필요 (warning 상태) */
  assessmentType: AssessmentTypeId | null;
  /** 'reviewing' = 백엔드 OCR/검토 진행 중 */
  status: 'reviewing' | 'ready' | 'missing-type';
}

/** 검사별 검증 결과 (step 2) */
export type VerificationStatus = 'complete' | 'missing' | 'invalid';

export interface VerificationResult {
  fileId: string;
  fileName: string;
  categoryLabel: string;
  /** 검증된 항목 / 전체 항목 — '기타 문서'처럼 항목 개념 없으면 null */
  itemsVerified: number | null;
  itemsTotal: number | null;
  status: VerificationStatus;
  /** invalid 사유 (등록 불가) */
  invalidReason?: string;
}

export const MAX_FILES = 30;
export const MAX_FILE_SIZE_MB = 200;
