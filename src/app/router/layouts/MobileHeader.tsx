import React from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import {
  RegisteredPopover,
  ResetConfirmModal,
  type RegisteredAssessmentEntry,
  type TranscriptEntry,
} from '@/features/psychology-assessments/components/RegisteredPopover';
import { PSYCHOLOGY_ASSESSMENT_RESET_EVENT } from '@/features/psychology-assessments/constants/events';
import {
  analysisKeys,
  isAnalysisComplete,
  useAnalysisStatus,
} from '@/features/psychology-assessments/hooks/useAnalysis';
import {
  useAssessmentBatch,
  useResetToOcrPhase,
} from '@/features/psychology-assessments/hooks/useAssessmentBatch';
import type { AssessmentProgress } from '@/features/psychology-assessments/upload/assessmentUploadGateway';
import { ASSESSMENT_KIND_LABEL } from '@/features/psychology-assessments/utils/assessmentDisplay';
import { useAllClientSessions } from '@/features/session/hooks/useSessionsList';
import type { AnalysisStatusResponse } from '@/shared/api/server/assessmentUploadApi';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  AnalysisStatusIcon,
  ClientIcon,
  GenogramIcon,
  MenuIcon,
  PlusIcon,
} from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useAuthStore } from '@/stores/authStore';
import { useClientListScrollStore } from '@/stores/clientListScrollStore';
import { useModalStore } from '@/stores/modalStore';
import { ProfileMenu } from '@/widgets/profile';

import { getRouteLabel } from '../navigationConfig';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onNewSession: () => void;
}

const ASSESSMENT_PROGRESS_LABEL: Record<AssessmentProgress, string> = {
  initiated: '업로드 대기',
  pending: '분석 대기',
  processing: '분석 중',
  completed: '완료',
  failed: '확인 필요',
};

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuOpen,
  onNewSession,
}) => {
  const location = useLocation();
  const isGenogram = location.pathname === '/genogram';
  const isPsychologyAssessments =
    location.pathname === '/psychology-assessments';
  const isAiSupervision = location.pathname === '/ai-supervision';

  const pageTitle = React.useMemo(() => {
    const pathname = location.pathname;
    if (pathname === '/') return '홈';
    const basePath = '/' + pathname.split('/').filter(Boolean)[0];
    return getRouteLabel(basePath);
  }, [location.pathname]);

  // 가계도 라우트: 내담자 드롭다운
  const genogramRightSlot = isGenogram ? <GenogramClientButton /> : null;
  // 심리검사 해석: 내담자 선택 트리거 (사이드바 대체)
  const psychologyRightSlot = isPsychologyAssessments ? (
    <PsychologyHeaderControls />
  ) : null;
  // AI 슈퍼비전: 내담자 선택 트리거 (데스크탑 ClientSidebar 대체)
  const aiSupervisionRightSlot = isAiSupervision ? (
    <HeaderClientSelectButton />
  ) : null;

  const rightSlot = (() => {
    // 홈: 프로필 메뉴(상담사 정보·크레딧·설정) 진입점
    if (location.pathname === '/') return <ProfileMenu surface="sheet" />;
    if (genogramRightSlot) return genogramRightSlot;
    if (psychologyRightSlot) return psychologyRightSlot;
    if (aiSupervisionRightSlot) return aiSupervisionRightSlot;
    if (location.pathname === '/clients') {
      return (
        <Button
          tone="primary"
          variant="solid"
          size="md"
          onClick={() =>
            useModalStore.getState().openModal('addClient', {
              onClientCreated: (clientId: string) => {
                useClientListScrollStore
                  .getState()
                  .requestScrollToClient(clientId);
              },
            })
          }
          className="truncate"
        >
          내담자 추가하기
        </Button>
      );
    }
    return (
      <Button
        tone="primary"
        variant="outline"
        size="md"
        icon={<PlusIcon size={16} />}
        onClick={onNewSession}
        className="truncate"
      >
        새 상담 기록
      </Button>
    );
  })();

  return (
    <header className="sticky top-0 z-header flex h-header items-center justify-between border-b border-header-border bg-header-bg px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="transition-default flex size-8 items-center justify-center rounded-md border border-border p-1.5 text-fg-muted"
          aria-label="메뉴 열기"
        >
          <MenuIcon size={24} />
        </button>
        <span className="text-m font-medium text-grey-100">{pageTitle}</span>
      </div>

      {rightSlot}
    </header>
  );
};

