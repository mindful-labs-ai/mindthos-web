import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { File } from 'lucide-react';
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
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { useAllClientSessions } from '@/features/session/hooks/useSessionsList';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { clientAnalysisService } from '@/shared/api/supabase/clientAnalysisQueries';
import { CREDIT_COST } from '@/shared/constants/credit';
import { dummyClientAnalysisVersions } from '@/shared/constants/dummyClientAnalysis';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { SideSupervisionIcon } from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { ClientAnalysisTab } from '@/widgets/client/ClientAnalysisTab';
import { ClientSidebar } from '@/widgets/client/ClientSidebar';
import { CreateAnalysisModal } from '@/widgets/client/CreateAnalysisModal';

/**
 * AI 슈퍼비전(다회기 분석) 메인 화면.
 * 내담자 상세의 다회기 분석 탭을 그대로 외부 페이지로 분리 —
 * 데이터·UI 모두 기존 ClientAnalysisTab/CreateAnalysisModal 재사용.
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

  // 온보딩 더미 플로우 (내담자 상세와 동일)
  const isDummyFlow = clientId === 'dummy_client_1';
  const isReadOnly = isDummyFlow;

  const selectedClient = isDummyFlow
    ? dummyClient
    : (clients.find((c) => c.id === clientId) ?? null);

  const { data: templates } = useClientTemplates();
  const { data: analyses = [], isLoading: isLoadingAnalyses } =
    useClientAnalyses(clientId || '');
  const createAnalysisMutation = useCreateClientAnalysis();

  const displayAnalyses = isDummyFlow ? dummyClientAnalysisVersions : analyses;

  // 분석 모달용 세션 목록 — 모달 열릴 때만 활성화 (내담자 상세와 동일)
  const { data: allClientSessionItems } = useAllClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId || '',
    enabled: isAnalysisModalOpen && !isDummyFlow && !!clientId && !!userId,
    sortOrder: 'desc',
  });

  useClientAnalysisStatus({
    clientId: clientId || '',
    version: pollingVersion || 0,
    enabled: !!clientId && !!pollingVersion,
    onComplete: () => {
      toast({
        title: '다회기 분석 완료',
        description: '다회기 분석을 마쳤어요.',
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
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 내담자에서 분석을 만들 수 있어요.',
        duration: 3000,
      });
      return;
    }
    if (!clientId) return;

    // 액션 직전에 fresh 잔액으로 가드
    const guard = await checkCredit(CREDIT_COST.CLIENT_ANALYSIS);
    if (!guard.ok && !guard.unavailable) {
      toast({
        title: '크레딧 부족',
        description: `다회기 분석에 ${CREDIT_COST.CLIENT_ANALYSIS} 크레딧이 필요해요. (보유: ${guard.remaining})`,
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
        description: '다회기 분석을 진행하고 있어요.',
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

  const handleOpenCreateAnalysis = () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 내담자에서 분석을 만들 수 있어요.',
        duration: 3000,
      });
      return;
    }
    setIsAnalysisModalOpen(true);
  };

  const handleSelectClient = (client: Client) => {
    setSearchParamsWithUtm({ clientId: client.id });
  };

  // 상담 기록 수 — 더미는 더미 세션, 실데이터는 내담자 목록의 집계 사용
  const sessionRecordCount = isDummyFlow
    ? dummySessionRelations.filter((s) => s.session.client_id === clientId)
        .length
    : (selectedClient?.session_count ?? 0);

  const clientSidebar = !isMobileView ? (
    <ClientSidebar
      selectedClientId={clientId}
      onSelectClient={handleSelectClient}
      collapsed={isSidebarCollapsed}
      onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
    />
  ) : null;

  // 다회기 분석 모달용 세션 목록 — useAllClientSessions (limit 없음)
  const analysisSessionList = isDummyFlow
    ? dummySessionRelations.map((s) => s.session)
    : (allClientSessionItems ?? []).map((s) => s.session);

  return (
    <div className="flex h-full w-full">
      {clientSidebar}

      <div className="min-w-0 flex-1 overflow-hidden">
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
                  ? '우측 상단에서 내담자를 선택하면\n다회기 분석을 받을 수 있어요.'
                  : '좌측에서 내담자를 선택하면\n다회기 분석을 받을 수 있어요.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-full w-full max-w-[1332px] flex-col">
            {/* 헤더: 내담자명 + 우측 상담 기록 수 박스 */}
            <div className="flex-shrink-0 px-4 pt-6 md:px-16 md:pt-[42px]">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <h1 className="truncate text-2xl font-headline text-grey-100">
                    {selectedClient.name}
                  </h1>
                  {isDummyFlow && (
                    <Badge tone="warning" variant="soft" size="sm">
                      예시
                    </Badge>
                  )}
                </div>
                <div className="flex h-10 flex-shrink-0 items-center gap-2 rounded-lg border border-[#D6D8E1] bg-white px-3">
                  <File size={24} className="text-[#BABCC7]" />
                  <span className="text-m font-medium text-grey-100">
                    {sessionRecordCount}개의 상담 기록
                  </span>
                </div>
              </div>
            </div>

            {/* 다회기 분석 (기존 탭 컴포넌트 그대로) */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 md:px-12 md:py-6">
              <ClientAnalysisTab
                analyses={displayAnalyses}
                isLoading={isLoadingAnalyses && !isDummyFlow}
                pollingVersion={pollingVersion}
                isReadOnly={isReadOnly}
                onSaveContent={handleSaveAnalysisContent}
                onCreateAnalysis={handleOpenCreateAnalysis}
                isMobileView={isMobileView}
              />
            </div>
          </div>
        )}
      </div>

      {/* 기존 다회기 분석 모달 재사용 */}
      <CreateAnalysisModal
        open={isAnalysisModalOpen}
        onOpenChange={setIsAnalysisModalOpen}
        templates={templates}
        sessions={analysisSessionList}
        onCreateAnalysis={handleCreateAnalysis}
      />
    </div>
  );
}

export default AiSupervisionContainer;
