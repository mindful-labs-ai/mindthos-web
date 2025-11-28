export type SessionProcessingStatus =
  | 'pending'
  | 'transcribing'
  | 'generating_note'
  | 'succeeded'
  | 'failed';

export interface AudioMetaData {
  duration_seconds?: number;
  s3_key?: string;
  file_size_mb?: number;
  [key: string]: unknown;
}

export interface Session {
  id: string;
  user_id: string;
  client_id: string | null; // 내담자 ID (clients.id 참조, uuid)
  title: string | null;
  description: string | null;
  audio_meta_data: AudioMetaData | null;
  audio_url: string | null; // 오디오 파일 URL (ObjectURL 또는 public 경로)
  created_at: string;
  processing_status?: SessionProcessingStatus; // 백그라운드 처리 상태
  progress_percentage?: number; // 진행률 (0-100%)
  current_step?: string; // 현재 진행 단계 설명
  error_message?: string; // 에러 메시지
}

// ============================================
// Transcribe 관련 타입
// ============================================

// 전사 세그먼트 (화자별 발화)
export interface TranscribeSegment {
  id: number;
  start: number; // 시작 시간(초)
  end: number; // 종료 시간(초)
  text: string; // 발화 내용
  speaker: number; // 화자 ID
}

// 화자 정보
export interface Speaker {
  id: number;
  role: 'counselor' | 'client1' | 'client2' | string; // 역할
}

// 전사 결과
export interface TranscribeResult {
  segments: TranscribeSegment[];
  speakers: Speaker[];
}

// 전사 컨텐츠 (DB에 저장되는 JSON)
export interface TranscribeContents {
  audio_uuid: string;
  status: 'processing' | 'completing' | 'completed' | 'failed';
  raw_output?: string; // Gemini의 원본 응답 (파싱 전)
  result?: TranscribeResult; // 파싱된 결과
}

export interface Transcribe {
  id: string;
  session_id: string;
  user_id: string;
  title: string | null;
  counsel_date: string | null;
  contents: TranscribeContents | null; // JSON 객체로 변경
  stt_model: string | null; // "whisper" | "gemini-3"
  created_at: string;
}

export interface ProgressNote {
  id: string;
  session_id: string;
  user_id: string;
  title: string | null;
  template_id: number | null; // 템플릿 ID (templates.id 참조, integer)
  summary: string | null;
  created_at: string;
}

export type NoteType = 'SOAP' | 'mindthos';

export interface SessionRecord {
  session_id: string;
  transcribe_id: string | null;
  client_id: string;
  client_name: string;
  session_number: number;
  content: string;
  note_types: NoteType[];
  created_at: string;
  processing_status?: SessionProcessingStatus;
}

export interface CreateSessionRequest {
  client_id: string;
  title?: string;
  description?: string;
  transcribe_contents?: string;
  counsel_date?: string;
}

export type UploadType = 'audio' | 'pdf' | 'direct';

export interface AudioFileInfo {
  name: string;
  size: number;
  duration: number;
  file: File;
}

export interface PdfFileInfo {
  name: string;
  size: number;
  file: File;
}

export type FileInfo = AudioFileInfo | PdfFileInfo;

// ============================================
// 세션 생성 API 타입 (Backend Integration)
// ============================================

export interface CreateSessionBackgroundRequest {
  user_id: number;
  client_id?: string;
  upload_type: 'audio' | 'pdf' | 'direct';

  // 오디오인 경우
  audio_url?: string; // S3 다운로드용 Presigned URL (STT 처리용, 15분 유효)
  s3_key?: string; // S3 객체 키 (영구 저장용, presigned URL 재생성에 사용)
  filename?: string; // 원본 파일명 (세션 제목으로 사용)
  file_size_mb?: number;
  transcribe_type?: 'basic' | 'advanced';
  duration_seconds?: number;

  // PDF/직접 입력인 경우
  transcribed_text?: string;

  // 공통
  template_id: number;
}

export interface CreateSessionBackgroundResponse {
  success: boolean;
  message: string;
  session_id: string;
  transcribe_id?: string;
  progress_note_id?: string;
  total_credit_used?: number;
  remaining_credit?: number;
}
