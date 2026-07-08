import type {
  CreateHandWrittenSessionRequest,
  CreateHandWrittenSessionResponse,
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  SessionProcessingStatus,
} from '@/features/session/types';

/**
 * STT 백엔드 포트 — 축어록 파이프라인이 백엔드로 나가는 호출 5종의 계약.
 *
 * 구현체:
 *  - edgeFunctionSttBackend: 현행(Supabase EF + Vercel 라우트 경유 mavo-api)
 *  - serverSttBackend: 신규(mindthos-server /v1) — 응답을 아래 기존 shape로 매핑
 *
 * 축어록 데이터 자체(transcribes.contents 등)는 DB 직접 read/write라 이 포트의
 * 대상이 아니다 — 서버가 저장 계약을 고정하므로 파서/렌더/편집은 무변경.
 */
export interface UploadUrlResult {
  presigned_url: string;
  s3_key: string;
  public_url: string;
  expires_in: number;
}

export interface CreateProgressNoteParams {
  sessionId: string;
  userId: number;
  templateId: number;
}

export interface CreateProgressNoteResult {
  success: boolean;
  progress_note_id: string;
  message?: string;
}

export interface SessionStatusResult {
  success: boolean;
  session_id: string;
  processing_status: SessionProcessingStatus;
  transcribe_id?: string;
  progress_note_id?: string;
  error_message?: string;
  progress_percentage?: number;
  current_step?: string;
  estimated_completion_time?: string;
}

/** 잔액 부족(402) 분기 식별용 에러. UI 레이어에서 instanceof 로 분기. */
export class InsufficientCreditError extends Error {
  constructor(message = '크레딧이 부족해요.') {
    super(message);
    this.name = 'InsufficientCreditError';
  }
}

export interface SttBackendPort {
  /** 오디오 업로드용 presigned URL 발급(레거시 EF session/upload-url). */
  getUploadUrl(
    userId: number,
    filename: string,
    contentType: string
  ): Promise<UploadUrlResult>;

  /** 오디오(STT) 세션 생성 — 402는 InsufficientCreditError로 던진다. */
  createAudioSession(
    request: CreateSessionBackgroundRequest
  ): Promise<CreateSessionBackgroundResponse>;

  /** 직접입력 세션 생성(레거시 EF session/hand-written). */
  createHandWrittenSession(
    request: CreateHandWrittenSessionRequest
  ): Promise<CreateHandWrittenSessionResponse>;

  /** 저장된 세션 오디오의 재생용 presigned URL(레거시 EF session/presigned-url). */
  getAudioPlaybackUrl(sessionId: string): Promise<string>;

  /** 상담노트 생성 요청(레거시 EF note-layer 직접 호출 대체). */
  createProgressNote(
    params: CreateProgressNoteParams
  ): Promise<CreateProgressNoteResult>;

  /** 세션 처리 상태 조회 — 서버: GET /v1/sessions/:id/status (소유권 검사 포함). */
  getSessionStatus(sessionId: string): Promise<SessionStatusResult>;
}
