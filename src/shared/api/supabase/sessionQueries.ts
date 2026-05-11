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
  SessionListItem,
  SessionProcessingStatus,
  Speaker,
  Transcribe,
  TranscribeListItem,
} from '@/features/session/types';
import { formatSegmentText } from '@/features/session/utils/formatSegmentText';
import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/api/edgeFunctionClient';

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

/** 잔액 부족(402) 분기 식별용 에러. UI 레이어에서 instanceof 로 분기. */
export class InsufficientCreditError extends Error {
  constructor(message = '크레딧이 부족해요.') {
    super(message);
    this.name = 'InsufficientCreditError';
  }
}

/**
 * 백그라운드 세션 생성 API 호출
 * Vercel API 라우트를 통해 CORS 문제 없이 호출.
 * 사용자 JWT를 Authorization 헤더로 전달 → api/session/create.ts 가 그대로 mavo-api 로 forwarding.
 */
export async function createSessionBackground(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

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
}

/**
 * 세션 처리 상태 확인 API 호출
 */
export async function getSessionStatus(
  sessionId: string
): Promise<SessionStatusResponse> {
  try {
    const data = await callEdgeFunction<SessionStatusResponse>(
      EDGE_FUNCTION_ENDPOINTS.SESSION.STATUS(sessionId),
      null,
      {
        method: 'GET',
      }
    );

    return data;
  } catch (error: unknown) {
    const err = error as { message?: string; statusText?: string };
    throw new Error(
      err.message || `세션 상태 확인 실패: ${err.statusText || ''}`
    );
  }
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
      : Promise.resolve({ data: [] as TranscribeListItem[], error: null }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select(HANDWRITTEN_LIST_COLUMNS)
          .in('session_id', handwrittenSessionIds)
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
  (transcribes ?? []).forEach((t) => transcribeMap.set(t.session_id, t));

  const handwrittenMap = new Map<string, HandwrittenTranscribeListItem>();
  (handwrittenTranscribes ?? []).forEach((t) =>
    handwrittenMap.set(t.session_id, t)
  );

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
  ] = await Promise.all([
    audioSessionIds.length > 0
      ? supabase
          .from('transcribes')
          .select(TRANSCRIBE_LIST_COLUMNS)
          .in('session_id', audioSessionIds)
      : Promise.resolve({ data: [] as TranscribeListItem[] }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select(HANDWRITTEN_LIST_COLUMNS)
          .in('session_id', handwrittenSessionIds)
      : Promise.resolve({ data: [] as HandwrittenTranscribeListItem[] }),
    supabase
      .from('progress_notes')
      .select(PROGRESS_NOTE_LIST_COLUMNS)
      .in('session_id', sessionIds),
  ]);

  const transcribeMap = new Map<string, TranscribeListItem>();
  (transcribes ?? []).forEach((t) => transcribeMap.set(t.session_id, t));
  const handwrittenMap = new Map<string, HandwrittenTranscribeListItem>();
  (handwrittenTranscribes ?? []).forEach((t) =>
    handwrittenMap.set(t.session_id, t)
  );
  const progressNotesMap = new Map<string, ProgressNoteListItem[]>();
  (progressNotes ?? []).forEach((n) => {
    const list = progressNotesMap.get(n.session_id) ?? [];
    list.push(n);
    progressNotesMap.set(n.session_id, list);
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
      : Promise.resolve({ data: [] }),
    handwrittenSessionIds.length > 0
      ? supabase
          .from('handwritten_transcribes')
          .select('*')
          .in('session_id', handwrittenSessionIds)
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
      : supabase.from('transcribes').select('*').eq('session_id', sessionId),
    supabase.from('progress_notes').select('*').eq('session_id', sessionId),
  ]);

  return {
    session,
    transcribe: transcribeResult.data?.[0] || null,
    progressNotes: progressNotes || [],
  };
}

/**
 * 오디오 Presigned URL 생성 API 호출
 */
export async function getAudioPresignedUrl(sessionId: string): Promise<string> {
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
}

/**
 * transcribe 리스트 미리보기 평문 생성 (segments[0:3], 300자 cap).
 * contents 변경(편집/추가/삭제) 시점에 preview 컬럼도 함께 갱신.
 */
function buildTranscribePreview(contents: unknown): string | null {
  if (!contents || typeof contents !== 'object') return null;
  const c = contents as Record<string, unknown>;
  let segments: Array<{ text?: string }> | null = null;
  if (Array.isArray(c.segments)) {
    segments = c.segments as Array<{ text?: string }>;
  } else if (c.result && typeof c.result === 'object') {
    const result = c.result as Record<string, unknown>;
    if (Array.isArray(result.segments)) {
      segments = result.segments as Array<{ text?: string }>;
    }
  }
  if (!segments || segments.length === 0) return null;
  const preview = segments
    .slice(0, 3)
    .map((s) => (typeof s.text === 'string' ? s.text : ''))
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!preview) return null;
  return preview.length > 300 ? preview.slice(0, 300) : preview;
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
 * segment id로 배열에서 세그먼트 찾기
 * segment.id를 직접 비교하여 올바른 세그먼트를 찾습니다
 */
function findSegmentIndexById(segments: any[], segmentId: number): number {
  const index = segments.findIndex((seg) => seg.id === segmentId);
  if (index === -1) {
    throw new Error(`선택한 대화를 찾을 수 없어요.`);
  }
  return index;
}

/**
 * 초를 [MM:SS] 형식으로 변환
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
}

/**
 * 화자 ID로 화자명 가져오기
 */
function getSpeakerName(speakerId: number, speakers?: Speaker[]): string {
  // 기본 화자명 (speakers 정보가 없거나 매칭되지 않을 때)
  const defaultNames: Record<number, string> = {
    0: '상담사',
    1: '내담자',
  };
  const defaultName = defaultNames[speakerId] ?? `화자 ${speakerId + 1}`;

  if (!speakers) {
    return defaultName;
  }
  const speaker = speakers.find((s) => s.id === speakerId);
  if (!speaker) {
    return defaultName;
  }
  // customName이 있으면 우선 사용
  if (speaker.customName) {
    return speaker.customName;
  }
  switch (speaker.role) {
    case 'counselor':
      return '상담사';
    case 'client1':
      return '내담자';
    case 'client2':
      return '내담자2';
    default:
      // custom_ prefix role은 기본값으로 대체 (예: custom_3 → 화자 4)
      if (speaker.role?.startsWith('custom_')) {
        return defaultName;
      }
      return speaker.role || defaultName;
  }
}

/**
 * 세그먼트 배열을 AI 소비용 평문으로 변환
 * - 형식: `[MM:SS] [화자명] 텍스트` (타임스탬프 없으면 `[순번]`)
 * - 비언어 태그 → `(라벨)` 로 감쌈
 * - 비식별화 태그 → 원본 그대로 복원
 * 자세한 변환 규칙은 `formatSegmentText` 참고.
 */
function generateParsedText(segments: any[], speakers?: Speaker[]): string {
  return segments
    .map((segment, index) => {
      const prefix =
        segment.start !== null && segment.start !== undefined
          ? formatTimestamp(segment.start)
          : `[${index + 1}]`;
      const speakerName = getSpeakerName(segment.speaker, speakers);
      const text = formatSegmentText({
        text: segment.text ?? '',
        nv: segment.nv,
      });
      return `${prefix} [${speakerName}] ${text}`;
    })
    .join('\n');
}

/**
 * contents에서 segments와 speakers 추출
 */
function extractSegmentsAndSpeakers(contents: any): {
  segments: any[];
  speakers?: Speaker[];
} {
  // New format: { stt_model, segments, speakers, ... }
  if ('segments' in contents && Array.isArray(contents.segments)) {
    return {
      segments: contents.segments,
      speakers: contents.speakers,
    };
  }
  // Legacy format: { result: { segments, speakers } }
  if ('result' in contents && contents.result?.segments) {
    return {
      segments: contents.result.segments,
      speakers: contents.result.speakers,
    };
  }
  return { segments: [] };
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

  throw new Error('전사 결과가 없어요.');
}

/**
 * 전사 세그먼트 텍스트 업데이트 API 호출 (단일 세그먼트)
 */
export async function updateTranscriptSegmentText(
  transcribeId: string,
  segmentId: number,
  newText: string
): Promise<void> {
  // 1. 현재 transcribe 데이터 조회
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없어요.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 없어요.');
  }

  // 2. 세그먼트 업데이트 - segment.id로 직접 찾기
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    const segmentIndex = findSegmentIndexById(segments, segmentId);

    segments[segmentIndex] = {
      ...segments[segmentIndex],
      text: newText,
    };

    return segments;
  });

  // 3. DB에 저장 — preview도 함께 갱신
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: updatedContents,
      preview: buildTranscribePreview(updatedContents),
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`대화 업데이트 실패: ${updateError.message}`);
  }
}

