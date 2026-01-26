import React from 'react';

import { Outlet, useNavigate, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/atoms/Badge';
import { Button } from '@/components/ui/atoms/Button';
import { Title } from '@/components/ui/atoms/Title';
import { PopUp } from '@/components/ui/composites/PopUp';
import { Spotlight } from '@/components/ui/composites/Spotlight';
import { useToast } from '@/components/ui/composites/Toast';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { SessionClickTooltip } from '@/feature/onboarding/components/TutorialTooltips';
import { useTutorial } from '@/feature/onboarding/hooks/useTutorial';
import { FilterMenu } from '@/feature/session/components/FilterMenu';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import { SessionSideList } from '@/feature/session/components/SessionSideList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/feature/session/constants/dummySessions';
import { getNoteTypesFromProgressNotes } from '@/feature/session/constants/noteTypeMapping';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import type { SessionRecord } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getTranscriptData } from '@/feature/session/utils/transcriptParser';
import { getSessionDetailRoute } from '@/router/constants';
import { ChevronDownIcon, SortDescIcon, UserIcon } from '@/shared/icons';
import { useAuthStore } from '@/stores/authStore';
import { useQuestStore } from '@/stores/questStore';
import { useSessionStore } from '@/stores/sessionStore';

import { TabChangeConfirmModal } from '../components/TabChangeConfirmModal';

