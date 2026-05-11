import { useCallback, useMemo, useState } from 'react';

import { useClientList } from '@/features/client/hooks/useClientList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { useSessionsList } from '@/features/session/hooks/useSessionsList';
import type {
  HandwrittenTranscribeListItem,
  SessionRecord,
  TranscribeListItem,
} from '@/features/session/types';
import { formatPreviewText } from '@/features/session/utils/formatPreview';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';

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

  // 세션 목록 조회 — paginated. 모바일 홈은 최근 N개만 표시
  const {
    items: sessionItems,
    isLoading: isLoadingSessions,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSessionsList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
    sortOrder: 'desc',
    limit: 20,
  });

  const sessionsFromQuery = sessionItems;

  // 더미 플로우 여부
  const isDummyFlow =
    !isLoadingSessions &&
    !isLoadingClients &&
    sessionsFromQuery.length === 0 &&
    clients.length === 0;

  const sessionsWithTranscribes = isDummyFlow
    ? dummySessionRelations
    : sessionsFromQuery;

  const effectiveClients = useMemo(
    () => (isDummyFlow ? [dummyClient] : clients),
    [isDummyFlow, clients]
  );

  // 현재 표시할 세션 목록
  const displayedSessions = useMemo(() => {
    return sessionsWithTranscribes.slice(0, displayCount);
  }, [sessionsWithTranscribes, displayCount]);

  // 더 불러올 세션이 있는지 — 클라 측 displayCount 또는 서버 측 다음 페이지 둘 중 하나
  const hasMoreSessions =
    displayCount < sessionsWithTranscribes.length || hasNextPage;

  // 더보기 핸들러 — 우선 로드된 데이터 안에서 displayCount 증가, 끝까지 보였으면 다음 페이지 fetch
  const handleLoadMore = useCallback(() => {
    if (displayCount < sessionsWithTranscribes.length) {
      setDisplayCount((prev) => prev + perPage);
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
      setDisplayCount((prev) => prev + perPage);
    }
  }, [
    displayCount,
    sessionsWithTranscribes.length,
    perPage,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  // 표시 개수 초기화
  const resetDisplayCount = useCallback(() => {
    setDisplayCount(perPage);
  }, [perPage]);

  // 전사 미리보기 — paginated 데이터에는 contents 없음. preview 컬럼 + 정제
  const getSessionContent = useCallback(
    (
      transcribe: TranscribeListItem | HandwrittenTranscribeListItem | null
    ): string => {
      if (!transcribe) return '축어록이 없어요.';
      const cleaned = formatPreviewText(transcribe.preview);
      if (cleaned) return cleaned;
      return '축어록 보기';
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
    (
      sessionRelation: (typeof sessionsWithTranscribes)[number]
    ): SessionRecord => {
      const { session, transcribe, progressNotes } = sessionRelation;
      const client = effectiveClients.find((c) => c.id === session.client_id);
      const clientName = client?.name || '내담자 없음';

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
