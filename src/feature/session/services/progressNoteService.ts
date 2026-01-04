import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

interface CreateProgressNoteParams {
  sessionId: string;
  userId: number;
  templateId: number;
  transcribedText: string;
}

interface CreateProgressNoteResponse {
  success: boolean;
  progress_note_id: string;
  summary: string;
  message?: string;
}

interface AddProgressNoteParams {
  sessionId: string;
  userId: number;
  templateId: number;
}

interface AddProgressNoteResponse {
  success: boolean;
  progress_note_id: string;
  message?: string;
}

/**
 * 상담 노트 생성 API 호출 (세션 플로우용)
 */
export async function createProgressNote(
  params: CreateProgressNoteParams
): Promise<CreateProgressNoteResponse> {
  try {
    const data = await callEdgeFunction<CreateProgressNoteResponse>(
      EDGE_FUNCTION_ENDPOINTS.PROGRESS_NOTE.CREATE,
      {
        session_id: params.sessionId,
        user_id: params.userId,
        template_id: params.templateId,
        transcribed_text: params.transcribedText,
      }
    );

    if (!data.success) {
      throw new Error(data.message || '상담 노트 작성 중 오류가 발생했습니다.');
    }

    return data;
  } catch (error: unknown) {
    const err = error as { message?: string; statusText?: string };
    throw new Error(
      err.message || `상담 노트 작성 실패: ${err.statusText || ''}`
    );
  }
}

/**
 * 상담 노트 추가 API 호출 (세션 상세 페이지용, 백그라운드 처리)
 */
export async function addProgressNote(
  params: AddProgressNoteParams
): Promise<AddProgressNoteResponse> {
  try {
    const data = await callEdgeFunction<AddProgressNoteResponse>(
      EDGE_FUNCTION_ENDPOINTS.PROGRESS_NOTE.ADD,
      {
        session_id: params.sessionId,
        user_id: params.userId,
        template_id: params.templateId,
      }
    );

    if (!data.success) {
      throw new Error(data.message || '상담 노트 추가 중 오류가 발생했습니다.');
    }

    return data;
  } catch (error: unknown) {
    const err = error as { message?: string; statusText?: string };
    throw new Error(
      err.message || `상담 노트 추가 실패: ${err.statusText || ''}`
    );
  }
}
