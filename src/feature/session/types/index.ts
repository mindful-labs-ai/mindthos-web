export interface Session {
  id: string;
  user_id: string;
  client_id: string | null; // 내담자 ID (clients.id 참조, uuid)
  title: string | null;
  description: string | null;
  audio_meta_data: Record<string, unknown> | null;
  audio_url: string | null; // 오디오 파일 URL (ObjectURL 또는 public 경로)
  created_at: string;
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
  result: TranscribeResult;
}

export interface Transcribe {
  id: string;
  session_id: string;
  user_id: string;
  title: string | null;
  counsel_date: string | null;
  contents: TranscribeContents | null; // JSON 객체로 변경
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
  audio_url?: string;
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
