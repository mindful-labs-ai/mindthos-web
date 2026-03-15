import type { ProgressNote } from '@/features/session/types';
import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

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
 * 개별 상담노트 조회 (폴링용)
 */
export async function fetchProgressNoteById(
  progressNoteId: string
): Promise<ProgressNote> {
  const { data, error } = await supabase
    .from('progress_notes')
    .select('*')
    .eq('id', progressNoteId)
    .single();

  if (error) {
    throw new Error(`상담노트 조회 실패: ${error.message}`);
  }

  return data as ProgressNote;
}

/**
 * 세션의 전체 상담노트 목록 조회 (폴링용)
 */
export async function fetchSessionProgressNotes(
  sessionId: string
): Promise<ProgressNote[]> {
  const { data, error } = await supabase
    .from('progress_notes')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`상담노트 목록 조회 실패: ${error.message}`);
  }

  return data as ProgressNote[];
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
 * 상담 노트 summary 수정
 */
export async function updateProgressNoteSummary(
  progressNoteId: string,
  summary: string
): Promise<void> {
  const { error } = await supabase
    .from('progress_notes')
    .update({ summary })
    .eq('id', progressNoteId);

  if (error) {
    throw new Error(`상담노트 수정 실패: ${error.message}`);
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
