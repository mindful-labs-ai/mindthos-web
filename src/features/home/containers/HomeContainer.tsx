import React from 'react';

import { ROUTES, getSessionDetailRoute } from '@/app/router/constants';
import { useClientList } from '@/features/client/hooks/useClientList';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { getNoteTypesFromProgressNotes } from '@/features/session/constants/noteTypeMapping';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import type {
  HandwrittenTranscribe,
  SessionRecord,
  Transcribe,
} from '@/features/session/types';
import { getSpeakerDisplayName } from '@/features/session/utils/speakerUtils';
import { getTranscriptData } from '@/features/session/utils/transcriptParser';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';
import { useQuestStore } from '@/stores/questStore';
import MobileView from '@/widgets/home/MobileView';

import { HomeView } from './HomeView';

const HomeContainer = () => {
  const { navigateWithUtm } = useNavigateWithUtm();
  const userName = useAuthStore((state) => state.userName);
  const userId = useAuthStore((state) => state.userId);
  const user = useAuthStore((state) => state.user);
  const [isWelcomeBannerVisible, setIsWelcomeBannerVisible] =
    React.useState(true);

  const { isMobile } = useDevice();

  const { currentLevel, isChecked, shouldShowOnboarding, startedAt } =
    useQuestStore();

  const openModal = useModalStore((state) => state.openModal);
  const { toast } = useToast();

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

  const handleGuideClick = () => {
    window.open(
      'https://rare-puppy-06f.notion.site/v2-2cfdd162832d801bae95f67269c062c7?source=copy_link',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleUploadClick = () => {
    openModal('createMultiSession');
  };

  const handleAddCustomerClick = () => {
    navigateWithUtm(ROUTES.CLIENTS);
  };

  const handleViewAllRecordsClick = () => {
    navigateWithUtm(ROUTES.SESSIONS);
  };

  const handleSessionClick = (record: SessionRecord) => {
    navigateWithUtm(getSessionDetailRoute(record.session_id));
  };

  const handleCompleteQuest3 = () => {
    if (user?.email) {
      useQuestStore.getState().completeNextStep(user.email);
    }
  };

  const handleOpenUserEdit = () => {
    openModal('userEdit');
  };

  if (isMobile) {
    return <MobileView />;
  }

  return (
    <HomeView
      userName={userName!}
      isChecked={isChecked}
      shouldShowOnboarding={shouldShowOnboarding}
      isWelcomeBannerVisible={isWelcomeBannerVisible}
      onCloseWelcomeBanner={() => setIsWelcomeBannerVisible(false)}
      completedCount={completedCount}
      remainingDays={remainingDays}
      hasSession={sessionsFromQuery.length > 0}
      isDummyFlow={isDummyFlow}
      isLoadingSessions={isLoadingSessions}
      recentSessionRecords={recentSessionRecords}
      hasMoreSessions={sessionsWithTranscribes.length > 5}
      onGuideClick={handleGuideClick}
      onUploadClick={handleUploadClick}
      onAddCustomerClick={handleAddCustomerClick}
      onViewAllRecordsClick={handleViewAllRecordsClick}
      onSessionClick={handleSessionClick}
      onCompleteQuest3={handleCompleteQuest3}
      onOpenUserEdit={handleOpenUserEdit}
    />
  );
};

export default HomeContainer;