/**
 * 여러 전사 세그먼트 텍스트 일괄 업데이트 API 호출
 * segments 업데이트 후 parsed_text 컬럼에 타임스탬프 포함 텍스트 저장
 */
export async function updateMultipleTranscriptSegments(
  transcribeId: string,
  updates: Record<number, string>
): Promise<void> {
  // 1. 현재 transcribe 데이터 조회
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없어요.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 없어요.');
  }

  // 2. 세그먼트 일괄 업데이트 - segment.id로 직접 찾기
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    // 모든 업데이트 적용
    for (const [segmentIdStr, newText] of Object.entries(updates)) {
      const segmentId = parseInt(segmentIdStr, 10);

      try {
        const segmentIndex = findSegmentIndexById(segments, segmentId);
        segments[segmentIndex] = {
          ...segments[segmentIndex],
          text: newText,
        };
      } catch {
        // 세그먼트를 찾을 수 없으면 스킵
      }
    }

    return segments;
  });

  // 3. 업데이트된 segments로 parsed_text 생성
  const { segments: updatedSegments, speakers } =
    extractSegmentsAndSpeakers(updatedContents);
  const parsedText = generateParsedText(updatedSegments, speakers);

  // 4. DB에 저장 (contents + parsed_text + preview)
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: updatedContents,
      parsed_text: parsedText,
      preview: buildTranscribePreview(updatedContents),
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`대화 업데이트 실패: ${updateError.message}`);
  }
}

