import type {
  CreateHandWrittenSessionRequest,
  CreateHandWrittenSessionResponse,
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  SessionProcessingStatus,
} from '@/features/session/types';
import { ServerApiError, serverRequest } from '@/shared/api/server/serverClient';

import {
  InsufficientCreditError,
  type CreateProgressNoteParams,
  type CreateProgressNoteResult,
  type SessionStatusResult,
  type SttBackendPort,
  type UploadUrlResult,
} from './sttBackendPort';

/**
 * 신규 구현 — mindthos-server /v1 REST.
 * 서버는 camelCase 봉투(`{statusCode, message, data}`)로 응답하므로, 기존 화면·훅이
 * 소비하는 snake_case shape로 여기서 매핑한다(anti-corruption layer).
 * userId 파라미터는 서버가 인증 컨텍스트에서 파생하므로 보내지 않는다.
 */
export const serverSttBackend: SttBackendPort = {
  async getUploadUrl(
    _userId: number,
    filename: string,
    contentType: string
  ): Promise<UploadUrlResult> {
    try {
      const data = await serverRequest<{
        presignedUrl: string;
        s3Key: string;
        publicUrl: string;
        expiresIn: number;
      }>('/sessions/upload-url', {
        method: 'POST',
        body: { filename, contentType },
      });
      return {
        presigned_url: data.presignedUrl,
        s3_key: data.s3Key,
        public_url: data.publicUrl,
        expires_in: data.expiresIn,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || 'Presigned URL 생성 실패');
    }
  },

  async createAudioSession(
    request: CreateSessionBackgroundRequest
  ): Promise<CreateSessionBackgroundResponse> {
    try {
      const data = await serverRequest<{
        sessionId: string;
        sttModel: 'basic' | 'advanced';
      }>('/sessions', {
        method: 'POST',
        body: {
          title: request.title.slice(0, 50),
          s3Key: request.s3_key,
          fileSizeMb: request.file_size_mb,
          durationSeconds: request.duration_seconds,
          clientId: request.client_id ?? undefined,
          sttModel: request.stt_model,
          templateId: request.template_id,
        },
      });
      // 기존 mavo 202 응답 shape 유지 — 호출부는 status==='accepted'만 확인한다.
      return {
        session_id: data.sessionId,
        status: 'accepted',
        stt_model: data.sttModel,
        message: '',
      };
    } catch (error: unknown) {
      if (error instanceof ServerApiError && error.status === 402) {
        throw new InsufficientCreditError(error.message);
      }
      const err = error as { message?: string };
      throw new Error(err.message || '세션 작성 중 오류가 생겼어요.');
    }
  },

  async createHandWrittenSession(
    request: CreateHandWrittenSessionRequest
  ): Promise<CreateHandWrittenSessionResponse> {
    try {
      const data = await serverRequest<{
        sessionId: string;
        progressNoteId: string;
      }>('/sessions/hand-written', {
        method: 'POST',
        body: {
          title: request.title.slice(0, 50),
          counselDate: request.counsel_date,
          contents: request.contents,
          clientId: request.client_id ?? undefined,
          templateId: request.template_id,
        },
      });
      return {
        success: true,
        session_id: data.sessionId,
        progress_note_id: data.progressNoteId,
      };
    } catch (error: unknown) {
      // 기존 EF 경로와 동일한 {status, message} shape로 던진다(모달의 402 분기 호환).
      if (error instanceof ServerApiError) {
        throw { status: error.status, message: error.message };
      }
      const err = error as { message?: string };
      throw {
        status: 500,
        message: err.message || '직접 입력 세션 생성 중 오류가 생겼어요.',
      };
    }
  },

  async getAudioPlaybackUrl(sessionId: string): Promise<string> {
    try {
      const data = await serverRequest<{ audioUrl: string }>(
        `/sessions/${sessionId}/audio-url`
      );
      if (!data.audioUrl) {
        throw new Error('Presigned URL을 가져올 수 없어요.');
      }
      return data.audioUrl;
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || 'Presigned URL 생성 실패');
    }
  },

  async createProgressNote(
    params: CreateProgressNoteParams
  ): Promise<CreateProgressNoteResult> {
    try {
      const data = await serverRequest<{ progressNoteId: string }>(
        `/sessions/${params.sessionId}/progress-notes`,
        {
          method: 'POST',
          body: { templateId: params.templateId },
        }
      );
      return { success: true, progress_note_id: data.progressNoteId };
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || '상담노트 추가 중 오류가 생겼어요.');
    }
  },

  async getSessionStatus(sessionId: string): Promise<SessionStatusResult> {
    try {
      const data = await serverRequest<{
        sessionId: string;
        processingStatus: SessionProcessingStatus;
        transcribeId: string | null;
        progressNoteId: string | null;
        errorMessage: string | null;
        progressPercentage: number | null;
        currentStep: string | null;
        estimatedCompletionTime: string | null;
      }>(`/sessions/${sessionId}/status`);
      return {
        success: true,
        session_id: data.sessionId,
        processing_status: data.processingStatus,
        ...(data.transcribeId !== null && { transcribe_id: data.transcribeId }),
        ...(data.progressNoteId !== null && {
          progress_note_id: data.progressNoteId,
        }),
        ...(data.errorMessage !== null && { error_message: data.errorMessage }),
        ...(data.progressPercentage !== null && {
          progress_percentage: data.progressPercentage,
        }),
        ...(data.currentStep !== null && { current_step: data.currentStep }),
        ...(data.estimatedCompletionTime !== null && {
          estimated_completion_time: data.estimatedCompletionTime,
        }),
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || '세션 상태 조회 중 오류가 생겼어요.');
    }
  },
};
