import React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  ROUTES,
  getAiSupervisionRoute,
  getSessionDetailRoute,
} from '@/app/router/constants';
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
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';
import { creditQueryKeys } from '@/shared/constants/queryKeys';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  AddClientActionIcon,
  SessionHistoryActionIcon,
  SideCalendarIcon,
  SideGenogramIcon,
  SideSupervisionIcon,
  UploadActionIcon,
} from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { useToast } from '@/shared/ui/composites/Toast';
import { formatKoreanDate } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import { ActionCard } from '@/widgets/home/ActionCard';
import { GreetingSection } from '@/widgets/home/GreetingSection';
import { HomeEventBanner } from '@/widgets/home/HomeEventBanner';
import { QuestStep } from '@/widgets/onboarding/QuestStep';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';

import { HomeView } from './HomeView';
import { MobileHomeView } from './MobileHomeView';

const HomeContainer = () => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const { navigateWithUtm } = useNavigateWithUtm();
  const userName = useAuthStore((state) => state.userName);
  const userId = useAuthStore((state) => state.userId);
  const user = useAuthStore((state) => state.user);

  const { currentLevel, isChecked, shouldShowOnboarding, startedAt } =
    useQuestStore();

  const openModal = useModalStore((state) => state.openModal);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 세션 status 전이 시점에 크레딧 잔액 동기화
  // (mavo-api 파이프라인이 끝나면 트리거가 commit/release를 비동기로 호출하므로,
  //  FE는 status 전이를 감지한 시점에 invalidate해서 새 잔액을 가져옴)
  const invalidateCreditOnTransition = React.useCallback(() => {
    const userIdNum = Number(userId);
    if (Number.isNaN(userIdNum)) return;
    queryClient.invalidateQueries({
      queryKey: creditQueryKeys.summary(userIdNum),
    });
  }, [queryClient, userId]);

  const { items: sessionItems, isLoading: isLoadingSessions } = useSessionsList(
    {
      userId: parseInt(userId || '0'),
      enabled: !!userId,
      sortOrder: 'desc',
      onSessionComplete: (session) => {
        toast({
          title: '상담 기록 생성 완료',
          description: session.title
            ? `"${session.title}" 만들었어요.`
            : '생성을 완료했어요.',
          duration: 5000,
        });
        invalidateCreditOnTransition();
      },
      onSessionError: (session) => {
        toast({
          title: '세션 처리 실패',
          description: session.error_message || '세션 처리 중 문제가 생겼어요.',
          duration: 5000,
        });
        invalidateCreditOnTransition();
      },
    }
  );

  const { clients, isLoading: isLoadingClients } = useClientList();

  const isDummyFlow =
    !isLoadingSessions &&
    !isLoadingClients &&
    sessionItems.length === 0 &&
    clients.length === 0;

  const sessionsWithTranscribes = isDummyFlow
    ? dummySessionRelations
    : sessionItems;
  const effectiveClients = isDummyFlow ? [dummyClient] : clients;

  const recentSessions = sessionsWithTranscribes.slice(0, 5);

  const getCardPreview = (
    transcribe: TranscribeListItem | HandwrittenTranscribeListItem | null,
    isHandwritten: boolean
  ): string => {
    if (!transcribe) {
      return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록이 없어요.';
    }
    // 비식별화/비언어 태그 정제 후 표시
    const cleaned = formatPreviewText(transcribe.preview);
    if (cleaned) return cleaned;
    return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록 보기';
  };

  const getSessionNumber = (sessionId: string, clientId: string): number => {
    const allClientSessions = sessionsWithTranscribes
      .filter((s) => s.session.client_id === clientId)
      .map((s) => s.session)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    return allClientSessions.findIndex((s) => s.id === sessionId) + 1;
  };

  // SessionRecord로 변환
  const recentSessionRecords: SessionRecord[] = recentSessions.map(
    ({ session, transcribe, progressNotes }) => {
      const client = effectiveClients.find((c) => c.id === session.client_id);
      const clientName = client?.name || '내담자 없음';
      const isHandwritten = session.audio_meta_data === null;
      const transcribeForPreview =
        transcribe && 'preview' in transcribe
          ? (transcribe as TranscribeListItem | HandwrittenTranscribeListItem)
          : null;

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: clientName,
        session_number: getSessionNumber(session.id, session.client_id || ''),
        title: session.title || undefined,
        content: getCardPreview(transcribeForPreview, isHandwritten),
        note_types: getNoteTypesFromProgressNotes(progressNotes),
        created_at: session.created_at,
        processing_status: session.processing_status,
        progress_percentage: session.progress_percentage,
        current_step: session.current_step,
        error_message: session.error_message,
        is_handwritten: isHandwritten,
        stt_model:
          !isHandwritten && transcribe && 'stt_model' in transcribe
            ? transcribe.stt_model
            : null,
      };
    }
  );

  const completedCount = currentLevel > 0 ? currentLevel - 1 : 0;

  const calculateRemainingDays = (start: string | null) => {
    if (!start) return 7;
    const startDate = new Date(start);
    const now = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
  const remainingDays = calculateRemainingDays(startedAt);

  const handleUploadClick = () => {
    openModal('createMultiSession');
  };

  const handleAddCustomerClick = () => {
    openModal('addClient');
  };

  const handleViewAllRecordsClick = () => {
    navigateWithUtm(ROUTES.SESSIONS);
  };

  const handleGenogramClick = () => {
    navigateWithUtm(ROUTES.GENOGRAM);
  };

  const handleCalendarClick = () => {
    navigateWithUtm(ROUTES.CALENDAR);
  };

  const handleSupervisionClick = () => {
    navigateWithUtm(getAiSupervisionRoute());
  };

  const handleSessionClick = (record: SessionRecord) => {
    trackEvent(MixpanelEvent.SessionCardClick, {
      session_id: record.session_id,
    });
    navigateWithUtm(getSessionDetailRoute(record.session_id));
  };

  const handleCompleteQuest3 = () => {
    if (user?.email) {
      useQuestStore.getState().completeNextStep(user.email);
    }
  };

  const hasSession = sessionItems.length > 0;
  const hasMoreSessions = sessionsWithTranscribes.length > 5;

  const onboardingSection = isChecked ? (
    <div className="max-w-[1200px]">
      {shouldShowOnboarding ? (
        <QuestStep
          completedStepCount={completedCount}
          remainingDays={remainingDays}
          onOpenCreateSession={handleUploadClick}
          hasSession={hasSession}
          onCompleteQuest3={handleCompleteQuest3}
        />
      ) : (
        // 웰컴 배너 대체 — 이벤트 배너 띠 (닫음 상태는 위젯이 localStorage로 관리)
        <HomeEventBanner />
      )}
    </div>
  ) : null;

  const greetingSection = (
    <GreetingSection userName={userName!} date={formatKoreanDate()} />
  );

  const actionCardClass = 'h-[136px] max-w-[157px] md:h-40 md:max-w-[277px]';
  const actionCards = (
    <div className="mb-8 flex max-w-[1200px] flex-col gap-3 md:gap-6">
      <div className="flex flex-wrap gap-3 md:gap-5 lg:flex-nowrap lg:gap-6">
        <ActionCard
          icon={<UploadActionIcon size={24} />}
          title="녹음 파일 업로드하기"
          onClick={handleUploadClick}
          className={actionCardClass}
        />
        <ActionCard
          icon={<AddClientActionIcon size={24} className="text-danger" />}
          title="내담자 추가하기"
          onClick={handleAddCustomerClick}
          className={actionCardClass}
        />
        <ActionCard
          icon={<SessionHistoryActionIcon size={24} className="text-warn" />}
          title="상담 기록 전체보기"
          onClick={handleViewAllRecordsClick}
          className={actionCardClass}
        />
        <ActionCard
          icon={<SideGenogramIcon size={24} className="text-[#CACA2A]" />}
          title="가계도 그리기"
          onClick={handleGenogramClick}
          className={actionCardClass}
        />
      </div>
      <div className="flex flex-wrap gap-3 md:gap-5 lg:flex-nowrap lg:gap-6">
        <ActionCard
          icon={<SideCalendarIcon size={24} className="text-[#6E81EA]" />}
          title="상담 일정 추가하기"
          onClick={handleCalendarClick}
          className={actionCardClass}
        />
        <ActionCard
          icon={<SideSupervisionIcon size={24} className="text-[#B065E5]" />}
          title="AI 슈퍼비전 받기"
          onClick={handleSupervisionClick}
          className={actionCardClass}
        />
      </div>
    </div>
  );

  const sessionSection = (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-l font-headline">지난 상담 기록</h2>
          {isDummyFlow && (
            <Badge tone="warning" variant="soft" size="sm">
              예시
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isLoadingSessions ? (
          <div className="rounded-lg border border-surface-strong bg-surface-contrast p-8 text-center">
            <p className="text-fg-muted">상담기록 목록을 불러오는 중...</p>
          </div>
        ) : recentSessionRecords.length > 0 ? (
          recentSessionRecords.map((record) => (
            <SessionRecordCard
              key={record.session_id}
              record={record}
              isReadOnly={isDummyFlow}
              onClick={handleSessionClick}
            />
          ))
        ) : (
          <div className="rounded-lg border border-surface-strong bg-surface-contrast p-8 text-center">
            <p className="text-fg-muted">
              아직 상담 기록이 없어요.
              <br />
              녹음 파일을 업로드하여 첫 상담 기록을 만들어보세요.
            </p>
          </div>
        )}
      </div>

      {hasMoreSessions && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleViewAllRecordsClick}
            className="border-default typo-sm w-full rounded-lg bg-surface px-6 py-2.5 font-medium text-fg-muted transition-colors lg:hover:bg-surface-contrast lg:hover:text-fg"
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );

  const viewProps = {
    onboardingSection,
    greetingSection,
    actionCards,
    sessionSection,
  };

  if (isMobileView) {
    return <MobileHomeView {...viewProps} />;
  }

  return <HomeView {...viewProps} />;
};

export default HomeContainer;
