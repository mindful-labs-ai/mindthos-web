import type { ProgressNote } from '@/features/session/types';
import { supabase } from '@/lib/supabase';
import { sttBackend } from '@/shared/api/adapters/stt';

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
 * 상담노트 summary 수정
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
 * 상담노트 추가 API 호출 (세션 상세 페이지용, 백그라운드 처리) — STT 백엔드 포트로 위임.
 */
export async function addProgressNote(
  params: AddProgressNoteParams
): Promise<AddProgressNoteResponse> {
  return sttBackend.createProgressNote(params);
}
