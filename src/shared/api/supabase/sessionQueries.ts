import type {
  CreateHandWrittenSessionRequest,
  CreateHandWrittenSessionResponse,
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  HandwrittenTranscribe,
  HandwrittenTranscribeListItem,
  ProgressNote,
  ProgressNoteListItem,
  Session,
  SessionDnaListItem,
  SessionListItem,
  Transcribe,
  TranscribeListItem,
} from '@/features/session/types';
import { supabase } from '@/lib/supabase';
import { sttBackend } from '@/shared/api/adapters/stt';
import type { SessionStatusResult } from '@/shared/api/adapters/stt/sttBackendPort';
import { ServerApiError } from '@/shared/api/server/serverClient';
import { deleteSession as deleteSessionOnServer } from '@/shared/api/server/sessionServerApi';

/** 잔액 부족(402) 분기 식별용 에러 — 포트로 이동, instanceof 호환을 위해 재-export. */
export { InsufficientCreditError } from '@/shared/api/adapters/stt';
export type { SessionStatusResult } from '@/shared/api/adapters/stt';

/**
 * 백그라운드 세션 생성 API 호출.
 * STT 백엔드 포트를 통해 mindthos-server에 위임한다.
 */
export async function createSessionBackground(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  return sttBackend.createAudioSession(request);
}

/** Tutorial 4단계 실제 첫 파일 업로드 — 서버가 무료 권리를 검증한다. */
export async function createTutorialFirstSession(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  return sttBackend.createTutorialFirstAudioSession(request);
}

/**
 * 세션 처리 상태 조회 — 소유권 검사를 수행하는 서버 포트로 위임.
 */
export async function getSessionStatus(
  sessionId: string
): Promise<SessionStatusResult> {
  return sttBackend.getSessionStatus(sessionId);
}

// ============================================================================
// C2 페이로드 최적화 — 무거운 컬럼 제외 + cursor 무한 스크롤
// ============================================================================

const SESSION_LIST_COLUMNS =
  'id, user_id, title, client_id, audio_meta_data, processing_status, progress_percentage, current_step, error_message, created_at';
const TRANSCRIBE_LIST_COLUMNS =
  'id, session_id, preview, stt_model, created_at';
const HANDWRITTEN_LIST_COLUMNS = 'id, session_id, preview, created_at';
const PROGRESS_NOTE_LIST_COLUMNS =
  'id, session_id, user_id, title, template_id, processing_status, error_message, created_at, note_version';
const SESSION_DNA_LIST_COLUMNS =
  'id, session_id, dna_json, extraction_status, created_at';

export interface SessionsPageParams {
  userId: number;
  /** 단일 클라이언트 필터 (클라이언트 상세 탭) */
  clientId?: string;
  /**
   * 다중 클라이언트 필터 (세션 이력 사이드바 필터). 비어있으면 미적용.
   * `clientId`와 동시 사용 안 함 (clientId가 우선).
   */
  clientIds?: string[];
  /** 정렬 — 최신순 desc / 오래된순 asc */
  sortOrder?: 'desc' | 'asc';
  /** cursor: 마지막 row의 created_at (ISO). 첫 페이지는 null */
  cursor?: string | null;
  /** 페이지 크기 */
  limit?: number;
}

export interface SessionsPageResult {
  items: SessionListItem[];
  /** 다음 페이지 cursor (마지막 row의 created_at). null이면 끝 */
  nextCursor: string | null;
}

export async function getSessionById({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: number;
}): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`세션 조회 실패: ${error.message}`);
  }

  return (session ?? null) as Session | null;
}

/**
 * sessions 리스트 cursor-based 조회.
 * 무거운 컬럼(transcribes.contents, .parsed_text, progress_notes.summary)은 제외.
 * 미리보기는 transcribes.preview / handwritten_transcribes.preview 사용.
 */
