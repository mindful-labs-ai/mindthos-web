import React from 'react';

import { useParams } from 'react-router-dom';

import { getSessionDetailRoute } from '@/app/router/constants';
import { useClientList } from '@/features/client/hooks/useClientList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import type { SessionRecord } from '@/features/session/types';
import { getSpeakerDisplayName } from '@/features/session/utils/speakerUtils';
import { getTranscriptData } from '@/features/session/utils/transcriptParser';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';
import { useDevice } from '@/shared/hooks/useDevice';
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
  const { clients, isLoading: isLoadingClients } = useClientList();
  const { toast } = useToast();

  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>(
    'newest'
  );
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>(
    []
  );

  const { data: sessionData, isLoading: isLoadingSessions } = useSessionList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
    onSessionComplete: (session) => {
      toast({
        title: '상담 기록 생성 완료',
        description: session.title
          ? `"${session.title}" 생성 완료 되었습니다.`
          : '생성 완료 되었습니다.',
        duration: 5000,
      });
    },
    onSessionError: (session) => {
      toast({
        title: '세션 처리 실패',
        description:
          session.error_message || '세션 처리 중 문제가 발생했습니다.',
        duration: 5000,
      });
    },
  });

  const sessionsFromQuery = React.useMemo(
    () => sessionData?.sessions || [],
    [sessionData?.sessions]
  );

  const hasAnyRealData = sessionsFromQuery.length > 0 || clients.length > 0;
  const isDummyFlow =
    !isLoadingSessions && !isLoadingClients && !hasAnyRealData;

  const sessionsWithData = React.useMemo(
    () => (isDummyFlow ? dummySessionRelations : sessionsFromQuery),
    [isDummyFlow, sessionsFromQuery]
  );
  const effectiveClients = React.useMemo(
    () => (isDummyFlow ? [dummyClient] : clients),
    [isDummyFlow, clients]
  );

  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = [...sessionsWithData];

    if (selectedClientIds.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.session.client_id && selectedClientIds.includes(s.session.client_id)
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.session.created_at).getTime();
      const dateB = new Date(b.session.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [sessionsWithData, selectedClientIds, sortOrder]);

  const sessionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    sessionsWithData.forEach(({ session }) => {
      if (session.client_id) {
        counts[session.client_id] = (counts[session.client_id] || 0) + 1;
      }
    });
    return counts;
  }, [sessionsWithData]);

  const records: SessionRecord[] = React.useMemo(() => {
    return filteredAndSortedSessions.map(
      ({ session, transcribe, progressNotes }) => {
        const client = effectiveClients.find((c) => c.id === session.client_id);
        const isHandwritten = session.audio_meta_data === null;

        let content = '전사 내용이 없습니다.';

        if (isHandwritten) {
          if (transcribe && typeof transcribe.contents === 'string') {
            content = transcribe.contents;
          } else {
            content = '입력된 텍스트가 없습니다.';
          }
        } else {
          const transcriptData = getTranscriptData(
            transcribe as Parameters<typeof getTranscriptData>[0]
          );
          if (transcriptData) {
            const { segments, speakers } = transcriptData;
            content =
              segments
                ?.slice(0, 3)
                .map((seg) => {
                  const speakerName = getSpeakerDisplayName(
                    seg.speaker,
                    speakers
                  );
                  return `${speakerName}: ${seg.text}`;
                })
                .join(' ') || '전사 내용이 없습니다.';
          }
        }

        const note_types = getNoteTypesFromProgressNotes(progressNotes);

        const allClientSessions = sessionsWithData
          .filter((s) => s.session.client_id === session.client_id)
          .map((s) => s.session)
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
        const session_number =
          allClientSessions.findIndex((s) => s.id === session.id) + 1;

        return {
          session_id: session.id,
          transcribe_id: transcribe?.id || null,
          client_id: session.client_id || '',
          client_name: client?.name || '클라이언트 없음',
          session_number,
          title: session.title || undefined,
          content,
          note_types,
          created_at: session.created_at,
          processing_status: session.processing_status,
          is_handwritten: session.audio_meta_data === null,
          stt_model:
            transcribe && 'stt_model' in transcribe
              ? transcribe.stt_model
              : null,
        };
      }
    );
  }, [filteredAndSortedSessions, effectiveClients, sessionsWithData]);

  const sessionListData = React.useMemo(() => {
    return filteredAndSortedSessions
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
          clientName: client?.name || '클라이언트 없음',
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
  }, [filteredAndSortedSessions, effectiveClients, sessionsWithData]);

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
    />
  ) : null;

  const sessionCards = isLoadingSessions ? (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
      <div className="text-center">
        <p className="typo-sm text-fg-muted">상담기록 목록을 불러오는 중...</p>
      </div>
    </div>
  ) : records.length > 0 ? (
    records.map((record) => (
      <SessionRecordCard
        key={record.session_id}
        record={record}
        isReadOnly={isDummyFlow}
        onClick={() => handleCardClick(record)}
      />
    ))
  ) : (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
      <div className="text-center">
        <p className="typo-sm text-fg-muted">아직 상담 기록이 없습니다.</p>
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