export const SessionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { checkIsTutorialActive, handleTutorialAction, endTutorial } =
    useTutorial({
      currentLevel: 1,
    });
  const userId = useAuthStore((state) => state.userId);
  const { clients, isLoading: isLoadingClients } = useClientList();
  const { toast } = useToast();

  // 필터 상태
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>(
    'newest'
  );
  const [selectedClientIds, setSelectedClientIds] = React.useState<string[]>(
    []
  );

  // 세션 목록 조회 (TanStack Query)
  const { data: sessionData, isLoading: isLoadingSessions } = useSessionList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
    onSessionComplete: (session) => {
      const isHandwritten = session.audio_meta_data === null;
      toast({
        title: isHandwritten ? '상담 기록 생성 완료' : '음성 파일 처리 완료',
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

  // 더미 데이터는 세션과 클라이언트가 모두 비어있을 때 표시하거나, 튜토리얼이 활성 상태일 때 표시
  const isTutorialActive = useQuestStore((state) => state.isTutorialActive);
  const hasAnyRealData = sessionsFromQuery.length > 0 || clients.length > 0;
  const isDummyFlow =
    ((!isLoadingSessions && !isLoadingClients) || isTutorialActive) &&
    (!hasAnyRealData || isTutorialActive);

  const sessionsWithData = React.useMemo(
    () => (isDummyFlow ? dummySessionRelations : sessionsFromQuery),
    [isDummyFlow, sessionsFromQuery]
  );
  const effectiveClients = React.useMemo(
    () => (isDummyFlow ? [dummyClient] : clients),
    [isDummyFlow, clients]
  );

  // 필터링 및 정렬된 세션 데이터
  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = [...sessionsWithData];

    // 클라이언트 필터링 (복수 선택)
    if (selectedClientIds.length > 0) {
      filtered = filtered.filter(
        (s) =>
          s.session.client_id && selectedClientIds.includes(s.session.client_id)
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      const dateA = new Date(a.session.created_at).getTime();
      const dateB = new Date(b.session.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [sessionsWithData, selectedClientIds, sortOrder]);

  // 클라이언트별 세션 개수
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

        // 직접 입력 세션 여부 확인
        const isHandwritten = session.audio_meta_data === null;

        let content = '전사 내용이 없습니다.';

        if (isHandwritten) {
          // 직접 입력 세션: contents가 string이므로 그대로 사용
          if (transcribe && typeof transcribe.contents === 'string') {
            content = transcribe.contents;
          } else {
            content = '입력된 텍스트가 없습니다.';
          }
        } else {
          // 일반 세션: raw_output 파싱 또는 기존 result 사용
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

        // progress notes에서 note_types 추출 (constants 사용)
        const note_types = getNoteTypesFromProgressNotes(progressNotes);

        // 해당 클라이언트의 모든 세션들을 날짜순으로 정렬하여 회기 번호 계산
        // 필터링과 관계없이 전체 세션에서 회기 번호 계산
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
          is_handwritten: session.audio_meta_data === null, // 직접 입력 세션 여부
          stt_model:
            transcribe && 'stt_model' in transcribe
              ? transcribe.stt_model
              : null, // 축어록 모델 타입
        };
      }
    );
  }, [filteredAndSortedSessions, effectiveClients, sessionsWithData]);

  // 간소화된 세션 리스트용 데이터 (사이드탭에서는 성공한 세션만 표시)
  const sessionListData = React.useMemo(() => {
    return filteredAndSortedSessions
      .filter(({ session }) => {
        // 사이드탭에서는 succeeded 상태인 세션만 표시
        return session.processing_status === 'succeeded';
      })
      .map(({ session, transcribe }) => {
        const client = effectiveClients.find((c) => c.id === session.client_id);
        const audioDuration = session.audio_meta_data?.duration_seconds;

        // 해당 클라이언트의 모든 세션들을 날짜순으로 정렬하여 회기 번호 계산
        // 필터링과 관계없이 전체 세션에서 회기 번호 계산
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
              ? transcribe.stt_model === 'gemini-3'
              : false,
          isHandwritten: session.audio_meta_data === null, // 직접 입력 세션 여부
        };
      });
  }, [filteredAndSortedSessions, effectiveClients, sessionsWithData]);

  // 편집 상태 체크를 위한 store 연결
  const isEditing = useSessionStore((state) => state.isEditing);
  const cancelEditHandler = useSessionStore((state) => state.cancelEditHandler);

  // 세션 이동 확인 모달 상태
  const [isSessionChangeModalOpen, setIsSessionChangeModalOpen] =
    React.useState(false);
  const [pendingSessionId, setPendingSessionId] = React.useState<string | null>(
    null
  );

  const handleCardClick = (record: SessionRecord) => {
    // 편집 중이면 확인 모달 표시
    if (isEditing) {
      setPendingSessionId(record.session_id);
      setIsSessionChangeModalOpen(true);
      return;
    }
    navigate(getSessionDetailRoute(record.session_id));
  };

  const handleSessionClick = (selectedSessionId: string) => {
    // 편집 중이면 확인 모달 표시
    if (isEditing) {
      setPendingSessionId(selectedSessionId);
      setIsSessionChangeModalOpen(true);
      return;
    }
    navigate(getSessionDetailRoute(selectedSessionId));
  };

  // 세션 이동 확인
  const handleConfirmSessionChange = React.useCallback(() => {
    // 편집 취소
    cancelEditHandler?.();
    // 세션 이동
    if (pendingSessionId) {
      navigate(getSessionDetailRoute(pendingSessionId));
    }
    setIsSessionChangeModalOpen(false);
    setPendingSessionId(null);
  }, [cancelEditHandler, pendingSessionId, navigate]);

  // 세션 이동 취소
  const handleCancelSessionChange = React.useCallback(() => {
    setIsSessionChangeModalOpen(false);
    setPendingSessionId(null);
  }, []);

  // 필터 핸들러
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

  const sessionClickTooltip = React.useMemo(() => <SessionClickTooltip />, []);

  return (
    <div className="flex h-full">
      {/* 왼쪽: 세션 목록 - 항상 렌더링 (언마운트 방지) */}
      {sessionId && (
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
      )}

      {/* 메인 컨텐츠 영역 */}
      {!sessionId ? (
        // 전체 카드 리스트
        <div className="mx-auto flex w-full max-w-[1332px] flex-1 flex-col px-16 pt-[42px] transition-all duration-300">
          <div className="flex-shrink-0 pb-6">
            <div className="flex items-center gap-2">
              <Title as="h1" className="text-start text-2xl font-bold">
                상담 기록
              </Title>
              {isDummyFlow && (
                <Badge tone="warning" variant="soft" size="sm">
                  예시
                </Badge>
              )}
            </div>

            <div className="mt-6 flex justify-start gap-3">
              {/* 고객 필터 버튼 */}
              <div>
                <PopUp
                  trigger={
                    <Button
                      variant="solid"
                      tone="surface"
                      size="sm"
                      icon={<UserIcon size={16} />}
                      iconRight={<ChevronDownIcon size={16} />}
                    >
                      {selectedClientIds.length === 0
                        ? '모든 클라이언트'
                        : selectedClientIds.length === 1
                          ? effectiveClients.find(
                              (c) => c.id === selectedClientIds[0]
                            )?.name || '모든 클라이언트'
                          : `${selectedClientIds.length}명 선택`}
                    </Button>
                  }
                  content={
                    <FilterMenu
                      sortOrder={sortOrder}
                      selectedClientIds={selectedClientIds}
                      clients={effectiveClients}
                      sessionCounts={sessionCounts}
                      onSortChange={handleSortChange}
                      onClientChange={handleClientChange}
                      onReset={handleFilterReset}
                      initialView="client"
                    />
                  }
                  placement="bottom"
                  className="!p-4"
                />
              </div>

              {/* 정렬 버튼 */}
              <div>
                <PopUp
                  trigger={
                    <Button
                      variant="solid"
                      tone="surface"
                      size="sm"
                      icon={<SortDescIcon size={16} />}
                      iconRight={<ChevronDownIcon size={16} />}
                    >
                      {sortOrder === 'newest'
                        ? '최신 날짜 순'
                        : '오래된 날짜 순'}
                    </Button>
                  }
                  content={
                    <FilterMenu
                      sortOrder={sortOrder}
                      selectedClientIds={selectedClientIds}
                      clients={effectiveClients}
                      sessionCounts={sessionCounts}
                      onSortChange={handleSortChange}
                      onClientChange={handleClientChange}
                      onReset={handleFilterReset}
                      initialView="sort"
                    />
                  }
                  placement="bottom"
                  className="!p-4"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-3">
              {isLoadingSessions ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
                  <div className="text-center">
                    <p className="text-sm text-fg-muted">
                      상담기록 목록을 불러오는 중...
                    </p>
                  </div>
                </div>
              ) : records.length > 0 ? (
                records.map((record) => {
                  const isStep2Active =
                    record.session_id === 'dummy_session_3' &&
                    checkIsTutorialActive(2);

                  const card = (
                    <SessionRecordCard
                      key={record.session_id}
                      record={record}
                      isReadOnly={isDummyFlow}
                      onClick={() =>
                        handleTutorialAction(() => handleCardClick(record), 2)
                      }
                    />
                  );

                  if (isStep2Active) {
                    return (
                      <Spotlight
                        key={record.session_id}
                        isActive={isStep2Active}
                        onClose={() => endTutorial()}
                        tooltip={sessionClickTooltip}
                        tooltipPosition="bottom"
                      >
                        {card}
                      </Spotlight>
                    );
                  }

                  return card;
                })
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-surface p-6">
                  <div className="text-center">
                    <p className="text-sm text-fg-muted">
                      아직 상담 기록이 없습니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 오른쪽: 선택된 세션 상세
        <div className="flex-1">
          <Outlet />
        </div>
      )}

      {/* 세션 이동 확인 모달 */}
      <TabChangeConfirmModal
        open={isSessionChangeModalOpen}
        onOpenChange={setIsSessionChangeModalOpen}
        onCancel={handleCancelSessionChange}
        onConfirm={handleConfirmSessionChange}
      />
    </div>
  );
};

export default SessionHistoryPage;
