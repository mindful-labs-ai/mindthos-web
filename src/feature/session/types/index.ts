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
  user_id: number;
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

// Gemini-3 세그먼트 (타임스탬프 없음)
export interface GeminiSegment {
  id: number;
  start: null;
  end: null;
  text: string;
  speaker: number; // 변환된 숫자 ID
}

// Whisper 세그먼트 (타임스탬프 포함)
export interface WhisperSegment {
  id: number;
  start: number; // 시작 시간(초)
  end: number; // 종료 시간(초)
  text: string;
  speaker: number; // 화자 ID
}

// 전사 세그먼트 (Union type)
export type TranscribeSegment = GeminiSegment | WhisperSegment;

// 화자 정보
export interface Speaker {
  id: number;
  role: 'counselor' | 'client1' | 'client2' | string; // 역할
  customName?: string; // 커스텀 표시 이름
}

export type SttModel = 'gemini-3' | 'whisper';

// 전사 결과
export interface TranscribeResult {
  segments: TranscribeSegment[];
  speakers: Speaker[];
}

// 새로운 전사 JSON 구조 (백엔드에서 반환)
export interface TranscriptJson {
  language: string;
  segments: TranscribeSegment[];
  text: string;
  raw_output: string;
  stt_model: 'gemini-3' | 'whisper';
  speakers?: Speaker[]; // 화자 정보 (customName 포함)
}

// 전사 컨텐츠 (DB에 저장되는 JSON) - Legacy 지원
export interface TranscribeContents {
  audio_uuid: string;
  status: 'processing' | 'completing' | 'completed' | 'failed';
  raw_output?: string; // Gemini의 원본 응답 (파싱 전)
  result?: TranscribeResult; // 파싱된 결과
}

export interface Transcribe {
  id: string;
  session_id: string;
  user_id: number;
  title: string | null;
  counsel_date: string | null;
  contents: TranscriptJson | TranscribeContents | null; // 새 구조 또는 Legacy 구조
  stt_model: SttModel | null; // "whisper" | "gemini-3"
  created_at: string;
}

export interface ProgressNote {
  id: string;
  session_id: string;
  user_id: number;
  title: string | null;
  template_id: number | null; // 템플릿 ID (templates.id 참조, integer)
  summary: string | null;
  created_at: string;
}

export type NoteType =
  | '마음토스 노트'
  | 'CBT'
  | '보웬 가족치료'
  | '인간중심'
  | '사티어 경험적가족치료'
  | 'DBT'
  | '미누친 구조적가족치료'
  | 'MI'
  | '슈퍼바이저'
  | 'EAP'
  | '아들러 심리치료'
  | '가족센터 노트'
  | '게슈탈트 심리치료'
  | 'ACT'
  | '접수면접 노트';

export interface SessionRecord {
  session_id: string;
  transcribe_id: string | null;
  client_id: string;
  client_name: string;
  session_number: number;
  title?: string;
  content: string;
  note_types: NoteType[];
  created_at: string;
  processing_status?: SessionProcessingStatus;
  progress_percentage?: number;
  current_step?: string;
  error_message?: string;
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
  title: string;
  s3_key: string; // S3 객체 키 (영구 저장용)
  file_size_mb: number;
  duration_seconds: number;
  client_id?: string | null;
  stt_model: 'whisper' | 'gemini-3';
  template_id: number;
}

export interface CreateSessionBackgroundResponse {
  session_id: string;
  status: 'accepted' | 'failed';
  stt_model: 'whisper' | 'gemini-3';
  message: string;
}
