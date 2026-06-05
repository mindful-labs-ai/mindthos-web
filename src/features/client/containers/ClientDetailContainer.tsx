import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

import { getSessionDetailRoute } from '@/app/router/constants';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import {
  useAllClientSessions,
  useClientSessions,
} from '@/features/session/hooks/useSessionsList';
import type {
  HandwrittenTranscribeListItem,
  SessionRecord,
  TranscribeListItem,
} from '@/features/session/types';
import { formatPreviewText } from '@/features/session/utils/formatPreview';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { clientAnalysisService } from '@/shared/api/supabase/clientAnalysisQueries';
import { CREDIT_COST } from '@/shared/constants/credit';
import { dummyClientAnalysisVersions } from '@/shared/constants/dummyClientAnalysis';
import {
  MixpanelError,
  MixpanelEvent,
} from '@/shared/constants/mixpanelEvents';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';
import { useCreditGuard } from '@/shared/hooks/useCreditGuard';
import { useDevice } from '@/shared/hooks/useDevice';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientAnalysisTab } from '@/widgets/client/ClientAnalysisTab';
import { CreateAnalysisModal } from '@/widgets/client/CreateAnalysisModal';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';

import {
  clientAnalysisQueryKeys,
  useClientAnalyses,
  useClientAnalysisStatus,
  useClientTemplates,
  useCreateClientAnalysis,
} from '../hooks/useClientAnalysis';
import { useClientList } from '../hooks/useClientList';

import { ClientDetailView } from './ClientDetailView';

type TabType = 'history' | 'analyze';

