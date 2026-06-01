import React from 'react';

import { useLocation, useSearchParams } from 'react-router-dom';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  GenogramIcon,
  MenuIcon,
  PlusIcon,
  SidePsychologyAssessmentIcon,
} from '@/shared/icons';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { useClientListScrollStore } from '@/stores/clientListScrollStore';
import { useModalStore } from '@/stores/modalStore';

import { getRouteLabel } from '../navigationConfig';

interface MobileHeaderProps {
  onMenuOpen: () => void;
  onNewSession: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onMenuOpen,
  onNewSession,
}) => {
  const location = useLocation();
  const isGenogram = location.pathname === '/genogram';
  const isPsychologyAssessments =
    location.pathname === '/psychology-assessments';

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
    <PsychologyClientButton />
  ) : null;

  const rightSlot = (() => {
    if (genogramRightSlot) return genogramRightSlot;
    if (psychologyRightSlot) return psychologyRightSlot;
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

/**
 * 심리검사 해석 MobileHeader 우측 내담자 선택 버튼.
 * 데스크탑의 좌측 ClientSidebar를 모바일에서 대체.
 */
function PsychologyClientButton() {
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
        className={`gap-2 bg-surface ${!clientId ? 'animate-pulse-glow-subtle' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <SidePsychologyAssessmentIcon size={18} />
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
