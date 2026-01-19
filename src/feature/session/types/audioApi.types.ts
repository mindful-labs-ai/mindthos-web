export interface UploadAudioRequest {
  file: File;
  user_id: number;
  // ⚠️ session_id 제외: S3 업로드는 세션 생성 이전에 발생
}

export interface UploadAudioResponse {
  success: boolean;
  message?: string;
  audio_url?: string;
  file_path?: string;
}

export interface TranscribeAudioRequest {
  audio_url: string;
  session_id: string;
  user_id: number;
  duration_seconds: number;
  file_size_mb: number;
}

export interface TranscribeAudioResponse {
  success: boolean;
  message?: string;
  transcribe_id?: string;
  status?: 'processing' | 'completed' | 'failed';
  remaining_credit?: number;
}

export interface AudioApiError {
  status: number;
  success: false;
  error: string;
  message: string;
}

export type AudioErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'UPLOAD_FAILED'
  | 'TRANSCRIBE_FAILED'
  | 'INSUFFICIENT_CREDIT'
  | 'SESSION_NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';
