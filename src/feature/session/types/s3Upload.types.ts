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

export interface S3UploadError {
  code: S3UploadErrorCode;
  message: string;
}
