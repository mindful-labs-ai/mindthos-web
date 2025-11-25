import React from 'react';

import { useNavigate } from 'react-router-dom';

import { Title } from '@/components/ui';
import { WelcomeBanner } from '@/components/ui/composites/WelcomeBanner';
import { useClientList } from '@/feature/client/hooks/useClientList';
import type { Client } from '@/feature/client/types';
import { CreateSessionModal } from '@/feature/session/components/CreateSessionModal';
import { useCreateSession } from '@/feature/session/hooks/useCreateSession';
import type { FileInfo } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { ROUTES, getSessionDetailRoute } from '@/router/constants';
import { FileSearchIcon, UploadIcon, UserPlusIcon } from '@/shared/icons';
import { formatKoreanDate } from '@/shared/utils/date';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore } from '@/stores/sessionStore';

import { ActionCard } from '../components/ActionCard';
import { GreetingSection } from '../components/GreetingSection';
import { SessionCard } from '../components/SessionCard';

const HomePage = () => {
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName);
  const userId = useAuthStore((state) => state.userId);
  const defaultTemplateId = useAuthStore((state) => state.defaultTemplateId);
  const [showBanner, setShowBanner] = React.useState(true);
  const [isCreateSessionModalOpen, setIsCreateSessionModalOpen] =
    React.useState(false);

  // 고객 목록 가져오기
  const { clients } = useClientList();

  // 세션 생성 Hook
  const { createSession, isCreating, uploadProgress } = useCreateSession();

  // 세션 스토어
  const addSession = useSessionStore((state) => state.addSession);
  const sessions = useSessionStore((state) => state.sessions);
  const transcribes = useSessionStore((state) => state.transcribes);

  // sessions + transcribes 결합 (useMemo로 캐싱)
  const sessionsWithTranscribes = React.useMemo(() => {
    return sessions.map((session) => ({
      session,
      transcribe: transcribes[session.id] || null,
    }));
  }, [sessions, transcribes]);

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
    navigate(ROUTES.HISTORY);
  };

  const handleSessionClick = (sessionId: string) => {
    navigate(getSessionDetailRoute(sessionId));
  };

  const handleCreateSession = async (data: {
    client: Client | null;
    file?: FileInfo;
    directInput?: string;
  }) => {
    console.log('[handleCreateSession] 시작:', {
      userId,
      defaultTemplateId,
      data,
    });

    // 사용자 인증 확인
    if (!userId) {
      console.error('[handleCreateSession] 사용자 ID가 없습니다.');
      alert('로그인 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // userId를 number로 변환
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) {
      console.error('[handleCreateSession] 유효하지 않은 사용자 ID:', userId);
      alert('사용자 정보가 올바르지 않습니다. 다시 로그인해주세요.');
      return;
    }

    // 템플릿 ID 확인 (없으면 기본값 1 사용)
    const templateId = defaultTemplateId || 1;

    try {
      console.log('[handleCreateSession] API 호출 시작:', {
        userId: userIdNumber,
        clientId: data.client?.id,
        templateId,
      });

      // 실제 API 호출
      const response = await createSession({
        userId: userIdNumber,
        clientId: data.client?.id,
        uploadType: 'audio', // HomePage에서는 오디오만 지원
        transcribeType: 'advanced', // TODO: UI에서 선택 가능하게 변경
        templateId: templateId,
        file: data.file,
        directInput: data.directInput,
      });

      console.log('[handleCreateSession] 세션 생성 성공:', response);

      // TODO: 생성된 세션을 세션 스토어에 추가하거나 페이지 새로고침
      // 백그라운드에서 처리되므로 processing_status를 주기적으로 확인해야 함

      // 임시: 성공 메시지 표시
      alert(
        `✅ 세션이 생성되었습니다!\n\n세션 ID: ${response.session_id}\n\n백그라운드에서 STT 및 상담노트가 생성되고 있습니다.\n(처리 상태는 DB에서 확인할 수 있습니다)`
      );
    } catch (error) {
      console.error('[handleCreateSession] 세션 생성 실패:', error);
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류';
      alert(`❌ 세션 생성 실패\n\n${errorMessage}\n\n콘솔을 확인해주세요.`);
    }
  };

  // 전사 내용을 SessionCard용 텍스트로 변환 (처음 몇 줄만)
  const getSessionContent = (
    transcribe: {
      contents: {
        result: {
          segments: Array<{ text: string; speaker: number }>;
          speakers: Array<{ id: number; role: string }>;
        };
      } | null;
    } | null
  ): string => {
    if (!transcribe?.contents?.result?.segments) {
      return '전사 내용이 없습니다.';
    }

    const { segments, speakers } = transcribe.contents.result;

    // 처음 3개 세그먼트만 표시
    const previewSegments = segments.slice(0, 3);

    return previewSegments
      .map((seg) => {
        const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
        return `${speakerName} : ${seg.text}`;
      })
      .join(' ');
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-12 py-6 text-left lg:px-16 lg:py-10">
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
          <Title as="h2" className="text-xl font-semibold">
            지난 상담 기록
          </Title>
        </div>

        <div className="space-y-4">
          {sessionsWithTranscribes.length > 0 ? (
            sessionsWithTranscribes.map(({ session, transcribe }) => (
              <SessionCard
                key={session.id}
                title={session.title || '제목 없음'}
                content={getSessionContent(transcribe)}
                date={formatKoreanDate(new Date(session.created_at))}
                onClick={() => handleSessionClick(session.id)}
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
      </div>

      {/* 세션 생성 모달 - 오디오 파일만 */}
      <CreateSessionModal
        open={isCreateSessionModalOpen}
        onOpenChange={setIsCreateSessionModalOpen}
        type="audio"
        clients={clients}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
};

export default HomePage;