export async function getSessionsPage({
  userId,
  clientId,
  clientIds,
  sortOrder = 'desc',
  cursor = null,
  limit = 20,
}: SessionsPageParams): Promise<SessionsPageResult> {
  const ascending = sortOrder === 'asc';

  // 1. sessions 페이지 (cursor 기반)
  let sessionsQuery = supabase
    .from('sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('user_id', userId);

  if (clientId) {
    sessionsQuery = sessionsQuery.eq('client_id', clientId);
  } else if (clientIds && clientIds.length > 0) {
    sessionsQuery = sessionsQuery.in('client_id', clientIds);
  }

  if (cursor) {
    sessionsQuery = ascending
      ? sessionsQuery.gt('created_at', cursor)
      : sessionsQuery.lt('created_at', cursor);
  }

  const { data: sessions, error: sessionsError } = await sessionsQuery
    .order('created_at', { ascending })
    .limit(limit);

  if (sessionsError) {
    throw new Error(`세션 목록 조회 실패: ${sessionsError.message}`);
  }

  if (!sessions || sessions.length === 0) {
    return { items: [], nextCursor: null };
  }

  const sessionIds = sessions.map((s) => s.id);
  const audioSessionIds = sessions
    .filter((s) => s.audio_meta_data !== null)
    .map((s) => s.id);
  const handwrittenSessionIds = sessions
    .filter((s) => s.audio_meta_data === null)
    .map((s) => s.id);

  // 2. 관련 transcribes / handwritten_transcribes / progress_notes를 일괄 조회 (각각 컬럼 화이트리스트)
  const [
    { data: transcribes, error: transcribesError },
    { data: handwrittenTranscribes, error: handwrittenError },
    { data: progressNotes, error: progressNotesError },
  ] = await Promise.all([
    audioSessionIds.length > 0
      ? supabase
          .from('transcribes')
          .select(TRANSCRIBE_LIST_COLUMNS)
          .in('session_id', audioSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({ data: [] as TranscribeListItem[], error: null }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select(HANDWRITTEN_LIST_COLUMNS)
          .in('session_id', handwrittenSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({
          data: [] as HandwrittenTranscribeListItem[],
          error: null,
        }),
    supabase
      .from('progress_notes')
      .select(PROGRESS_NOTE_LIST_COLUMNS)
      .in('session_id', sessionIds),
  ]);

  if (transcribesError) {
    throw new Error(`축어록 조회 실패: ${transcribesError.message}`);
  }
  if (handwrittenError) {
    throw new Error(`직접 입력 조회 실패: ${handwrittenError.message}`);
  }
  if (progressNotesError) {
    throw new Error(`상담노트 조회 실패: ${progressNotesError.message}`);
  }

  const transcribeMap = new Map<string, TranscribeListItem>();
  (transcribes ?? []).forEach((t) => {
    if (!transcribeMap.has(t.session_id)) transcribeMap.set(t.session_id, t);
  });

  const handwrittenMap = new Map<string, HandwrittenTranscribeListItem>();
  (handwrittenTranscribes ?? []).forEach((t) => {
    if (!handwrittenMap.has(t.session_id)) {
      handwrittenMap.set(t.session_id, t);
    }
  });

  const progressNotesMap = new Map<string, ProgressNoteListItem[]>();
  (progressNotes ?? []).forEach((n) => {
    const list = progressNotesMap.get(n.session_id) ?? [];
    list.push(n);
    progressNotesMap.set(n.session_id, list);
  });

  // 3. 결합
  const items: SessionListItem[] = sessions.map((session) => {
    const isHandwritten = session.audio_meta_data === null;
    const transcribe = isHandwritten
      ? (handwrittenMap.get(session.id) ?? null)
      : (transcribeMap.get(session.id) ?? null);
    return {
      session: session as Session,
      transcribe,
      progressNotes: progressNotesMap.get(session.id) ?? [],
    };
  });

  // 4. 다음 cursor — 마지막 row의 created_at. 페이지 풀로 안 차면 끝
  const nextCursor =
    sessions.length === limit ? sessions[sessions.length - 1].created_at : null;

  return { items, nextCursor };
}

/**
 * 클라이언트의 모든 세션 조회 (limit 없음 — 다회기 분석용).
 * 같은 컬럼 정책 적용.
 */
export async function getAllSessionsByClient(
  clientId: string,
  sortOrder: 'desc' | 'asc' = 'desc'
): Promise<SessionListItem[]> {
  const ascending = sortOrder === 'asc';

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select(SESSION_LIST_COLUMNS)
    .eq('client_id', clientId)
    .order('created_at', { ascending });

  if (sessionsError) {
    throw new Error(`세션 전체 조회 실패: ${sessionsError.message}`);
  }
  if (!sessions || sessions.length === 0) {
    return [];
  }

  const sessionIds = sessions.map((s) => s.id);
  const audioSessionIds = sessions
    .filter((s) => s.audio_meta_data !== null)
    .map((s) => s.id);
  const handwrittenSessionIds = sessions
    .filter((s) => s.audio_meta_data === null)
    .map((s) => s.id);

  const [
    { data: transcribes },
    { data: handwrittenTranscribes },
    { data: progressNotes },
    { data: sessionDna, error: sessionDnaError },
  ] = await Promise.all([
    audioSessionIds.length > 0
      ? supabase
          .from('transcribes')
          .select(TRANSCRIBE_LIST_COLUMNS)
          .in('session_id', audioSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({ data: [] as TranscribeListItem[] }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select(HANDWRITTEN_LIST_COLUMNS)
          .in('session_id', handwrittenSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({ data: [] as HandwrittenTranscribeListItem[] }),
    supabase
      .from('progress_notes')
      .select(PROGRESS_NOTE_LIST_COLUMNS)
      .in('session_id', sessionIds),
    supabase
      .from('session_dna')
      .select(SESSION_DNA_LIST_COLUMNS)
      .in('session_id', sessionIds)
      .eq('extraction_status', 'succeeded')
      .order('created_at', { ascending: false }),
  ]);

  if (sessionDnaError) {
    throw new Error(`세션 DNA 조회 실패: ${sessionDnaError.message}`);
  }

  const transcribeMap = new Map<string, TranscribeListItem>();
  (transcribes ?? []).forEach((t) => {
    if (!transcribeMap.has(t.session_id)) transcribeMap.set(t.session_id, t);
  });
  const handwrittenMap = new Map<string, HandwrittenTranscribeListItem>();
  (handwrittenTranscribes ?? []).forEach((t) => {
    if (!handwrittenMap.has(t.session_id)) {
      handwrittenMap.set(t.session_id, t);
    }
  });
  const progressNotesMap = new Map<string, ProgressNoteListItem[]>();
  (progressNotes ?? []).forEach((n) => {
    const list = progressNotesMap.get(n.session_id) ?? [];
    list.push(n);
    progressNotesMap.set(n.session_id, list);
  });
  const sessionDnaMap = new Map<string, SessionDnaListItem>();
  ((sessionDna ?? []) as SessionDnaListItem[]).forEach((d) => {
    if (d.dna_json && !sessionDnaMap.has(d.session_id)) {
      sessionDnaMap.set(d.session_id, d);
    }
  });

  return sessions.map((session) => {
    const isHandwritten = session.audio_meta_data === null;
    const transcribe = isHandwritten
      ? (handwrittenMap.get(session.id) ?? null)
      : (transcribeMap.get(session.id) ?? null);
    return {
      session: session as Session,
      transcribe,
      progressNotes: progressNotesMap.get(session.id) ?? [],
      sessionDna: sessionDnaMap.get(session.id) ?? null,
    };
  });
}

// ============================================================================
// 기존 함수들 (deprecated — 컨테이너 마이그레이션 후 제거 예정)
// ============================================================================

/**
 * 세션 목록 조회 API 호출
 * audio_meta_data가 있으면 transcribes, 없으면 handwritten_transcribes에서 조회
 *
 * @deprecated `getSessionsPage` 또는 `getAllSessionsByClient` 사용 권장 (C2 페이로드 최적화)
 */
export async function getSessionList(userId: number): Promise<{
  sessions: Array<{
    session: Session;
    transcribe: Transcribe | HandwrittenTranscribe | null;
    progressNotes: ProgressNote[];
  }>;
}> {
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

  // 2. 세션을 audio_meta_data 유무로 분류
  const audioSessionIds = sessions
    .filter((s) => s.audio_meta_data !== null)
    .map((s) => s.id);
  const handwrittenSessionIds = sessions
    .filter((s) => s.audio_meta_data === null)
    .map((s) => s.id);

  // 3. 각 테이블에서 데이터 조회
  const [
    { data: transcribes },
    { data: handwrittenTranscribes },
    { data: progressNotes },
  ] = await Promise.all([
    audioSessionIds.length > 0
      ? supabase
          .from('transcribes')
          .select('*')
          .in('session_id', audioSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({ data: [] }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select('*')
          .in('session_id', handwrittenSessionIds)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from('progress_notes')
      .select('*')
      .in(
        'session_id',
        sessions.map((s) => s.id)
      ),
  ]);

  // 4. 데이터 결합
  const result = sessions.map((session) => {
    const sessionProgressNotes =
      progressNotes?.filter((pn) => pn.session_id === session.id) || [];

    // audio_meta_data가 있으면 transcribes에서, 없으면 handwritten_transcribes에서 찾기
    const transcribe =
      session.audio_meta_data !== null
        ? transcribes?.find((t) => t.session_id === session.id) || null
        : handwrittenTranscribes?.find((t) => t.session_id === session.id) ||
          null;

    return {
      session,
      transcribe,
      progressNotes: sessionProgressNotes,
    };
  });

  return { sessions: result };
}

/**
 * 개별 세션 조회 API 호출
 * audio_meta_data가 있으면 transcribes, 없으면 handwritten_transcribes에서 조회
 */
export async function getSessionDetail(sessionId: string): Promise<{
  session: Session;
  transcribe: Transcribe | HandwrittenTranscribe | null;
  progressNotes: ProgressNote[];
}> {
  // 1. 세션 조회
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(
      `세션 조회 실패: ${sessionError?.message || '세션을 찾을 수 없어요.'}`
    );
  }

  // 2. audio_meta_data 유무에 따라 다른 테이블에서 조회
  const isHandwritten = session.audio_meta_data === null;

  const [transcribeResult, { data: progressNotes }] = await Promise.all([
    isHandwritten
      ? supabase
          .from('handwritten_transcribes')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false, nullsFirst: false })
          .order('id', { ascending: false })
          .limit(1)
      : supabase
          .from('transcribes')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(1),
    supabase.from('progress_notes').select('*').eq('session_id', sessionId),
  ]);

  return {
    session,
    transcribe: transcribeResult.data?.[0] || null,
    progressNotes: progressNotes || [],
  };
}

/**
 * 오디오 Presigned URL 생성 API 호출 — STT 백엔드 포트로 위임.
 */
export async function getAudioPresignedUrl(sessionId: string): Promise<string> {
  return sttBackend.getAudioPlaybackUrl(sessionId);
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
 * 세션 삭제 API 호출 — 서버(mindthos-server)로 위임한다.
 *
 * PostgREST 직접 DELETE는 sessions row만 지워서 축어록·상담노트·STT job을 고아로 남기고
 * held 크레딧을 풀지 못했다. 서버 API는 진행 중 AI 작업 취소까지 한 트랜잭션으로 처리한다.
 * 호출부 시그니처는 그대로라 화면 코드는 바뀌지 않는다.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await deleteSessionOnServer(sessionId);
  } catch (error) {
    const message =
      error instanceof ServerApiError ? error.message : String(error);
    throw new Error(`세션 삭제 실패: ${message}`);
  }
}

/**
 * 세션에 내담자 할당 API 호출
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
    throw new Error(`내담자 할당 실패: ${error.message}`);
  }
}

/**
 * 직접 입력 세션 생성 API 호출 — STT 백엔드 포트로 위임.
 */
export async function createHandWrittenSession(
  request: CreateHandWrittenSessionRequest
): Promise<CreateHandWrittenSessionResponse> {
  return sttBackend.createHandWrittenSession(request);
}
