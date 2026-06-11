import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import {
  clientAnalysisQueryKeys,
  useClientAnalyses,
  useClientAnalysisStatus,
  useClientTemplates,
  useCreateClientAnalysis,
} from '@/features/client/hooks/useClientAnalysis';
import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { useAllClientSessions } from '@/features/session/hooks/useSessionsList';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { clientAnalysisService } from '@/shared/api/supabase/clientAnalysisQueries';
import { CREDIT_COST } from '@/shared/constants/credit';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { SideSupervisionIcon } from '@/shared/icons';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { ClientSidebar } from '@/widgets/client/ClientSidebar';
import { CreateAnalysisModal } from '@/widgets/client/CreateAnalysisModal';

import { SupervisionEmptyView } from '../components/SupervisionEmptyView';
import { SupervisionReportView } from '../components/SupervisionReportView';
import { SupervisionTabs } from '../components/SupervisionTabs';

/**
 * AI 슈퍼비전 메인 화면.
 * 내담자 상세의 다회기 분석 탭과 동일한 데이터(useClientAnalyses 등)를 사용하고
 * 뷰만 독립 페이지로 분리. 생성/재생성은 기존 CreateAnalysisModal 재사용.
 */
export function AiSupervisionContainer() {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [searchParams] = useSearchParams();
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const clientId = searchParams.get('clientId');

  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const checkCredit = useCreditGuard();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = React.useState(false);
  const [pollingVersion, setPollingVersion] = React.useState<number | null>(
    null
  );

  const { clients } = useClientList();
  const selectedClient = clients.find((c) => c.id === clientId) ?? null;

  const { data: templates } = useClientTemplates();
  const { data: analyses = [], isLoading: isLoadingAnalyses } =
    useClientAnalyses(clientId || '');
  const createAnalysisMutation = useCreateClientAnalysis();

  // 분석 모달용 세션 목록 — 모달 열릴 때만 활성화 (내담자 상세와 동일)
  const { data: allClientSessionItems } = useAllClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId || '',
    enabled: isAnalysisModalOpen && !!clientId && !!userId,
    sortOrder: 'desc',
  });

  useClientAnalysisStatus({
    clientId: clientId || '',
    version: pollingVersion || 0,
    enabled: !!clientId && !!pollingVersion,
    onComplete: () => {
      toast({
        title: 'AI 슈퍼비전 완료',
        description: 'AI 슈퍼비전 보고서를 만들었어요.',
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

  // 내담자 전환 시 폴링 상태 초기화
  React.useEffect(() => {
    setPollingVersion(null);
  }, [clientId]);

  const handleSaveAnalysisContent = React.useCallback(
    async (analysisId: string, content: string) => {
      await clientAnalysisService.updateAnalysisContent(analysisId, content);
      queryClient.invalidateQueries({
        queryKey: clientAnalysisQueryKeys.analysesByClient(clientId || ''),
      });
    },
    [clientId, queryClient]
  );

  const handleCreateAnalysis = async (data: {
    sessionIds: string[];
    aiSupervisionTemplateId: number;
  }) => {
    if (!clientId) return;

    // 액션 직전에 fresh 잔액으로 가드
    const guard = await checkCredit(CREDIT_COST.CLIENT_ANALYSIS);
    if (!guard.ok && !guard.unavailable) {
      toast({
        title: '크레딧 부족',
        description: `AI 슈퍼비전에 ${CREDIT_COST.CLIENT_ANALYSIS} 크레딧이 필요해요. (보유: ${guard.remaining})`,
        duration: 5000,
      });
      return;
    }

    try {
      const response = await createAnalysisMutation.mutateAsync({
        client_id: clientId,
        session_ids: data.sessionIds,
        ai_supervision_template_id: data.aiSupervisionTemplateId,
      });

      trackEvent(MixpanelEvent.ClientAnalysisCreate, {
        client_id: clientId,
        session_count: data.sessionIds.length,
      });
      toast({
        title: '분석 시작',
        description: 'AI 슈퍼비전을 진행하고 있어요.',
        duration: 3000,
      });

      setPollingVersion(response.version);
    } catch (error) {
      trackError(MixpanelError.ClientAnalysisCreateError, error, {
        client_id: clientId,
      });
      toast({
        title: '분석 실패',
        description: '분석을 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
        duration: 3000,
      });
      throw error;
    }
  };

  const handleSelectClient = (client: Client) => {
    setSearchParamsWithUtm({ clientId: client.id });
  };

  // 표시할 분석 버전: 처리 중 > 폴링 중 > 최신
  const currentAnalysis = React.useMemo(() => {
    const processing = analyses.find(
      (a) =>
        a.ai_supervision?.status === 'pending' ||
        a.ai_supervision?.status === 'in_progress'
    );
    if (processing) return processing;

    if (pollingVersion) {
      const polling = analyses.find((a) => a.version === pollingVersion);
      if (polling) return polling;
    }

    return analyses[0] ?? null;
  }, [analyses, pollingVersion]);
  const currentAnalysisData = currentAnalysis?.ai_supervision ?? null;

  const clientSidebar = !isMobileView ? (
    <ClientSidebar
      selectedClientId={clientId}
      onSelectClient={handleSelectClient}
      collapsed={isSidebarCollapsed}
      onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
    />
  ) : null;

  // 카드 내부 콘텐츠
  const cardContent = (() => {
    if (isLoadingAnalyses) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-grey-30 border-t-green-80" />
          <p className="text-m text-grey-60">분석 데이터를 불러오는 중...</p>
        </div>
      );
    }

    if (
      currentAnalysisData?.status === 'pending' ||
      currentAnalysisData?.status === 'in_progress' ||
      (pollingVersion && !currentAnalysisData)
    ) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center py-24">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-grey-30 border-t-green-80" />
          <p className="text-m text-grey-60">분석 중...</p>
        </div>
      );
    }

    if (currentAnalysisData?.status === 'failed') {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-24">
          <p className="text-m text-danger">
            {currentAnalysisData.error_message || '분석을 만들지 못했어요.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAnalysisModalOpen(true)}
            className="rounded-lg border border-green-80 bg-[#ECFAED] px-3.5 py-1.5 text-m font-medium text-green-80 transition-opacity lg:hover:opacity-80"
          >
            다시 시도하기
          </button>
        </div>
      );
    }

    if (
      currentAnalysisData?.status === 'succeeded' &&
      currentAnalysisData.content
    ) {
      return (
        <SupervisionReportView
          analysis={currentAnalysisData}
          templates={templates}
          onCreateAnalysis={() => setIsAnalysisModalOpen(true)}
          onSaveContent={handleSaveAnalysisContent}
        />
      );
    }

    return (
      <SupervisionEmptyView
        onCreateAnalysis={() => setIsAnalysisModalOpen(true)}
      />
    );
  })();

  return (
    <div className="flex h-full w-full">
      {clientSidebar}

      <div className="min-w-0 flex-1 overflow-y-auto bg-app-bg">
        {!selectedClient ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-5 px-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grey-20 text-grey-60">
              <SideSupervisionIcon size={32} />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-l font-emphasize text-grey-100">
                내담자를 선택해 주세요
              </p>
              <p className="whitespace-pre-line text-sm text-grey-60">
                {isMobileView
                  ? '내담자를 선택하면\nAI 슈퍼비전 보고서를 받을 수 있어요.'
                  : '좌측에서 내담자를 선택하면\nAI 슈퍼비전 보고서를 받을 수 있어요.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex min-h-full w-full max-w-[1200px] flex-col px-6 pb-12 pt-10 lg:px-12">
            {/* 헤더: 뒤로가기 + 내담자명 + 상담 기록 수 */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  aria-label="내담자 선택 해제"
                  onClick={() => setSearchParamsWithUtm({})}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D6D8E1] bg-[#FAFBFF] text-[#9C9EA6] transition-colors lg:hover:bg-grey-20"
                >
                  <ChevronLeft size={22} />
                </button>
                <h1 className="text-2xl font-emphasize text-grey-100">
                  {selectedClient.name}
                </h1>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#D6D8E1] bg-white px-3 py-2">
                <FileText size={20} className="text-[#BABCC7]" />
                <span className="text-m font-medium text-grey-100">
                  {selectedClient.session_count ?? 0}개의 상담 기록
                </span>
              </div>
            </div>

            {/* 탭 + 보고서 카드 */}
            <div className="mt-9 flex flex-1 flex-col">
              <SupervisionTabs />
              <div className="flex min-h-[600px] flex-1 flex-col rounded-2xl border border-[#D6D8E1] bg-white">
                {cardContent}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 기존 다회기 분석 모달 재사용 */}
      <CreateAnalysisModal
        open={isAnalysisModalOpen}
        onOpenChange={setIsAnalysisModalOpen}
        templates={templates}
        sessions={(allClientSessionItems ?? []).map((s) => s.session)}
        onCreateAnalysis={handleCreateAnalysis}
      />
    </div>
  );
}

export default AiSupervisionContainer;
