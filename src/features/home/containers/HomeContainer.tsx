import React from 'react';

import { ROUTES, getSessionDetailRoute } from '@/app/router/constants';
import { useClientList } from '@/features/client/hooks/useClientList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import type {
  HandwrittenTranscribe,
  SessionRecord,
  Transcribe,
} from '@/features/session/types';
import { getSpeakerDisplayName } from '@/features/session/utils/speakerUtils';
import { getTranscriptData } from '@/features/session/utils/transcriptParser';
import { trackEvent } from '@/lib/mixpanel';
import { GUIDE_URL } from '@/shared/constants/externalUrls';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  AddClientActionIcon,
  SessionHistoryActionIcon,
  UploadActionIcon,
} from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { useToast } from '@/shared/ui/composites/Toast';
import { WelcomeBanner } from '@/shared/ui/composites/WelcomeBanner';
import { formatKoreanDate } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import { ActionCard } from '@/widgets/home/ActionCard';
import { GreetingSection } from '@/widgets/home/GreetingSection';
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
  const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] =
    React.useState(true);

  const { currentLevel, isChecked, shouldShowOnboarding, startedAt } =
    useQuestStore();

  const openModal = useModalStore((state) => state.openModal);
  const { toast } = useToast();

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

  const { clients, isLoading: isLoadingClients } = useClientList();

  const sessionsFromQuery = sessionData?.sessions || [];
  const isDummyFlow =
    !isLoadingSessions &&
    !isLoadingClients &&
    sessionsFromQuery.length === 0 &&
    clients.length === 0;

  const sessionsWithTranscribes = isDummyFlow
    ? dummySessionRelations
    : sessionsFromQuery;
  const effectiveClients = isDummyFlow ? [dummyClient] : clients;

  const recentSessions = sessionsWithTranscribes.slice(0, 5);

  // 전사 내용을 SessionRecord용 텍스트로 변환
  const getSessionContent = (
    transcribe: Transcribe | HandwrittenTranscribe | null,
    isHandwritten: boolean
  ): string => {
    if (!transcribe) {
      return isHandwritten
        ? '입력된 텍스트가 없습니다.'
        : '전사 내용이 없습니다.';
    }

    if (isHandwritten) {
      if (typeof transcribe.contents === 'string') {
        return transcribe.contents;
      }
      return '입력된 텍스트가 없습니다.';
    }

    const transcriptData = getTranscriptData(transcribe as Transcribe);
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
      const clientName = client?.name || '클라이언트 없음';
      const isHandwritten = session.audio_meta_data === null;

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: clientName,
        session_number: getSessionNumber(session.id, session.client_id || ''),
        title: session.title || undefined,
        content: getSessionContent(transcribe, isHandwritten),
        note_types: getNoteTypesFromProgressNotes(progressNotes),
        created_at: session.created_at,
        processing_status: session.processing_status,
        progress_percentage: session.progress_percentage,
        current_step: session.current_step,
        error_message: session.error_message,
        is_handwritten: isHandwritten,
        stt_model:
          !isHandwritten && transcribe && 'stt_model' in transcribe
            ? (transcribe as Transcribe).stt_model
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

  React.useEffect(() => {
    if (isWelcomeBannerVisible && isChecked && !shouldShowOnboarding) {
      trackEvent(MixpanelEvent.WelcomeBannerView);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecked, shouldShowOnboarding]);

  const handleGuideClick = () => {
    window.open(GUIDE_URL, '_blank', 'noopener,noreferrer');
  };

  const handleUploadClick = () => {
    openModal('createMultiSession');
  };

  const handleAddCustomerClick = () => {
    openModal('addClient');
  };

  const handleViewAllRecordsClick = () => {
    navigateWithUtm(ROUTES.SESSIONS);
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

  const hasSession = sessionsFromQuery.length > 0;
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
        isWelcomeBannerVisible && (
          <WelcomeBanner
            title="마음토스 시작하기"
            description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
            buttonText="더 알아보기"
            onButtonClick={handleGuideClick}
            onClose={() => {
              trackEvent(MixpanelEvent.WelcomeBannerDismiss);
              setIsWelcomeBannerVisible(false);
            }}
          />
        )
      )}
    </div>
  ) : null;

  const greetingSection = (
    <GreetingSection userName={userName!} date={formatKoreanDate()} />
  );

  const actionCards = (
    <div className="mb-8 flex max-w-[1200px] flex-wrap gap-3 md:justify-start md:gap-5 lg:flex-nowrap lg:gap-6">
      <ActionCard
        icon={<UploadActionIcon size={24} />}
        title="녹음 파일 업로드하기"
        onClick={handleUploadClick}
        className="h-[136px] max-w-[157px] md:h-40 md:max-w-[277px]"
      />
      <ActionCard
        icon={<AddClientActionIcon size={24} className="text-danger" />}
        title="클라이언트 추가하기"
        onClick={handleAddCustomerClick}
        className="h-[136px] max-w-[157px] md:h-40 md:max-w-[277px]"
      />
      <ActionCard
        icon={<SessionHistoryActionIcon size={24} className="text-warn" />}
        title="상담 기록 전체보기"
        onClick={handleViewAllRecordsClick}
        className="h-[136px] max-w-[157px] md:h-40 md:max-w-[277px]"
      />
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
              아직 상담 기록이 없습니다.
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
