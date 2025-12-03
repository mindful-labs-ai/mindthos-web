/**
 * Session 생성 API Service
 * Backend: /functions/v1/session/create-background
 */

import { supabase } from '@/lib/supabase';

import type {
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  ProgressNote,
  Session,
  SessionProcessingStatus,
  Transcribe,
  TranscribeSegment,
} from '../types';

const SUPABASE_URL = import.meta.env.VITE_WEBAPP_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_WEBAPP_SUPABASE_ANON_KEY;

export interface SessionStatusResponse {
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

const SESSION_API = import.meta.env.VITE_SESSION_API_URL;

/**
 * 백그라운드 세션 생성 API 호출
 * TODO: localhost 환경 전용 - QA/Production 환경에서는 환경변수 사용 필요
 */
export async function createSessionBackground(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  const response = await fetch(SESSION_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `세션 생성 실패: ${response.statusText}`
    );
  }

  const data: CreateSessionBackgroundResponse = await response.json();

  if (data.status !== 'accepted') {
    throw new Error(data.message || '세션 생성 중 오류가 발생했습니다.');
  }

  return data;
}

/**
 * 세션 처리 상태 확인 API 호출
 */
export async function getSessionStatus(
  sessionId: string
): Promise<SessionStatusResponse> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/session/status/${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `세션 상태 확인 실패: ${response.statusText}`
    );
  }

  const data: SessionStatusResponse = await response.json();

  return data;
}

/**
 * 세션 목록 조회 API 호출
 */
export async function getSessionList(userId: number): Promise<{
  sessions: Array<{
    session: Session;
    transcribe: Transcribe | null;
    progressNotes: ProgressNote[];
  }>;
}> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. 세션 목록 조회
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessionsError) {
    throw new Error(`세션 목록 조회 실패: ${sessionsError.message}`);
  }

  if (!sessions || sessions.length === 0) {
    return { sessions: [] };
  }

  // 2. 각 세션의 transcribe와 progress_notes 조회
  const sessionIds = sessions.map((s) => s.id);

  const [{ data: transcribes }, { data: progressNotes }] = await Promise.all([
    supabase.from('transcribes').select('*').in('session_id', sessionIds),
    supabase.from('progress_notes').select('*').in('session_id', sessionIds),
  ]);

  // 3. 데이터 결합
  const result = sessions.map((session) => {
    const sessionProgressNotes =
      progressNotes?.filter((pn) => pn.session_id === session.id) || [];

    // 디버깅: 각 세션의 progressNotes 확인
    console.log(
      '[getSessionList] Session:',
      session.id,
      'Title:',
      session.title,
      'progressNotes:',
      sessionProgressNotes
    );

    return {
      session,
      transcribe: transcribes?.find((t) => t.session_id === session.id) || null,
      progressNotes: sessionProgressNotes,
    };
  });

  console.log(
    '[getSessionList] Total sessions:',
    result.length,
    'All progress_notes from DB:',
    progressNotes
  );

  return { sessions: result };
}

/**
 * 개별 세션 조회 API 호출
 */
export async function getSessionDetail(sessionId: string): Promise<{
  session: Session;
  transcribe: Transcribe | null;
  progressNotes: ProgressNote[];
}> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. 세션 조회
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(
      `세션 조회 실패: ${sessionError?.message || '세션을 찾을 수 없습니다.'}`
    );
  }

  // 2. transcribe와 progress_notes 조회
  const [{ data: transcribes }, { data: progressNotes }] = await Promise.all([
    supabase.from('transcribes').select('*').eq('session_id', sessionId),
    supabase.from('progress_notes').select('*').eq('session_id', sessionId),
  ]);

  return {
    session,
    transcribe: transcribes?.[0] || null,
    progressNotes: progressNotes || [],
  };
}

/**
 * 오디오 Presigned URL 생성 API 호출
 */
export async function getAudioPresignedUrl(sessionId: string): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/session/presigned-url`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ session_id: sessionId }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Presigned URL 생성 실패: ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.success || !data.presigned_url) {
    throw new Error(data.message || 'Presigned URL을 가져올 수 없습니다.');
  }

  return data.presigned_url;
}

/**
 * 세션 제목 업데이트 API 호출
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`세션 제목 업데이트 실패: ${error.message}`);
  }
}

/**
 * segment id를 배열 인덱스로 변환
 * segment id는 1부터 시작하므로 배열 접근 시 -1 필요
 */
function segmentIdToIndex(segmentId: number): number {
  return segmentId - 1;
}

/**
 * contents에서 segments 배열을 추출하고 업데이트 적용 후 새로운 contents 반환
 */
function updateSegmentsInContents(
  contents: any,
  updater: (segments: any[]) => any[]
): any {
  // New format: { stt_model, segments, ... }
  if ('segments' in contents && Array.isArray(contents.segments)) {
    const updatedSegments = updater([...contents.segments]);
    return {
      ...contents,
      segments: updatedSegments,
    };
  }
  // Legacy format: { result: { segments, speakers } }
  else if ('result' in contents && contents.result?.segments) {
    const updatedSegments = updater([...contents.result.segments]);
    return {
      ...contents,
      result: {
        ...contents.result,
        segments: updatedSegments,
      },
    };
  }

  throw new Error('전사 결과가 존재하지 않습니다.');
}

/**
 * 전사 세그먼트 텍스트 업데이트 API 호출 (단일 세그먼트)
 */
export async function updateTranscriptSegmentText(
  transcribeId: string,
  segmentId: number,
  newText: string
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. 현재 transcribe 데이터 조회
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없습니다.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 존재하지 않습니다.');
  }

  // 2. 세그먼트 업데이트
  const segmentIndex = segmentIdToIndex(segmentId);
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      throw new Error('해당 세그먼트를 찾을 수 없습니다.');
    }

    segments[segmentIndex] = {
      ...segments[segmentIndex],
      text: newText,
    };

    return segments;
  });

  // 3. DB에 저장
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({ contents: updatedContents })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`전사 세그먼트 업데이트 실패: ${updateError.message}`);
  }
}

/**
 * 여러 전사 세그먼트 텍스트 일괄 업데이트 API 호출
 */
export async function updateMultipleTranscriptSegments(
  transcribeId: string,
  updates: Record<number, string>
): Promise<void> {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. 현재 transcribe 데이터 조회
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없습니다.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 존재하지 않습니다.');
  }

  // 2. 세그먼트 일괄 업데이트
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    // 모든 업데이트 적용
    for (const [segmentIdStr, newText] of Object.entries(updates)) {
      const segmentId = parseInt(segmentIdStr, 10);
      const segmentIndex = segmentIdToIndex(segmentId);

      if (segmentIndex >= 0 && segmentIndex < segments.length) {
        segments[segmentIndex] = {
          ...segments[segmentIndex],
          text: newText,
        };
      }
    }

    return segments;
  });

  // 3. DB에 저장
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({ contents: updatedContents })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`전사 세그먼트 업데이트 실패: ${updateError.message}`);
  }
}

/**
 * 세션 삭제 API 호출
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    throw new Error(`세션 삭제 실패: ${error.message}`);
  }
}

/**
 * 세션에 클라이언트 할당 API 호출
 */
export async function assignClientToSession(
  sessionId: string,
  clientId: string | null
): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ client_id: clientId })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`클라이언트 할당 실패: ${error.message}`);
  }
}
