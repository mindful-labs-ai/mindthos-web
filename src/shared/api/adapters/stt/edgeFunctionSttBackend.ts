import type {
  CreateHandWrittenSessionRequest,
  CreateHandWrittenSessionResponse,
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
} from '@/features/session/types';
import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

import {
  InsufficientCreditError,
  type CreateProgressNoteParams,
  type CreateProgressNoteResult,
  type SttBackendPort,
  type UploadUrlResult,
} from './sttBackendPort';

/**
 * 현행 구현 — Supabase Edge Function + Vercel 라우트 경유 mavo-api.
 * 기존 sessionQueries/s3UploadService/progressNoteQueries의 호출 로직을 그대로 이동
 * (동작 변경 없음). 서버 이관 완료 후 serverSttBackend로 대체된다.
 */
export const edgeFunctionSttBackend: SttBackendPort = {
  async getUploadUrl(
    userId: number,
    filename: string,
    contentType: string
  ): Promise<UploadUrlResult> {
    try {
      return await callEdgeFunction<UploadUrlResult>(
        EDGE_FUNCTION_ENDPOINTS.SESSION.UPLOAD_URL,
        {
          user_id: userId,
          filename,
          content_type: contentType,
        }
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err.message || 'Presigned URL 생성 실패');
    }
  },

  async createAudioSession(
    request: CreateSessionBackgroundRequest
  ): Promise<CreateSessionBackgroundResponse> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    // Vercel API 라우트 경유 — CORS 없이 mavo-api로 JWT를 그대로 forwarding.
    const response = await fetch('/api/session/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        ...request,
        title: request.title.slice(0, 50),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail =
        errorData.message ??
        errorData.error ??
        (Array.isArray(errorData.details)
          ? errorData.details.join(', ')
          : undefined) ??
        `세션 작성 실패: ${response.statusText}`;

      if (response.status === 402) {
        throw new InsufficientCreditError(detail);
      }
      throw new Error(detail);
    }

    const data: CreateSessionBackgroundResponse = await response.json();

    if (data.status !== 'accepted') {
      throw new Error(data.message || '세션 작성 중 오류가 생겼어요.');
    }

    return data;
  },

  async createHandWrittenSession(
    request: CreateHandWrittenSessionRequest
  ): Promise<CreateHandWrittenSessionResponse> {
    try {
      const data = await callEdgeFunction<CreateHandWrittenSessionResponse>(
        EDGE_FUNCTION_ENDPOINTS.SESSION.HAND_WRITTEN,
        { ...request, title: request.title.slice(0, 50) }
      );

      if (!data.success) {
        throw new Error(
          data.message || '직접 입력 상담 기록을 만들지 못했어요.'
        );
      }

      return data;
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      throw {
        status: err.status || 500,
        message: err.message || '직접 입력 세션 생성 중 오류가 생겼어요.',
      };
    }
  },

  async getAudioPlaybackUrl(sessionId: string): Promise<string> {
    try {
      const data = await callEdgeFunction<{
        success: boolean;
        presigned_url: string;
        message?: string;
      }>(EDGE_FUNCTION_ENDPOINTS.SESSION.PRESIGNED_URL, {
        session_id: sessionId,
      });

      if (!data.success || !data.presigned_url) {
        throw new Error(data.message || 'Presigned URL을 가져올 수 없어요.');
      }

      return data.presigned_url;
    } catch (error: unknown) {
      const err = error as { message?: string; statusText?: string };
      throw new Error(
        err.message || `Presigned URL 생성 실패: ${err.statusText || ''}`
      );
    }
  },

  async createProgressNote(
    params: CreateProgressNoteParams
  ): Promise<CreateProgressNoteResult> {
    try {
      const data = await callEdgeFunction<CreateProgressNoteResult>(
        EDGE_FUNCTION_ENDPOINTS.PROGRESS_NOTE.ADD,
        {
          session_id: params.sessionId,
          user_id: params.userId,
          template_id: params.templateId,
        }
      );

      if (!data.success) {
        throw new Error(data.message || '상담노트 추가 중 오류가 생겼어요.');
      }

      return data;
    } catch (error: unknown) {
      const err = error as { message?: string; statusText?: string };
      throw new Error(
        err.message || `상담노트 추가 실패: ${err.statusText || ''}`
      );
    }
  },
};
