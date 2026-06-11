import React from 'react';

import { useParams } from 'react-router-dom';

import {
  getClientDetailRoute,
  getSessionDetailRoute,
} from '@/app/router/constants';
import {
  dummyClient,
  dummySessionRelations,
} from '@/features/session/constants/dummySessions';
import { useClientSessions } from '@/features/session/hooks/useSessionsList';
import type {
  HandwrittenTranscribeListItem,
  SessionRecord,
  TranscribeListItem,
} from '@/features/session/types';
import { formatPreviewText } from '@/features/session/utils/formatPreview';
import { getNoteTypesFromProgressNotes } from '@/shared/constants/noteTypeMapping';
import { useDevice } from '@/shared/hooks/useDevice';
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { useToast } from '@/shared/ui/composites/Toast';
import { useAuthStore } from '@/stores/authStore';
import { AddClientModal } from '@/widgets/client/AddClientModal';
import { ClientSidebar } from '@/widgets/client/ClientSidebar';
import { SessionRecordCard } from '@/widgets/session/SessionRecordCard';

import { useClientList } from '../hooks/useClientList';
import type { Client } from '../types';

import { ClientDetailView } from './ClientDetailView';

export const ClientDetailContainer: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const { navigateWithUtm } = useNavigateWithUtm();
  const [sortOrder, setSortOrder] = React.useState<'newest' | 'oldest'>(
    'newest'
  );
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const userId = useAuthStore((state) => state.userId);
  const { toast } = useToast();

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

  const handleSelectClient = (selected: Client) => {
    navigateWithUtm(getClientDetailRoute(selected.id));
  };

  // 데스크탑 전용 내담자 사이드바 — 로딩/미발견 화면에서도 유지
  const clientSidebar = !isMobileView ? (
    <ClientSidebar
      selectedClientId={clientId ?? null}
      onSelectClient={handleSelectClient}
      collapsed={isSidebarCollapsed}
      onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
    />
  ) : null;

  if (isLoadingClients || isLoadingSessions) {
    return (
      <div className="flex h-full w-full">
        {clientSidebar}
        <div className="flex min-w-0 flex-1 items-center justify-center bg-surface-contrast">
          <p className="text-fg-muted">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-full w-full">
        {clientSidebar}
        <div className="flex min-w-0 flex-1 items-center justify-center bg-surface-contrast">
          <p className="text-fg-muted">내담자를 찾을 수 없어요.</p>
        </div>
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

  const editModalWidget = (
    <AddClientModal
      open={isEditModalOpen}
      onOpenChange={handleEditModalOpen}
      initialData={client}
    />
  );

  return (
    <ClientDetailView
      client={client}
      sidebar={clientSidebar}
      isDummyFlow={isDummyFlow}
      sessionRecordCount={sessionRecords.length}
      onEditClientClick={handleEditClientClick}
      sessionList={sessionList}
      sortOrder={sortOrder}
      onSortChange={setSortOrder}
      editModal={editModalWidget}
      isMobileView={isMobileView}
    />
  );
};

export default ClientDetailContainer;
