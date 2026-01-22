import { supabase } from '@/lib/supabase';
import {
  callEdgeFunction,
  EDGE_FUNCTION_ENDPOINTS,
} from '@/shared/utils/edgeFunctionClient';

import type {
  CreateSessionBackgroundRequest,
  CreateSessionBackgroundResponse,
  ProgressNote,
  Session,
  SessionProcessingStatus,
  Speaker,
  Transcribe,
} from '../types';

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

/**
 * 백그라운드 세션 생성 API 호출
 * Vercel API 라우트를 통해 CORS 문제 없이 호출
 */
export async function createSessionBackground(
  request: CreateSessionBackgroundRequest
): Promise<CreateSessionBackgroundResponse> {
  const response = await fetch('/api/session/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `세션 작성 실패: ${response.statusText}`
    );
  }

  const data: CreateSessionBackgroundResponse = await response.json();

  if (data.status !== 'accepted') {
    throw new Error(data.message || '세션 작성 중 오류가 발생했습니다.');
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

    return {
      session,
      transcribe: transcribes?.find((t) => t.session_id === session.id) || null,
      progressNotes: sessionProgressNotes,
    };
  });

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
  try {
    const data = await callEdgeFunction<{
      success: boolean;
      presigned_url: string;
      message?: string;
    }>(EDGE_FUNCTION_ENDPOINTS.SESSION.PRESIGNED_URL, {
      session_id: sessionId,
    });

    if (!data.success || !data.presigned_url) {
      throw new Error(data.message || 'Presigned URL을 가져올 수 없습니다.');
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
    throw new Error(`선택한 대화를 찾을 수 없습니다.`);
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
 * 세그먼트 배열을 파싱하여 텍스트로 변환
 * 형식: [MM:SS] [화자명] 텍스트 (타임스탬프가 없으면 [순번] 사용)
 */
function generateParsedText(segments: any[], speakers?: Speaker[]): string {
  return segments
    .map((segment, index) => {
      const prefix =
        segment.start !== null && segment.start !== undefined
          ? formatTimestamp(segment.start)
          : `[${index + 1}]`;
      const speakerName = getSpeakerName(segment.speaker, speakers);
      return `${prefix} [${speakerName}] ${segment.text}`;
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

  // 2. 세그먼트 업데이트 - segment.id로 직접 찾기
  const updatedContents = updateSegmentsInContents(contents, (segments) => {
    const segmentIndex = findSegmentIndexById(segments, segmentId);

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
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없습니다.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 존재하지 않습니다.');
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

  // 4. DB에 저장 (contents + parsed_text)
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: updatedContents,
      parsed_text: parsedText,
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`대화 업데이트 실패: ${updateError.message}`);
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
 * text, speaker, speakerDefinitions를 동시에 업데이트할 수 있습니다.
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
      `전사 데이터 조회 실패: ${fetchError?.message || '전사 데이터를 찾을 수 없습니다.'}`
    );
  }

  const contents = transcribe.contents;
  if (!contents) {
    throw new Error('전사 결과가 존재하지 않습니다.');
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

  // 5. DB에 저장 (contents + parsed_text)
  const { error: updateError } = await supabase
    .from('transcribes')
    .update({
      contents: finalContents,
      parsed_text: parsedText,
    })
    .eq('id', transcribeId);

  if (updateError) {
    throw new Error(`대화 업데이트 실패: ${updateError.message}`);
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

