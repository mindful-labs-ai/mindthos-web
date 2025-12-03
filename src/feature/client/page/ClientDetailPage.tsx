import React from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useToast } from '@/components/ui/composites/Toast';
import { SessionRecordCard } from '@/feature/session/components/SessionRecordCard';
import { getNoteTypesFromProgressNotes } from '@/feature/session/constants/noteTypeMapping';
import { useSessionList } from '@/feature/session/hooks/useSessionList';
import type { SessionRecord } from '@/feature/session/types';
import { getSpeakerDisplayName } from '@/feature/session/utils/speakerUtils';
import { getTranscriptData } from '@/feature/session/utils/transcriptParser';
import { getSessionDetailRoute } from '@/router/constants';
import { useAuthStore } from '@/stores/authStore';

import { AddClientModal } from '../components/AddClientModal';
import { ClientAnalysisTab } from '../components/ClientAnalysisTab';
import { CreateAnalysisModal } from '../components/CreateAnalysisModal';
import {
  useClientAnalyses,
  useClientAnalysisStatus,
  useClientTemplates,
  useCreateClientAnalysis,
} from '../hooks/useClientAnalysis';
import { useClientList } from '../hooks/useClientList';

type TabType = 'history' | 'analyze';

export const ClientDetailPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<TabType>('history');
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = React.useState(false);
  const [pollingVersion, setPollingVersion] = React.useState<number | null>(
    null
  );
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();

  // 클라이언트 목록 조회
  const { clients, isLoading: isLoadingClients } = useClientList();

  // 세션 목록 조회
  const { data: sessionsData, isLoading: isLoadingSessions } = useSessionList({
    userId: userId ? Number(userId) : 0,
    enabled: !!userId,
  });

  // 클라이언트 분석 관련 hooks
  const { data: templates } = useClientTemplates();
  const { data: analyses = [], isLoading: isLoadingAnalyses } =
    useClientAnalyses(clientId || '');
  const createAnalysisMutation = useCreateClientAnalysis();

  // 폴링 상태 조회
  useClientAnalysisStatus({
    clientId: clientId || '',
    version: pollingVersion || 0,
    enabled: !!clientId && !!pollingVersion,
    onComplete: () => {
      toast({
        title: '클라이언트 분석 완료',
        description: '클라이언트 분석이 완료되었습니다.',
        duration: 3000,
      });
      setPollingVersion(null);
    },
    onError: (error) => {
      toast({
        title: '분석 상태 조회 실패',
        description: error.message,
        duration: 3000,
      });
    },
  });

  // 현재 클라이언트 찾기
  const client = React.useMemo(() => {
    if (!clients || !clientId) return null;
    return clients.find((c) => c.id === clientId);
  }, [clients, clientId]);

  // 해당 클라이언트의 세션 필터링
  const clientSessions = React.useMemo(() => {
    if (!sessionsData?.sessions || !clientId) return [];
    return sessionsData.sessions.filter(
      (s) => s.session.client_id === clientId
    );
  }, [sessionsData, clientId]);

  // SessionRecord 형식으로 변환
  const sessionRecords: SessionRecord[] = React.useMemo(() => {
    if (!client) return [];

    return clientSessions.map(({ session, transcribe, progressNotes }) => {
      // 전사 데이터 파싱
      const transcriptData = getTranscriptData(transcribe);

      let content = '전사 내용이 없습니다.';
      if (transcriptData) {
        const { segments, speakers } = transcriptData;
        content =
          segments
            ?.slice(0, 3)
            .map((seg) => {
              const speakerName = getSpeakerDisplayName(seg.speaker, speakers);
              return `${speakerName}: ${seg.text}`;
            })
            .join(' ') || '전사 내용이 없습니다.';
      }

      // progress notes에서 note_types 추출 (constants 사용)
      const note_types = getNoteTypesFromProgressNotes(progressNotes);

      // 회기 번호 계산 (날짜순으로 정렬하여)
      const sortedSessions = [...clientSessions].sort(
        (a, b) =>
          new Date(a.session.created_at).getTime() -
          new Date(b.session.created_at).getTime()
      );
      const session_number =
        sortedSessions.findIndex((s) => s.session.id === session.id) + 1;

      return {
        session_id: session.id,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: client.name,
        session_number,
        content,
        note_types,
        created_at: session.created_at,
        processing_status: session.processing_status,
      };
    });
  }, [clientSessions, client]);

  // 클라이언트 분석 생성 핸들러
  const handleCreateAnalysis = async (data: {
    sessionIds: string[];
    aiSupervisionTemplateId: number;
    profilingTemplateId: number;
    psychotherapyPlanTemplateId: number;
  }) => {
    if (!clientId) return;

    try {
      const response = await createAnalysisMutation.mutateAsync({
        client_id: clientId,
        session_ids: data.sessionIds,
        ai_supervision_template_id: data.aiSupervisionTemplateId,
        profiling_template_id: data.profilingTemplateId,
        psychotherapy_plan_template_id: data.psychotherapyPlanTemplateId,
      });

      toast({
        title: '분석 시작',
        description: '백그라운드에서 클라이언트 분석을 진행하고 있습니다.',
        duration: 3000,
      });

      // 폴링 시작
      setPollingVersion(response.version);

      // 분석 탭으로 이동
      setActiveTab('analyze');
    } catch (error) {
      console.error('Failed to create analysis:', error);
      toast({
        title: '분석 실패',
        description:
          error instanceof Error ? error.message : '분석 생성에 실패했습니다.',
        duration: 3000,
      });
      throw error;
    }
  };

  // 로딩 중
  if (isLoadingClients || isLoadingSessions) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">로딩 중...</p>
      </div>
    );
  }

  // 클라이언트를 찾을 수 없음
  if (!client) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">클라이언트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-contrast">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-16 pt-[42px]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-bold text-fg">{client.name} </h1>
            <span className="text-xl font-semibold text-fg-muted">
              총 {sessionRecords.length}개의 상담 기록
            </span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAnalysisModalOpen(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600"
            >
              클라이언트 분석
            </button>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex-shrink-0 px-12">
        <div className="flex justify-center gap-8">
          <button
            onClick={() => setActiveTab('history')}
            className={`relative px-1 py-4 text-lg font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            상담 기록 및 정보
            <div
              className={`absolute bottom-2 right-0 h-0.5 bg-fg transition-all ${activeTab === 'history' ? 'w-full' : 'w-0'}`}
            />
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`relative px-1 py-4 text-lg font-medium transition-colors ${
              activeTab === 'analyze'
                ? 'text-fg'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            클라이언트 분석
            <div
              className={`absolute bottom-2 left-0 h-0.5 bg-fg transition-all ${activeTab === 'analyze' ? 'w-full' : 'w-0'}`}
            />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'history' ? (
          <div className="grid grid-cols-[1fr_400px] gap-6 px-12 py-6">
            {/* 왼쪽: 세션 목록 */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-medium text-fg">최신 날짜 순</h2>
              </div>

              {sessionRecords.length > 0 ? (
                <div className="space-y-3">
                  {sessionRecords.map((record) => (
                    <SessionRecordCard
                      key={record.session_id}
                      record={record}
                      onClick={(record) =>
                        navigate(getSessionDetailRoute(record.session_id))
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-border bg-surface">
                  <p className="text-fg-muted">상담 기록이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 우측: 클라이언트 정보 */}
            <div className="sticky top-6 h-fit pt-10">
              <div className="rounded-lg border border-border bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-fg">
                    클라이언트 정보
                  </h2>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-sm text-fg-muted transition-colors hover:text-fg"
                  >
                    편집
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">이름</p>
                    <p className="text-sm text-fg">{client.name}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">휴대폰 번호</p>
                    <p className="text-sm text-fg">{client.phone_number}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">이메일 주소</p>
                    <p className="text-sm text-fg">{client.email || '-'}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">상담 주제</p>
                    <p className="text-sm text-fg">
                      {client.counsel_theme || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">회기 수</p>
                    <p className="text-sm text-fg">
                      {client.counsel_number || '- '}회기
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-fg-muted">메모</p>
                    <p className="text-sm text-fg">{client.memo || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-12 py-6">
            <ClientAnalysisTab
              analyses={analyses}
              isLoading={isLoadingAnalyses}
            />
          </div>
        )}
      </div>

      {/* 클라이언트 수정 모달 */}
      <AddClientModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        initialData={client}
      />

      {/* 클라이언트 분석 모달 */}
      <CreateAnalysisModal
        open={isAnalysisModalOpen}
        onOpenChange={setIsAnalysisModalOpen}
        templates={templates}
        sessions={clientSessions.map((s) => s.session)}
        onCreateAnalysis={handleCreateAnalysis}
      />
    </div>
  );
};

export default ClientDetailPage;