/** 가계도 MobileHeader 우측 내담자 선택 버튼 */
function GenogramClientButton() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { clients } = useClientList();
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const openModal = useModalStore((state) => state.openModal);

  const activeClients = React.useMemo(
    () => clients.filter((c) => !c.counsel_done),
    [clients]
  );
  const [createdClient, setCreatedClient] = React.useState<Client | null>(null);
  const selectedClient =
    activeClients.find((c) => c.id === clientId) ??
    (createdClient?.id === clientId ? createdClient : null);

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!createdClient) return;
    if (clients.some((client) => client.id === createdClient.id)) {
      setCreatedClient(null);
    }
  }, [clients, createdClient]);

  const handleOpenAddClient = () => {
    closeFullscreenDepthThenRun(setIsOpen, () => {
      openModal('addClient', {
        onClientCreated: (createdClientId: string, clientName?: string) => {
          setCreatedClient(buildCreatedClient(createdClientId, clientName));
          setSearchParamsWithUtm({ clientId: createdClientId });
        },
      });
    });
  };

  return (
    <>
      <Button
        variant="outline"
        className={`gap-2 bg-surface ${!clientId ? 'animate-pulse-glow-subtle' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <GenogramIcon size={18} />
        <span>{selectedClient?.name || '내담자 선택'}</span>
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        mobileVariant="fullScreen"
        hideCloseButton
        className="flex flex-col"
      >
        <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4">
          <BackButton onClick={() => setIsOpen(false)} />
          <p className="text-m font-medium text-grey-100">내담자 선택</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <MobileAddClientButton
            onClick={handleOpenAddClient}
            className="mb-4"
          />
          {activeClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-60">
              등록된 내담자가 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {activeClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    const id = client.id;
                    setIsOpen(false);
                    // fullScreen history.back() 완료 후 URL 변경
                    const onPop = () => {
                      window.removeEventListener('popstate', onPop);
                      setTimeout(
                        () => setSearchParamsWithUtm({ clientId: id }),
                        50
                      );
                    };
                    window.addEventListener('popstate', onPop);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-green-80 bg-green-10'
                      : 'border-grey-30 bg-white lg:hover:bg-grey-10'
                  }`}
                >
                  <span className="text-m font-medium text-grey-100">
                    {client.name}
                  </span>
                  {selectedClient?.id === client.id && (
                    <span className="text-sm font-medium text-green-80">
                      선택됨
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function PsychologyHeaderControls() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PsychologyAssessmentPopoverButton />
      <HeaderClientSelectButton />
    </div>
  );
}

/**
 * MobileHeader 우측 내담자 선택 버튼 (심리검사 해석·AI 슈퍼비전 공용).
 * 데스크탑의 좌측 ClientSidebar를 모바일에서 대체 — ?clientId= 쿼리로 동기화.
 */
function HeaderClientSelectButton() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const { clients } = useClientList();
  const { setSearchParamsWithUtm } = useNavigateWithUtm();
  const openModal = useModalStore((state) => state.openModal);

  const [createdClient, setCreatedClient] = React.useState<Client | null>(null);
  const selectedClient =
    clients.find((c) => c.id === clientId) ??
    (createdClient?.id === clientId ? createdClient : null);

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!createdClient) return;
    if (clients.some((client) => client.id === createdClient.id)) {
      setCreatedClient(null);
    }
  }, [clients, createdClient]);

  const handleOpenAddClient = () => {
    closeFullscreenDepthThenRun(setIsOpen, () => {
      openModal('addClient', {
        onClientCreated: (createdClientId: string, clientName?: string) => {
          setCreatedClient(buildCreatedClient(createdClientId, clientName));
          setSearchParamsWithUtm({ clientId: createdClientId });
        },
      });
    });
  };

  return (
    <>
      <Button
        variant="outline"
        className={`min-w-0 max-w-[46vw] gap-2 bg-surface ${!clientId ? 'animate-pulse-glow-subtle' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <ClientIcon size={18} />
        <span className="truncate">
          {selectedClient?.name || '내담자 선택'}
        </span>
      </Button>

      <Modal
        open={isOpen}
        onOpenChange={setIsOpen}
        mobileVariant="fullScreen"
        hideCloseButton
        className="flex flex-col"
      >
        <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4">
          <BackButton onClick={() => setIsOpen(false)} />
          <p className="text-m font-medium text-grey-100">내담자 선택</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <MobileAddClientButton
            onClick={handleOpenAddClient}
            className="mb-4"
          />
          {clients.length === 0 ? (
            <p className="py-8 text-center text-sm text-grey-60">
              등록된 내담자가 없어요
            </p>
          ) : (
            <div className="space-y-2">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    const id = client.id;
                    setIsOpen(false);
                    const onPop = () => {
                      window.removeEventListener('popstate', onPop);
                      setTimeout(
                        () => setSearchParamsWithUtm({ clientId: id }),
                        50
                      );
                    };
                    window.addEventListener('popstate', onPop);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-4 text-left transition-colors ${
                    selectedClient?.id === client.id
                      ? 'border-green-80 bg-green-10'
                      : 'border-grey-30 bg-white lg:hover:bg-grey-10'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-m font-medium text-grey-100">
                      {client.name}
                    </span>
                    <span className="text-xs text-grey-60">
                      총 {client.session_count ?? 0}개 상담기록
                    </span>
                  </div>
                  {selectedClient?.id === client.id && (
                    <span className="text-sm font-medium text-green-80">
                      선택됨
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function PsychologyAssessmentPopoverButton() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId') ?? undefined;
  const userId = useAuthStore((state) => state.userId);
  const { clients } = useClientList();
  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const queryClient = useQueryClient();

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);

  const { data: analysisStatusData } = useAnalysisStatus(clientId, {
    enabled: !!clientId,
  });
  const analysisComplete = analysisStatusData
    ? isAnalysisComplete(analysisStatusData)
    : false;

  const { data: assessments = [] } = useAssessmentBatch(clientId, {
    enabled: !!clientId && analysisComplete,
  });
  const resetToOcrPhaseMut = useResetToOcrPhase(clientId);

  const { data: clientSessionItems = [] } = useAllClientSessions({
    userId: userId ? Number(userId) : 0,
    clientId: clientId ?? '',
    enabled: !!clientId && !!userId && analysisComplete,
    sortOrder: 'asc',
  });

  const popoverAssessments: RegisteredAssessmentEntry[] = React.useMemo(
    () =>
      assessments.map((it) => ({
        id: it.assessmentId,
        fileName: it.title,
        testDate: '',
        pageCount: 0,
        categoryLabel: ASSESSMENT_KIND_LABEL[it.kind],
        metaLabel: `${ASSESSMENT_KIND_LABEL[it.kind]} · ${
          ASSESSMENT_PROGRESS_LABEL[it.progress]
        }`,
      })),
    [assessments]
  );

  const popoverTranscripts: TranscriptEntry[] = React.useMemo(() => {
    if (!selectedClient || !clientId) return [];

    const transcriptCount = clientSessionItems.filter(
      ({ transcribe }) => transcribe !== null
    ).length;
    if (transcriptCount === 0) return [];

    return [
      {
        id: `transcripts:${clientId}`,
        title: `${selectedClient.name} 축어록`,
        metaLabel: `총 ${transcriptCount}회기 상담 기록`,
      },
    ];
  }, [clientId, clientSessionItems, selectedClient]);

  const canOpenPopover = analysisComplete && popoverAssessments.length > 0;

  React.useEffect(() => {
    if (!canOpenPopover) setIsPopoverOpen(false);
  }, [canOpenPopover]);

  const handleResetConfirm = () => {
    setIsResetConfirmOpen(false);
    setIsPopoverOpen(false);
    if (!clientId) return;

    resetToOcrPhaseMut.mutate(undefined, {
      onSuccess: () => {
        queryClient.setQueryData<AnalysisStatusResponse>(
          analysisKeys.status(clientId),
          (old) => (old ? { ...old, chatActiveStatus: 'OCR_PHASE' } : old)
        );
        window.dispatchEvent(
          new CustomEvent(PSYCHOLOGY_ASSESSMENT_RESET_EVENT, {
            detail: { clientId },
          })
        );
        void queryClient.invalidateQueries({
          queryKey: analysisKeys.status(clientId),
        });
      },
      onError: () => {
        void queryClient.invalidateQueries({
          queryKey: analysisKeys.status(clientId),
        });
      },
    });
  };

  if (!clientId || !canOpenPopover) return null;

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="free"
        aria-label="등록된 결과지 보기"
        className={`size-10 shrink-0 rounded-md border border-border bg-surface p-0 text-grey-70 ${
          isPopoverOpen ? 'bg-grey-10' : ''
        }`}
        onClick={() => setIsPopoverOpen((prev) => !prev)}
      >
        <AnalysisStatusIcon size={22} />
      </Button>

      <RegisteredPopover
        open={isPopoverOpen}
        onClose={() => setIsPopoverOpen(false)}
        triggerRef={triggerRef as React.RefObject<HTMLElement>}
        transcripts={popoverTranscripts}
        assessments={popoverAssessments}
        onReset={() => setIsResetConfirmOpen(true)}
      />

      <ResetConfirmModal
        open={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetConfirm}
      />
    </>
  );
}

function MobileAddClientButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl bg-nav-hover-bg px-4 py-3 text-left transition-colors lg:hover:bg-grey-20 ${className ?? ''}`}
    >
      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-surface text-grey-70">
        <PlusIcon size={18} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-m font-medium text-grey-100">
          내담자 추가하기
        </span>
        <span className="text-xs text-grey-60">
          새 내담자를 등록한 뒤 바로 선택할 수 있어요.
        </span>
      </span>
    </button>
  );
}

function buildCreatedClient(clientId: string, clientName?: string): Client {
  const now = new Date().toISOString();
  return {
    id: clientId,
    counselor_id: '',
    name: clientName || '새 내담자',
    phone_number: '',
    email: null,
    counsel_theme: null,
    counsel_number: 0,
    counsel_done: false,
    memo: null,
    pin: false,
    created_at: now,
    updated_at: now,
    session_count: 0,
  };
}

function closeFullscreenDepthThenRun(
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  next: () => void
) {
  let ran = false;
  const runOnce = () => {
    if (ran) return;
    ran = true;
    window.removeEventListener('popstate', handlePopState);
    next();
  };
  const handlePopState = () => {
    window.setTimeout(runOnce, 50);
  };

  window.addEventListener('popstate', handlePopState);
  setIsOpen(false);
  window.setTimeout(runOnce, 250);
}