export const ClientDetailContainer: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [searchParams] = useSearchParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const initialTab = (searchParams.get('tab') as TabType) || 'history';
  const [activeTab, setActiveTab] = React.useState<TabType>(initialTab);
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>(
    'newest'
  );
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = React.useState(false);
  const [pollingVersion, setPollingVersion] = React.useState<number | null>(
    null
  );
  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const checkCredit = useCreditGuard();
  const CLIENT_ANALYSIS_CREDIT = CREDIT_COST.CLIENT_ANALYSIS;

  const { clients, isLoading: isLoadingClients } = useClientList();

  const isDummyClientId = clientId === 'dummy_client_1';

  const {
    items: clientSessionItems,
    isLoading: isLoadingSessions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId || '',
    enabled: !!userId && !!clientId && !isDummyClientId,
    sortOrder: sortOrder === 'newest' ? 'desc' : 'asc',
  });

  // 다회기 분석용 — 모달 열릴 때만 활성화
  const { data: allClientSessionItems } = useAllClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId || '',
    enabled: isAnalysisModalOpen && !isDummyClientId && !!clientId && !!userId,
    sortOrder: 'desc',
  });

  const sentinelRef = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  });

  const isDummyFlow =
    isDummyClientId ||
    (!isLoadingClients &&
      !isLoadingSessions &&
      !clients.length &&
      clientSessionItems.length === 0);
  const isReadOnly = isDummyFlow;

  const { data: templates } = useClientTemplates();
  const { data: analyses = [], isLoading: isLoadingAnalyses } =
    useClientAnalyses(clientId || '');
  const createAnalysisMutation = useCreateClientAnalysis();

  const displayAnalyses = isDummyFlow ? dummyClientAnalysisVersions : analyses;

  const handleSaveAnalysisContent = React.useCallback(
    async (analysisId: string, content: string) => {
      await clientAnalysisService.updateAnalysisContent(analysisId, content);
      queryClient.invalidateQueries({
        queryKey: clientAnalysisQueryKeys.analysesByClient(clientId || ''),
      });
    },
    [clientId, queryClient]
  );

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

  const client = React.useMemo(() => {
    if (!clientId) return null;
    if (isDummyFlow) return dummyClient;
    return clients.find((c) => c.id === clientId) || null;
  }, [clients, clientId, isDummyFlow]);

  const clientSessions = React.useMemo(() => {
    if (!clientId) return [];
    if (isDummyFlow) {
      return dummySessionRelations.filter(
        (s) => s.session.client_id === clientId
      );
    }
    return clientSessionItems;
  }, [clientId, isDummyFlow, clientSessionItems]);

  const getCardPreview = (
    transcribe: TranscribeListItem | HandwrittenTranscribeListItem | null,
    isHandwritten: boolean
  ): string => {
    if (!transcribe) {
      return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록이 없어요.';
    }
    const cleaned = formatPreviewText(transcribe.preview);
    if (cleaned) return cleaned;
    return isHandwritten ? '입력된 텍스트가 없어요.' : '축어록 보기';
  };

  const sessionRecords: SessionRecord[] = React.useMemo(() => {
    if (!client) return [];

    return clientSessions.map(({ session, transcribe, progressNotes }) => {
      const isHandwritten = session.audio_meta_data === null;
      const transcribeForPreview =
        transcribe && 'preview' in transcribe
          ? (transcribe as TranscribeListItem | HandwrittenTranscribeListItem)
          : null;

      const note_types = getNoteTypesFromProgressNotes(progressNotes);

      const sortedSessions = [...clientSessions].sort(
        (a, b) =>
          new Date(a.session.created_at).getTime() -
          new Date(b.session.created_at).getTime()
      );
      const session_number =
        sortedSessions.findIndex((s) => s.session.id === session.id) + 1;

      return {
        session_id: session.id,
        title: session?.title || undefined,
        transcribe_id: transcribe?.id || null,
        client_id: session.client_id || '',
        client_name: client.name,
        session_number,
        content: getCardPreview(transcribeForPreview, isHandwritten),
        note_types,
        created_at: session.created_at,
        processing_status: session.processing_status,
        is_handwritten: isHandwritten,
        stt_model:
          !isHandwritten && transcribe && 'stt_model' in transcribe
            ? transcribe.stt_model
            : null,
      };
    });
  }, [clientSessions, client]);

  // 정렬은 서버 측 (sortOrder → useClientSessions), 클라이언트 측 재정렬 불필요
  const sortedSessionRecords = sessionRecords;

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

    // 액션 직전에 fresh 잔액으로 가드 (이전 폴링 제거 — useCreditGuard가 invalidate+fetch)
    const guard = await checkCredit(CLIENT_ANALYSIS_CREDIT);
    if (!guard.ok && !guard.unavailable) {
      toast({
        title: '크레딧 부족',
        description: `다회기 분석에 ${CLIENT_ANALYSIS_CREDIT} 크레딧이 필요해요. (보유: ${guard.remaining})`,
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
      setActiveTab('analyze');
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

  const handleSessionClick = (record: SessionRecord) => {
    navigateWithUtm(getSessionDetailRoute(record.session_id));
  };

  const handleEditModalOpen = (open: boolean) => {
    if (isReadOnly && open) {
      toast({
        title: '읽기 전용',
        description: '실제 내담자에서 정보를 수정할 수 있어요.',
        duration: 3000,
      });
      return;
    }
    setIsEditModalOpen(open);
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

  const handleEditClientClick = () => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '실제 내담자에서 정보를 수정할 수 있어요.',
        duration: 3000,
      });
      return;
    }
    setIsEditModalOpen(true);
  };

  if (isLoadingClients || isLoadingSessions) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">로딩 중...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-contrast">
        <p className="text-fg-muted">내담자를 찾을 수 없어요.</p>
      </div>
    );
  }

  const sessionList =
    sortedSessionRecords.length > 0 ? (
      <div className="space-y-3">
        {sortedSessionRecords.map((record) => (
          <SessionRecordCard
            key={record.session_id}
            record={record}
            isReadOnly={isReadOnly}
            onClick={handleSessionClick}
          />
        ))}
        <div ref={sentinelRef} />
      </div>
    ) : (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-grey-30 bg-white">
        <p className="text-grey-60">상담 기록이 없어요.</p>
      </div>
    );

  const clientAnalysisTab = (
    <ClientAnalysisTab
      analyses={displayAnalyses}
      isLoading={isLoadingAnalyses && !isDummyFlow}
      pollingVersion={pollingVersion}
      isReadOnly={isReadOnly}
      onSaveContent={handleSaveAnalysisContent}
      onCreateAnalysis={handleOpenCreateAnalysis}
      isMobileView={isMobileView}
    />
  );

  const editModalWidget = (
    <AddClientModal
      open={isEditModalOpen}
      onOpenChange={handleEditModalOpen}
      initialData={client}
    />
  );

  // 다회기 분석 모달용 세션 목록 — useAllClientSessions (limit 없음)
  const analysisSessionList = isDummyFlow
    ? dummySessionRelations.map((s) => s.session)
    : (allClientSessionItems ?? clientSessions).map((s) => s.session);

  const analysisModalWidget = (
    <CreateAnalysisModal
      open={isAnalysisModalOpen}
      onOpenChange={setIsAnalysisModalOpen}
      templates={templates}
      sessions={analysisSessionList}
      onCreateAnalysis={handleCreateAnalysis}
    />
  );

  return (
    <ClientDetailView
      client={client}
      isDummyFlow={isDummyFlow}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sessionRecordCount={sessionRecords.length}
      onEditClientClick={handleEditClientClick}
      sessionList={sessionList}
      clientAnalysisTab={clientAnalysisTab}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      editModal={editModalWidget}
      analysisModal={analysisModalWidget}
      isMobileView={isMobileView}
    />
  );
};

export default ClientDetailContainer;