/**
 * 전사 contents 전체를 저장 (텍스트 편집 + 세그먼트 추가/삭제를 한 번에)
 */
export async function saveTranscriptContents(
  transcribeId: string,
  contents: any
): Promise<void> {
  const { segments, speakers } = extractSegmentsAndSpeakers(contents);
  const parsedText = generateParsedText(segments, speakers);

  const { error } = await supabase
    .from('transcribes')
    .update({
      contents,
      parsed_text: parsedText,
      preview: buildTranscribePreview(contents),
    })
    .eq('id', transcribeId);

  if (error) {
    throw new Error(`축어록 저장 실패: ${error.message}`);
  }
}

/**
 * 전사 세그먼트 업데이트 Payload
 */
export interface TranscriptUpdatePayload {
  textUpdates?: Record<number, string>; // segmentId -> newText
  speakerUpdates?: Record<number, number>; // segmentId -> newSpeakerId
  speakerDefinitions?: Speaker[]; // 업데이트된 speakers 배열
}

/**
 * 전사 세그먼트 종합 업데이트 API 호출 (text + speaker)
 * text, speaker, speakerDefinitions를 동시에 업데이트할 수 있어요.
 */
export async function updateTranscriptSegments(
  transcribeId: string,
  updates: TranscriptUpdatePayload
): Promise<void> {
  // 1. 현재 transcribe 데이터 조회
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없어요.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 없어요.');
  }

  // 2. 세그먼트 업데이트 적용 (text + speaker)
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    return segments.map((seg) => {
      const segmentId = seg.id;
      const updated = { ...seg };

      // text 업데이트
      if (updates.textUpdates && segmentId in updates.textUpdates) {
        updated.text = updates.textUpdates[segmentId];
      }

      // speaker 업데이트
      if (updates.speakerUpdates && segmentId in updates.speakerUpdates) {
        updated.speaker = updates.speakerUpdates[segmentId];
      }

      return updated;
    });
  });

  // 3. speakers 배열 업데이트
  let finalContents = updatedContents;
  if (updates.speakerDefinitions) {
    if ('result' in updatedContents && updatedContents.result) {
      // Legacy format: { result: { segments, speakers } }
      finalContents = {
        ...updatedContents,
        result: {
          ...updatedContents.result,
          speakers: updates.speakerDefinitions,
        },
      };
    } else {
      // New format: { stt_model, segments, speakers, ... }
      // speakers 키가 없어도 추가
      finalContents = {
        ...updatedContents,
        speakers: updates.speakerDefinitions,
      };
    }
  }

  // 4. 업데이트된 segments로 parsed_text 생성
  const { segments: updatedSegments, speakers: updatedSpeakers } =
    extractSegmentsAndSpeakers(finalContents);
  const parsedText = generateParsedText(updatedSegments, updatedSpeakers);

  // 5. DB에 저장 (contents + parsed_text + preview)
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: finalContents,
      parsed_text: parsedText,
      preview: buildTranscribePreview(finalContents),
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`대화 업데이트 실패: ${updateError.message}`);
  }
}

