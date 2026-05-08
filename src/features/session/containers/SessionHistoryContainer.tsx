import React from 'react';

import { useParams } from 'react-router-dom';

import { getSessionDetailRoute } from '@/app/router/constants';
import { useClientsList } from '@/features/client/hooks/useClientsList';
import type { Client } from '@/features/client/types';
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
import { useDevice } from '@/shared/hooks/useDevice';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';
import { SessionSideList } from '@/widgets/session/SessionSideList';
import { TabChangeConfirmModal } from '@/widgets/session/TabChangeConfirmModal';

import { MobileSessionHistoryView } from './MobileSessionHistoryView';
import { SessionHistoryView } from './SessionHistoryView';

export const SessionHistoryContainer: React.FC = () => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const { navigateWithUtm } = useNavigateWithUtm();
  const { sessionId } = useParams<{ sessionId: string }>();
  const userId = useAuthStore((state) => state.userId);
  // 클라이언트 카드와 동일한 RPC 사용 → session_count가 클라이언트 카드 표시값과 일치
  // 필터에 모든 클라이언트가 보여야 하므로 limit 충분히 크게 (p99=34, 안전망 500)
  const userIdNum = parseInt(userId || '0');
  const {
    items: clientPageItems,
    isLoading: isLoadingClients,
  } = useClientsList({
    counselorId: userIdNum,
    sortOrder: 'desc',
    limit: 500,
    enabled: !!userId,
  });
  // ClientsPageItem → Client 변환 (downstream 컴포넌트가 Client 타입 기대)
  const clients = React.useMemo<Client[]>(
    () =>
      clientPageItems.map((item) => ({
        id: item.id,
        counselor_id: userId || '',
        name: item.name,
        phone_number: item.phone_number || '',
        email: item.email,
        counsel_theme: item.counsel_theme,
        counsel_number: item.counsel_number ?? 0,
        counsel_done: item.counsel_done ?? false,
        memo: item.memo,
        pin: item.pin ?? false,
        created_at: item.created_at,
        updated_at: item.created_at, // RPC가 안 주므로 created_at으로 대체
        session_count: item.session_count, // ★ 클라이언트 카드와 동일한 정확한 전체 카운트
      })),
    [clientPageItems, userId]
  );
  const { toast } = useToast();

  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>(
    'newest'
  );
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>(
    []
  );

  const {
    items: sessionItems,
    isLoading: isLoadingSessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSessionsList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
    sortOrder: sortOrder === 'newest' ? 'desc' : 'asc',
    // 클라이언트 필터 활성 시 서버 측 IN 필터 + queryKey 분리 캐싱
    clientIds: selectedClientIds.length > 0 ? selectedClientIds : undefined,
    onSessionComplete: (session) => {
      toast({
        title: '상담 기록 생성 완료',
        description: session.title
          ? `"${session.title}" 만들었어요.`
          : '생성을 완료했어요.',
        duration: 5000,
      });
    },
    onSessionError: (session) => {
      toast({
        title: '세션 처리 실패',
        description: session.error_message || '세션 처리 중 문제가 생겼어요.',
        duration: 5000,
      });
    },
  });

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const hasAnyRealData = sessionItems.length > 0 || clients.length > 0;
  const isDummyFlow =
    !isLoadingSessions && !isLoadingClients && !hasAnyRealData;

  const sessionsWithData = React.useMemo(
    () => (isDummyFlow ? dummySessionRelations : sessionItems),
    [isDummyFlow, sessionItems]
  );
  const effectiveClients = React.useMemo(
    () => (isDummyFlow ? [dummyClient] : clients),
    [isDummyFlow, clients]
  );

  const getCardPreview = (
    transcribe: TranscribeListItem | HandwrittenTranscribeListItem | null,
    isHandwritten: boolean
  ): string => {
    if (!transcribe) {
      return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록이 없어요.';
    }
    const cleaned = formatPreviewText(transcribe.preview);
    if (cleaned) return cleaned;
    return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록 보기';
  };

  // 정렬·클라이언트 필터 모두 서버 측 — 클라이언트 측 필터링 불필요
  const filteredSessions = sessionsWithData;

  // 필터 메뉴에 표시할 클라이언트별 세션 수 — RPC가 직접 반환한 정확한 전체 카운트
  // (페이지네이션된 sessionsWithData에서 카운트 X — 첫 페이지에 없는 client는 0으로 잘못 표시됨)
  const sessionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    effectiveClients.forEach((c) => {
      counts[c.id] = c.session_count ?? 0;
    });
    return counts;
  }, [effectiveClients]);

  const records: SessionRecord[] = React.useMemo(() => {
    return filteredSessions.map(({ session, transcribe, progressNotes }) => {
      const client = effectiveClients.find((c) => c.id === session.client_id);
      const isHandwritten = session.audio_meta_data === null;
      const transcribeForPreview =
        transcribe && 'preview' in transcribe
          ? (transcribe as TranscribeListItem | HandwrittenTranscribeListItem)
          : null;

      const note_types = getNoteTypesFromProgressNotes(progressNotes);

      const allClientSessions = sessionsWithData
        .filter((s) => s.session.client_id === session.client_id)
        .map((s) => s.session)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      const session_number =
        allClientSessions.findIndex((s) => s.id === session.id) + 1;

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: client?.name || '내담자 없음',
        session_number,
        title: session.title || undefined,
        content: getCardPreview(transcribeForPreview, isHandwritten),
        note_types,
        created_at: session.created_at,
        processing_status: session.processing_status,
        is_handwritten: isHandwritten,
        stt_model:
          transcribe && 'stt_model' in transcribe
            ? transcribe.stt_model
            : null,
      };
    });
  }, [filteredSessions, effectiveClients, sessionsWithData]);

  const sessionListData = React.useMemo(() => {
    return filteredSessions
      .filter(({ session }) => {
        return session.processing_status === 'succeeded';
      })
      .map(({ session, transcribe }) => {
        const client = effectiveClients.find((c) => c.id === session.client_id);
        const audioDuration = session.audio_meta_data?.duration_seconds;

        const allClientSessions = sessionsWithData
          .filter((s) => s.session.client_id === session.client_id)
          .map((s) => s.session)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        const sessionNumber =
          allClientSessions.findIndex((s) => s.id === session.id) + 1;

        return {
          sessionId: session.id,
          title: session.title || '제목 없음',
          clientName: client?.name || '내담자 없음',
          sessionNumber,
          duration: audioDuration,
          hasAudio: !!session.audio_url,
          createdAt: session.created_at,
          isAdvancedTranscript:
            transcribe && 'stt_model' in transcribe
              ? transcribe.stt_model === 'gemini-3' ||
                transcribe.stt_model === 'advanced'
              : false,
          isHandwritten: session.audio_meta_data === null,
        };
      });
  }, [filteredSessions, effectiveClients, sessionsWithData]);

  const isEditing = useSessionStore((state) => state.isEditing);
  const cancelEditHandler = useSessionStore((state) => state.cancelEditHandler);

  const [isSessionChangeModalOpen, setIsSessionChangeModalOpen] =
    React.useState(false);
  const [pendingSessionId, setPendingSessionId] = React.useState<string | null>(
    null
  );

  const handleCardClick = (record: SessionRecord) => {
    if (isEditing) {
      setPendingSessionId(record.session_id);
      setIsSessionChangeModalOpen(true);
      return;
    }
    navigateWithUtm(getSessionDetailRoute(record.session_id));
  };

  const handleSessionClick = (selectedSessionId: string) => {
    if (isEditing) {
      setPendingSessionId(selectedSessionId);
      setIsSessionChangeModalOpen(true);
      return;
    }
    navigateWithUtm(getSessionDetailRoute(selectedSessionId));
  };

  const handleConfirmSessionChange = React.useCallback(() => {
    cancelEditHandler?.();
    if (pendingSessionId) {
      navigateWithUtm(getSessionDetailRoute(pendingSessionId));
    }
    setIsSessionChangeModalOpen(false);
    setPendingSessionId(null);
  }, [cancelEditHandler, pendingSessionId, navigateWithUtm]);

  const handleCancelSessionChange = React.useCallback(() => {
    setIsSessionChangeModalOpen(false);
    setPendingSessionId(null);
  }, []);

  const handleSortChange = (order: 'newest' | 'oldest') => {
    setSortOrder(order);
  };

  const handleClientChange = (clientIds: string[]) => {
    setSelectedClientIds(clientIds);
  };

  const handleFilterReset = () => {
    setSortOrder('newest');
    setSelectedClientIds([]);
  };

  const sideList = sessionId ? (
    <SessionSideList
      sessions={sessionListData}
      activeSessionId={sessionId}
      onSessionClick={handleSessionClick}
      sortOrder={sortOrder}
      selectedClientId={selectedClientIds}
      clients={effectiveClients}
      sessionCounts={sessionCounts}
      onSortChange={handleSortChange}
      onClientChange={handleClientChange}
      onFilterReset={handleFilterReset}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  ) : null;

  const sessionCards = isLoadingSessions ? (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
      <div className="text-center">
        <p className="typo-sm text-fg-muted">상담기록 목록을 불러오는 중...</p>
      </div>
    </div>
  ) : records.length > 0 ? (
    <>
      {records.map((record) => (
        <SessionRecordCard
          key={record.session_id}
          record={record}
          isReadOnly={isDummyFlow}
          onClick={() => handleCardClick(record)}
        />
      ))}
      <div ref={sentinelRef} />
    </>
  ) : (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
      <div className="text-center">
        <p className="typo-sm text-fg-muted">아직 상담 기록이 없어요.</p>
      </div>
    </div>
  );

  const sessionChangeModal = (
    <TabChangeConfirmModal
      open={isSessionChangeModalOpen}
      onOpenChange={setIsSessionChangeModalOpen}
      onCancel={handleCancelSessionChange}
      onConfirm={handleConfirmSessionChange}
    />
  );

  if (isMobileView) {
    return (
      <MobileSessionHistoryView
        sessionId={sessionId}
        isDummyFlow={isDummyFlow}
        effectiveClients={effectiveClients}
        sortOrder={sortOrder}
        selectedClientIds={selectedClientIds}
        sessionCounts={sessionCounts}
        onSortChange={handleSortChange}
        onClientChange={handleClientChange}
        onFilterReset={handleFilterReset}
        sessionCards={sessionCards}
        sessionChangeModal={sessionChangeModal}
      />
    );
  }

  return (
    <SessionHistoryView
      sessionId={sessionId}
      isDummyFlow={isDummyFlow}
      effectiveClients={effectiveClients}
      sortOrder={sortOrder}
      selectedClientIds={selectedClientIds}
      sessionCounts={sessionCounts}
      onSortChange={handleSortChange}
      onClientChange={handleClientChange}
      onFilterReset={handleFilterReset}
      sideList={sideList}
      sessionCards={sessionCards}
      sessionChangeModal={sessionChangeModal}
    />
  );
};

export default SessionHistoryContainer;
