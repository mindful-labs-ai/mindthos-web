import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Title } from '@/components/ui';
import { Badge } from '@/components/ui/atoms/Badge';
import { WelcomeBanner } from '@/components/ui/composites/WelcomeBanner';
import { useClientList } from '@/feature/client/hooks/useClientList';
import { CreateSessionModal } from '@/feature/session/components/CreateSessionModal';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import {
  dummyClient,
  dummySessionRelations,
} from '@/feature/session/constants/dummySessions';
import { getNoteTypesFromProgressNotes } from '@/feature/session/constants/noteTypeMapping';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import type { SessionRecord, Transcribe } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getTranscriptData } from '@/feature/session/utils/transcriptParser';
import { ROUTES, getSessionDetailRoute } from '@/router/constants';
import { FileSearchIcon, UploadIcon, UserPlusIcon } from '@/shared/icons';
import { formatKoreanDate } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';

import { ActionCard } from '../components/ActionCard';
import { GreetingSection } from '../components/GreetingSection';

const HomePage = () => {
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName);
  const userId = useAuthStore((state) => state.userId);
  const [showBanner, setShowBanner] = React.useState(true);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    React.useState(false);

  // 세션 목록 조회 (TanStack Query)
  const { data: sessionData, isLoading: isLoadingSessions } = useSessionList({
    userId: parseInt(userId || '0'),
    enabled: !!userId,
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

  // 최근 5개 세션만 표시
  const recentSessions = sessionsWithTranscribes.slice(0, 5);

  const handleGuideClick = () => {
    // TODO: Navigate to guide page
  };

  const handleUploadClick = () => {
    // 바로 모달 열기 (오디오 파일 업로드만)
    setIsCreateSessionModalOpen(true);
  };

  const handleAddCustomerClick = () => {
    navigate(ROUTES.CLIENTS);
  };

  const handleViewAllRecordsClick = () => {
    navigate(ROUTES.SESSIONS);
  };

  const handleSessionClick = (record: SessionRecord) => {
    navigate(getSessionDetailRoute(record.session_id));
  };

  // 전사 내용을 SessionRecord용 텍스트로 변환 (처음 몇 줄만)
  const getSessionContent = (transcribe: Transcribe | null): string => {
    // raw_output 파싱 또는 기존 result 사용
    const transcriptData = getTranscriptData(transcribe);

    if (!transcriptData) {
      return '전사 내용이 없습니다.';
    }

    const { segments, speakers } = transcriptData;

    // 처음 3개 세그먼트만 표시
    const previewSegments = segments.slice(0, 3);

    return previewSegments
      .map((seg) => {
        const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
        return `${speakerName} : ${seg.text}`;
      })
      .join(' ');
  };

  // 세션 번호 계산 헬퍼 (클라이언트별로 계산)
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

  return (
    <div className="mx-auto w-full p-16 text-left">
      {showBanner && (
        <WelcomeBanner
          title="마음토스 시작하기"
          description="아직 마음토스 사용법이 어렵다면, 가이드를 확인해보세요."
          buttonText="더 알아보기"
          onButtonClick={handleGuideClick}
          onClose={() => setShowBanner(false)}
        />
      )}

      <GreetingSection userName={userName!} date={formatKoreanDate()} />

      <div className="mb-8 flex flex-row gap-4">
        <ActionCard
          icon={<UploadIcon size={24} className="text-primary-500" />}
          title="녹음 파일 업로드하기"
          onClick={handleUploadClick}
        />
        <ActionCard
          icon={<UserPlusIcon size={24} className="text-danger" />}
          title="고객 추가하기"
          onClick={handleAddCustomerClick}
        />
        <ActionCard
          icon={<FileSearchIcon size={24} className="text-warn" />}
          title="상담 기록 전체보기"
          onClick={handleViewAllRecordsClick}
        />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Title as="h2" className="text-xl font-semibold">
              지난 상담 기록
            </Title>
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
          ) : recentSessions.length > 0 ? (
            recentSessions.map(({ session, transcribe, progressNotes }) => {
              // 클라이언트 정보 찾기
              const client = effectiveClients.find(
                (c) => c.id === session.client_id
              );
              const clientName = client?.name || '고객 없음';

              // SessionRecord 형식으로 변환
              const sessionRecord: SessionRecord = {
                session_id: session.id,
                transcribe_id: transcribe?.id || null,
                client_id: session.client_id || '',
                client_name: clientName,
                session_number: getSessionNumber(
                  session.id,
                  session.client_id || ''
                ),
                title: session.title || undefined,
                content: getSessionContent(transcribe),
                note_types: getNoteTypesFromProgressNotes(progressNotes),
                created_at: session.created_at,
                processing_status: session.processing_status,
                progress_percentage: session.progress_percentage,
                current_step: session.current_step,
                error_message: session.error_message,
              };

              return (
                <SessionRecordCard
                  key={session.id}
                  record={sessionRecord}
                  isReadOnly={isDummyFlow}
                  onClick={handleSessionClick}
                />
              );
            })
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

        {/* 세션이 5개보다 많으면 더보기 버튼 표시 */}
        {sessionsWithTranscribes.length > 5 && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleViewAllRecordsClick}
              className="w-full rounded-lg border-2 border-border bg-surface px-6 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-contrast hover:text-fg"
            >
              더보기
            </button>
          </div>
        )}
      </div>

      {/* 세션 생성 모달 - 오디오 파일만 */}
      <CreateSessionModal
        open={isCreateSessionModalOpen}
        onOpenChange={setIsCreateSessionModalOpen}
        type="audio"
      />
    </div>
  );
};

export default HomePage;