/**
 * 전사 세그먼트 추가 (특정 세그먼트 뒤에 삽입)
 * Optimistic update는 호출부에서 처리, 이 함수는 DB만 업데이트
 */
export async function addTranscriptSegment(
  transcribeId: string,
  afterSegmentId: number,
  newSegment: { id: number; speaker: number; text: string }
): Promise<void> {
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없어요.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 없어요.');
  }

  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    const afterIndex = findSegmentIndexById(segments, afterSegmentId);
    const segmentToInsert = {
      id: newSegment.id,
      start: null,
      end: null,
      text: newSegment.text,
      speaker: newSegment.speaker,
    };
    segments.splice(afterIndex + 1, 0, segmentToInsert);
    return segments;
  });

  const { segments: updatedSegments, speakers } =
    extractSegmentsAndSpeakers(updatedContents);
  const parsedText = generateParsedText(updatedSegments, speakers);

  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: updatedContents,
      parsed_text: parsedText,
      preview: buildTranscribePreview(updatedContents),
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`세그먼트 추가 실패: ${updateError.message}`);
  }
}

/**
 * 전사 세그먼트 삭제
 * Optimistic update는 호출부에서 처리, 이 함수는 DB만 업데이트
 */
export async function deleteTranscriptSegment(
  transcribeId: string,
  segmentId: number
): Promise<void> {
  const { data: transcribe, error: fetchError } = await supabase
    .from('transcribes')
    .select('contents')
    .eq('id', transcribeId)
    .single();

  if (fetchError || !transcribe) {
    throw new Error(
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없어요.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 없어요.');
  }

  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    const index = findSegmentIndexById(segments, segmentId);
    segments.splice(index, 1);
    return segments;
  });

  const { segments: updatedSegments, speakers } =
    extractSegmentsAndSpeakers(updatedContents);
  const parsedText = generateParsedText(updatedSegments, speakers);

  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: updatedContents,
      parsed_text: parsedText,
      preview: buildTranscribePreview(updatedContents),
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`세그먼트 삭제 실패: ${updateError.message}`);
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
 * 직접 입력 세션 텍스트 업데이트 API 호출
 * handwritten_transcribes 테이블의 contents 업데이트
 */
export async function updateHandwrittenTranscribeContent(
  transcribeId: string,
  contents: string
): Promise<void> {
  const { error } = await supabase
    .from('handwritten_transcribes')
    .update({ contents })
    .eq('id', transcribeId);

  if (error) {
    throw new Error(`직접 입력 텍스트 업데이트 실패: ${error.message}`);
  }
}

/**
 * 직접 입력 세션 생성 API 호출
 * Edge Function을 통해 축어록 직접 입력 후 상담노트 생성
 */
export async function createHandWrittenSession(
  request: CreateHandWrittenSessionRequest
): Promise<CreateHandWrittenSessionResponse> {
  try {
    const data = await callEdgeFunction<CreateHandWrittenSessionResponse>(
      EDGE_FUNCTION_ENDPOINTS.SESSION.HAND_WRITTEN,
      { ...request, title: request.title.slice(0, 50) }
    );

    if (!data.success) {
      throw new Error(data.message || '직접 입력 상담 기록을 만들지 못했어요.');
    }

    return data;
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    throw {
      status: err.status || 500,
      message: err.message || '직접 입력 세션 생성 중 오류가 생겼어요.',
    };
  }
}
