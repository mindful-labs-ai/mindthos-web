import { useCallback, useMemo, useState } from 'react';

import { useClientList } from '@/feature/client/hooks/useClientList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/feature/session/constants/dummySessions';
import { getNoteTypesFromProgressNotes } from '@/feature/session/constants/noteTypeMapping';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import type { SessionRecord, Transcribe } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getTranscriptData } from '@/feature/session/utils/transcriptParser';

const SESSIONS_PER_PAGE = 5;

interface UseSessionRecordsOptions {
  userId: string | null;
  perPage?: number;
}

export const useSessionRecords = ({
  userId,
  perPage = SESSIONS_PER_PAGE,
}: UseSessionRecordsOptions) => {
  const { clients, isLoading: isLoadingClients } = useClientList();

  // 페이지네이션 상태
  const [displayCount, setDisplayCount] = useState(perPage);

  // 세션 목록 조회
  const { data: sessionData, isLoading: isLoadingSessions } = useSessionList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
  });

  const sessionsFromQuery = sessionData?.sessions || [];

  // 더미 플로우 여부
  const isDummyFlow =
    !isLoadingSessions &&
    !isLoadingClients &&
    sessionsFromQuery.length === 0 &&
    clients.length === 0;

  const sessionsWithTranscribes = isDummyFlow
    ? dummySessionRelations
    : sessionsFromQuery;

  const effectiveClients = isDummyFlow ? [dummyClient] : clients;

  // 현재 표시할 세션 목록
  const displayedSessions = useMemo(() => {
    return sessionsWithTranscribes.slice(0, displayCount);
  }, [sessionsWithTranscribes, displayCount]);

  // 더 불러올 세션이 있는지
  const hasMoreSessions = displayCount < sessionsWithTranscribes.length;

  // 더보기 핸들러
  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => prev + perPage);
  }, [perPage]);

  // 표시 개수 초기화
  const resetDisplayCount = useCallback(() => {
    setDisplayCount(perPage);
  }, [perPage]);

  // 전사 내용을 SessionRecord용 텍스트로 변환
  const getSessionContent = useCallback(
    (transcribe: Transcribe | null): string => {
      const transcriptData = getTranscriptData(transcribe);
      if (!transcriptData) {
        return '전사 내용이 없습니다.';
      }
      const { segments, speakers } = transcriptData;
      const previewSegments = segments.slice(0, 3);
      return previewSegments
        .map((seg) => {
          const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
          return `${speakerName} : ${seg.text}`;
        })
        .join(' ');
    },
    []
  );

  // 세션 번호 계산
  const getSessionNumber = useCallback(
    (sessionId: string, clientId: string): number => {
      const allClientSessions = sessionsWithTranscribes
        .filter((s) => s.session.client_id === clientId)
        .map((s) => s.session)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return allClientSessions.findIndex((s) => s.id === sessionId) + 1;
    },
    [sessionsWithTranscribes]
  );

  // SessionRecord 변환 함수
  const toSessionRecord = useCallback(
    (sessionRelation: (typeof sessionsWithTranscribes)[number]): SessionRecord => {
      const { session, transcribe, progressNotes } = sessionRelation;
      const client = effectiveClients.find((c) => c.id === session.client_id);
      const clientName = client?.name || '고객 없음';

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: clientName,
        session_number: getSessionNumber(session.id, session.client_id || ''),
        title: session.title || undefined,
        content: getSessionContent(transcribe),
        note_types: getNoteTypesFromProgressNotes(progressNotes),
        created_at: session.created_at,
        processing_status: session.processing_status,
        progress_percentage: session.progress_percentage,
        current_step: session.current_step,
        error_message: session.error_message,
      };
    },
    [effectiveClients, getSessionNumber, getSessionContent]
  );

  // 표시할 SessionRecord 목록
  const sessionRecords = useMemo(() => {
    return displayedSessions.map(toSessionRecord);
  }, [displayedSessions, toSessionRecord]);

  return {
    // 데이터
    sessionRecords,
    displayedSessions,
    sessionsWithTranscribes,
    effectiveClients,

    // 상태
    isLoading: isLoadingSessions,
    isDummyFlow,
    hasMoreSessions,
    displayCount,

    // 액션
    handleLoadMore,
    resetDisplayCount,

    // 유틸
    toSessionRecord,
    getSessionContent,
    getSessionNumber,
  };
};
