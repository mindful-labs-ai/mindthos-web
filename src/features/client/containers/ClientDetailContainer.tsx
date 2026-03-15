import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'react-router-dom';

import { getSessionDetailRoute } from '@/app/router/constants';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { getNoteTypesFromProgressNotes } from '@/features/session/constants/noteTypeMapping';
import { useSessionList } from '@/features/session/hooks/useSessionList';
import type { SessionRecord, Transcribe } from '@/features/session/types';
import { getSpeakerDisplayName } from '@/features/session/utils/speakerUtils';
import { getTranscriptData } from '@/features/session/utils/transcriptParser';
import { useCreditInfo } from '@/features/settings/hooks/useCreditInfo';
import { trackError, trackEvent } from '@/lib/mixpanel';
import { clientAnalysisService } from '@/shared/api/supabase/clientAnalysisQueries';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';

import { dummyClientAnalysisVersions } from '../constants/dummyClientAnalysis';
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
  const [searchParams] = useSearchParams();
  const { navigateWithUtm } = useNavigateWithUtm();
  const initialTab = (searchParams.get('tab') as TabType) || 'history';
  const [activeTab, setActiveTab] = React.useState<TabType>(initialTab);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = React.useState(false);
  const [pollingVersion, setPollingVersion] = React.useState<number | null>(
    null
  );
  const [hasShownDummyToast, setHasShownDummyToast] = React.useState(false);
  const userId = useAuthStore((state) => state.userId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { creditInfo } = useCreditInfo();
  const CLIENT_ANALYSIS_CREDIT = 50;

  const { clients, isLoading: isLoadingClients } = useClientList();

  const { data: sessionsData, isLoading: isLoadingSessions } = useSessionList({
    userId: userId ? Number(userId) : 0,
    enabled: !!userId,
  });

  const isDummyClientId = clientId === 'dummy_client_1';
  const isDummyFlow =
    isDummyClientId ||
    (!isLoadingClients &&
      !isLoadingSessions &&
      !clients.length &&
      sessionsData?.sessions.length === 0);
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
        description: '다회기 분석이 완료되었습니다.',
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

  React.useEffect(() => {
    if (isReadOnly && clientId && !hasShownDummyToast) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 기능이 비활성화됩니다.',
        duration: 3000,
      });
      setHasShownDummyToast(true);
    }
  }, [isReadOnly, clientId, hasShownDummyToast, toast]);

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
    if (!sessionsData?.sessions) return [];
    return sessionsData.sessions.filter(
      (s) => s.session.client_id === clientId
    );
  }, [clientId, isDummyFlow, sessionsData]);

  const sessionRecords: SessionRecord[] = React.useMemo(() => {
    if (!client) return [];

    return clientSessions.map(({ session, transcribe, progressNotes }) => {
      const isHandwritten = session.audio_meta_data === null;

      let content = '전사 내용이 없습니다.';

      if (isHandwritten) {
        if (transcribe && typeof transcribe.contents === 'string') {
          content =
            transcribe.contents.slice(0, 150) +
            (transcribe.contents.length > 150 ? '...' : '');
        }
      } else {
        const transcriptData = getTranscriptData(
          transcribe as Transcribe | null
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
        content,
        note_types,
        created_at: session.created_at,
        processing_status: session.processing_status,
        is_handwritten: isHandwritten,
        stt_model:
          !isHandwritten && transcribe && 'stt_model' in transcribe
            ? (transcribe as Transcribe).stt_model
            : null,
      };
    });
  }, [clientSessions, client]);

  const handleCreateAnalysis = async (data: {
    sessionIds: string[];
    aiSupervisionTemplateId: number;
  }) => {
    if (isReadOnly) {
      toast({
        title: '읽기 전용',
        description: '예시에서는 분석을 작성할 수 없습니다.',
        duration: 3000,
      });
      return;
    }
    if (!clientId) return;

    const remainingCredit = creditInfo?.plan.remaining ?? 0;
    if (remainingCredit < CLIENT_ANALYSIS_CREDIT) {
      toast({
        title: '크레딧 부족',
        description: `다회기 분석에 ${CLIENT_ANALYSIS_CREDIT} 크레딧이 필요합니다. (보유: ${remainingCredit})`,
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

      trackEvent('client_analysis_create', {
        client_id: clientId,
        session_count: data.sessionIds.length,
      });
      toast({
        title: '분석 시작',
        description: '다회기 분석을 진행하고 있습니다.',
        duration: 3000,
      });

      setPollingVersion(response.version);
      setActiveTab('analyze');
    } catch (error) {
      trackError('client_analysis_create_error', error, {
        client_id: clientId,
      });

      toast({
        title: '분석 실패',
        description: '분석 작성에 실패했습니다. 다시 시도해주세요.',
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
        description: '예시에서는 클라이언트를 수정할 수 없습니다.',
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
        description: '예시에서는 분석을 작성할 수 없습니다.',
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
        description: '예시에서는 클라이언트를 수정할 수 없습니다.',
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
        <p className="text-fg-muted">클라이언트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <ClientDetailView
      client={client}
      isDummyFlow={isDummyFlow}
      isReadOnly={isReadOnly}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      sessionRecords={sessionRecords}
      displayAnalyses={displayAnalyses}
      isLoadingAnalyses={isLoadingAnalyses && !isDummyFlow}
      pollingVersion={pollingVersion}
      templates={templates}
      sessions={clientSessions.map((s) => s.session)}
      isEditModalOpen={isEditModalOpen}
      isAnalysisModalOpen={isAnalysisModalOpen}
      onEditModalOpen={handleEditModalOpen}
      onSetAnalysisModalOpen={setIsAnalysisModalOpen}
      onSessionClick={handleSessionClick}
      onEditClientClick={handleEditClientClick}
      onCreateAnalysis={handleCreateAnalysis}
      onOpenCreateAnalysis={handleOpenCreateAnalysis}
      onSaveAnalysisContent={handleSaveAnalysisContent}
    />
  );
};

export default ClientDetailContainer;
