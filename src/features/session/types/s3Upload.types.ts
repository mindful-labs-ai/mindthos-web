/**
 * S3 업로드 관련 타입 정의
 * Module 1: AWS S3 Upload (Frontend)
 */

export interface UploadToS3Request {
  file: File; // 업로드할 파일
  user_id: number; // 사용자 ID
  onProgress?: (progress: number) => void; // 업로드 진행률 콜백 (0-100)
}

export interface UploadToS3Response {
  success: boolean;
  message?: string;
  audio_url: string; // S3 Public URL
  file_path: string; // S3 key (경로)
  file_size_mb: number; // 파일 크기 (MB)
  duration_seconds?: number; // 오디오 길이 (초)
}

export type S3UploadErrorCode =
  | 'FILE_TOO_LARGE' // 파일 크기 초과 (2GB)
  | 'INVALID_FILE_TYPE' // 지원하지 않는 파일 타입
  | 'UPLOAD_FAILED' // 업로드 실패
  | 'AWS_CREDENTIALS_ERROR' // AWS 인증 오류
  | 'NETWORK_ERROR' // 네트워크 오류
  | 'DURATION_EXTRACTION_FAILED'; // 오디오 길이 추출 실패

/**
 * Error 서브클래스여야 한다 — 호출부(useMultiSessionCreate 등)의
 * `error instanceof Error` 분기에서 plain object는 메시지가 '알 수 없는 오류'로
 * 뭉개져 화면·Mixpanel 양쪽에서 실제 실패 원인이 유실된다.
 */
export class S3UploadError extends Error {
  readonly code: S3UploadErrorCode;
  /** 일시적 실패(네트워크 단절, 5xx 등) 여부 — S3 PUT 재시도 판단에 사용 */
  readonly retryable: boolean;

  constructor(code: S3UploadErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'S3UploadError';
    this.code = code;
    this.retryable = retryable;
  }
}
