import React, { useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import type { Client } from '@/features/client/types';
import { useDevice } from '@/shared/hooks/useDevice';
import { SearchIcon, UserIcon, UserPlusIcon, XIcon } from '@/shared/icons';
import { MobileModalHeader } from '@/shared/ui';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Text } from '@/shared/ui/atoms/Text';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { useAuthStore } from '@/stores/authStore';
import { useModalStore } from '@/stores/modalStore';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient?: Client | null;
  onSelect: (client: Client | null) => void;
  variant?: 'default' | 'compact' | 'dropdown' | 'modal';
  // dropdown/modal 모드용 props
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  clients,
  selectedClient,
  onSelect,
  variant = 'default',
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  placement = 'bottom-left',
}) => {
  const openModal = useModalStore((s) => s.openModal);
  const userId = useAuthStore((s) => s.userId);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  // modal 모드: 선택 대기 중인 고객
  const [pendingClient, setPendingClient] = React.useState<Client | null>(null);
  const [createdClientId, setCreatedClientId] = React.useState<string | null>(
    null
  );

  // default 모드 portal용 refs와 state
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // dropdown/modal 모드일 때는 controlled, 아니면 internal state 사용
  const isOpen =
    variant === 'dropdown' || variant === 'modal'
      ? (controlledOpen ?? false)
      : internalOpen;
  const setIsOpen =
    variant === 'dropdown' || variant === 'modal'
      ? (controlledOnOpenChange ?? setInternalOpen)
      : setInternalOpen;

  // default 모드: 트리거 위치 계산
  useEffect(() => {
    if (variant === 'default' && isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [variant, isOpen]);

  // default 모드: 외부 클릭 시 닫기
  useEffect(() => {
    if (variant !== 'default' || !isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [variant, isOpen, setIsOpen]);

  const filteredClients = clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !client.counsel_done
  );

  // 최근 추가된 고객 (최근 3명, 상담 종결되지 않은 고객만)
  const recentClients = [...clients]
    .filter((client) => !client.counsel_done)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  const handleSelectClient = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
    setSearchQuery('');
  };

  React.useEffect(() => {
    if (!createdClientId) return;
    const createdClient = clients.find(
      (client) => client.id === createdClientId
    );
    if (!createdClient) return;
    onSelect(createdClient);
    setPendingClient(createdClient);
    setCreatedClientId(null);
  }, [clients, createdClientId, onSelect]);

  const handleClearSelection = () => {
    onSelect(null);
  };

  const selectCreatedClient = (clientId: string, clientName?: string) => {
    const createdClient = clients.find((client) => client.id === clientId);
    if (createdClient) {
      onSelect(createdClient);
      setPendingClient(createdClient);
      return;
    }

    const now = new Date().toISOString();
    const optimisticClient: Client = {
      id: clientId,
      counselor_id: userId || '',
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
    onSelect(optimisticClient);
    setPendingClient(optimisticClient);
    setCreatedClientId(clientId);
  };

  const openAddClientModal = () => {
    openModal('addClient', {
      onClientCreated: selectCreatedClient,
    });
  };

  const closeMobileDepthThenOpenAddClient = () => {
    let opened = false;
    const openOnce = () => {
      if (opened) return;
      opened = true;
      window.removeEventListener('popstate', handlePopState);
      openAddClientModal();
    };
    const handlePopState = () => {
      window.setTimeout(openOnce, 50);
    };

    window.addEventListener('popstate', handlePopState);
    setIsOpen(false);
    window.setTimeout(openOnce, 250);
  };

  const handleOpenAddClient = (e: React.MouseEvent) => {
    e.stopPropagation();
    const usesFullscreenDepth =
      isMobileView && isOpen && (variant === 'dropdown' || variant === 'modal');
    if (usesFullscreenDepth) {
      closeMobileDepthThenOpenAddClient();
      return;
    }
    setIsOpen(false);
    openAddClientModal();
  };

  const addClientBtn = (
    <button
      onClick={handleOpenAddClient}
      className="typo-sm mb-2 w-full rounded-md bg-surface py-2.5 text-fg-muted transition-colors lg:hover:bg-surface-contrast"
    >
      + 새로운 내담자 등록하기
    </button>
  );

  const mobileAddClientBtn = (
    <button
      type="button"
      onClick={handleOpenAddClient}
      className="flex w-full items-center gap-3 rounded-lg bg-surface-contrast px-3 py-3 text-left transition-colors lg:hover:bg-surface"
    >
      <span className="flex size-8 flex-shrink-0 items-center justify-center rounded-md bg-surface text-fg-muted">
        <UserPlusIcon size={18} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="typo-m font-medium text-fg">내담자 추가하기</span>
        <span className="typo-xs text-fg-muted">
          새 내담자를 등록한 뒤 선택할 수 있어요.
        </span>
      </span>
    </button>
  );

  // 고객 리스트 렌더링 (compact와 dropdown에서 공유)
  const renderClientList = () => (
    <div className="flex max-h-[280px] flex-col space-y-2">
      {/* 검색 */}
      <div className="relative flex-shrink-0">
        <SearchIcon
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-strong"
        />
        <input
          type="text"
          placeholder="내담자 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="typo-sm w-full rounded-lg border border-surface-strong bg-surface-contrast py-1.5 pl-8 pr-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 모든 고객 */}
      <div className="flex min-h-0 flex-1 flex-col space-y-1">
        {searchQuery === '' && (
          <Text className="typo-xs text-muted flex-shrink-0">내담자 목록</Text>
        )}
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectClient(client);
                }}
                className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors lg:hover:bg-surface-contrast"
              >
                <Text className="typo-sm">{client.name}</Text>
                <Text className="typo-xs group-lg:hover:text-primary font-medium text-surface transition-colors">
                  선택
                </Text>
              </button>
            ))
          ) : (
            <Text className="typo-sm py-2 text-center text-fg-muted">
              검색 결과가 없어요
            </Text>
          )}
        </div>
      </div>

      {/* 내담자 추가 */}
      {addClientBtn}
    </div>
  );

  // dropdown 모드: 모바일 fullScreen, 데스크톱 PopUp
  if (variant === 'dropdown') {
    if (isMobileView) {
      return (
        <>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setIsOpen(true);
            }}
          >
            {trigger}
          </div>
          <Modal
            open={isOpen}
            onOpenChange={setIsOpen}
            mobileVariant="fullScreen"
            hideCloseButton
            className="flex flex-col"
          >
            <MobileModalHeader title="내담자 선택" onBack={() => setIsOpen(false)} />
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {renderClientList()}
            </div>
          </Modal>
        </>
      );
    }
    return (
      <PopUp
        trigger={trigger}
        content={
          <div className="w-[280px] space-y-2 p-3">{renderClientList()}</div>
        }
        placement={placement}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    );
  }

  // modal 모드
  if (variant === 'modal') {
    const handlePendingSelect = (client: Client) => {
      setPendingClient(client);
    };

    const handleConfirmSelection = () => {
      if (pendingClient) {
        onSelect(pendingClient);
      }
      setIsOpen(false);
      setSearchQuery('');
      setPendingClient(null);
    };

    const handleCloseModal = () => {
      setIsOpen(false);
      setSearchQuery('');
      setPendingClient(null);
    };

    const handleTriggerClick = () => {
      // 모달 열 때 현재 선택된 고객을 pendingClient로 설정
      setPendingClient(selectedClient ?? null);
      setIsOpen(true);
    };

    return (
      <>
        {trigger && (
          <div
            onClick={handleTriggerClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleTriggerClick()}
          >
            {trigger}
          </div>
        )}
        <Modal
          open={isOpen}
          onOpenChange={handleCloseModal}
          mobileVariant="fullScreen"
          hideCloseButton
          className="flex flex-col"
        >
          <MobileModalHeader title="내담자 선택" onBack={handleCloseModal} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
            {/* 검색 */}
            <div className="relative flex-shrink-0">
              <SearchIcon
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
              />
              <input
                type="text"
                placeholder="내담자 검색하기"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="typo-m w-full border-b border-surface-strong bg-transparent py-3 pl-10 pr-3 focus:border-primary focus:outline-none"
              />
            </div>

            {/* 목록 */}
            <div className="flex-1 overflow-y-auto">
              {/* 내담자 추가 */}
              {searchQuery === '' && (
                <div className="mb-4">{mobileAddClientBtn}</div>
              )}

              {/* 최근 추가한 고객 */}
              {searchQuery === '' && recentClients.length > 0 && (
                <div className="mb-4">
                  <Text className="typo-m mb-2 text-fg-muted">
                    최근 추가한 내담자
                  </Text>
                  <div className="flex flex-wrap gap-2">
                    {recentClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handlePendingSelect(client)}
                      >
                        <Badge
                          tone="neutral"
                          variant="soft"
                          size="lg"
                          className={`px-4 py-2 ${
                            pendingClient?.id === client.id
                              ? ''
                              : 'bg-transparent'
                          }`}
                        >
                          {client.name}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 모든 고객 */}
              <div>
                {searchQuery === '' && (
                  <Text className="typo-m mb-2 text-fg-muted">모든 내담자</Text>
                )}
                <div className="space-y-1">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handlePendingSelect(client)}
                        className={`flex w-full items-center rounded-lg px-2 py-2.5 text-left transition-colors ${
                          pendingClient?.id === client.id
                            ? 'bg-primary-subtle'
                            : 'lg:hover:bg-surface-contrast'
                        }`}
                      >
                        <Text
                          className={`typo-l ${pendingClient?.id === client.id ? 'font-medium text-primary' : ''}`}
                        >
                          {client.name}
                        </Text>
                      </button>
                    ))
                  ) : (
                    <Text className="typo-sm py-4 text-center text-fg-muted">
                      검색 결과가 없어요
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {/* 선택 버튼 */}
            <div className="flex-shrink-0">
              <Button
                variant="solid"
                tone="primary"
                size="lg"
                className="w-full"
                onClick={handleConfirmSelection}
                disabled={!pendingClient}
              >
                선택
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // compact 모드
  if (variant === 'compact') {
    return <div className="space-y-2">{renderClientList()}</div>;
  }

  // default 모드 - portal을 사용하여 z-index 문제 해결
  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        transform: 'translateX(-50%)',
        zIndex: 1100,
      }}
      className="w-[384px] space-y-4 rounded-lg border border-surface-strong bg-surface p-4 shadow-elevated"
    >
      {/* 검색 */}
      <div className="relative flex-shrink-0">
        <SearchIcon
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-strong"
        />
        <input
          type="text"
          placeholder="내담자 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="typo-sm w-full rounded-lg border border-surface-strong bg-surface-contrast py-1.5 pl-8 pr-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 최근 추가된 고객 */}
      {searchQuery === '' && recentClients.length > 0 && (
        <div className="flex-shrink-0 space-y-1.5">
          <Text className="typo-xs text-muted">최근 추가된 내담자</Text>
          <div className="flex flex-shrink-0 flex-wrap gap-2">
            {recentClients.map((client) => (
              <button
                key={client.id}
                onClick={() => handleSelectClient(client)}
              >
                <Badge
                  tone="neutral"
                  variant="soft"
                  size="sm"
                  className="bg-primary-subtle lg:hover:bg-primary-subtle"
                >
                  {client.name}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 모든 고객 */}
      <div className="flex min-h-0 flex-1 flex-col space-y-1">
        {searchQuery === '' && (
          <Text className="typo-xs text-muted flex-shrink-0">모든 내담자</Text>
        )}
        <div className="max-h-[200px] min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <button
                key={client.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectClient(client);
                }}
                className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors lg:hover:bg-surface-contrast"
              >
                <Text className="typo-sm">{client.name}</Text>
                <Text className="typo-xs group-lg:hover:text-primary font-medium text-surface transition-colors">
                  선택
                </Text>
              </button>
            ))
          ) : (
            <Text className="typo-sm py-2 text-center text-fg-muted">
              검색 결과가 없어요
            </Text>
          )}
        </div>
      </div>

      {/* 내담자 추가 */}
      {addClientBtn}
    </div>
  );

  return (
    <div ref={triggerRef} className="space-y-2">
      {!selectedClient ? (
        <Button
          variant="outline"
          size="md"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-center gap-2"
        >
          <UserIcon size={16} />
          <Text className="typo-sm">내담자 선택 안함</Text>
        </Button>
      ) : (
        <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-primary px-3">
          <UserIcon size={16} className="text-primary" />
          <Text className="typo-sm flex-1 font-medium">
            {selectedClient.name}
          </Text>
          <button
            onClick={handleClearSelection}
            className="rounded p-1 lg:hover:bg-surface"
          >
            <XIcon size={16} className="text-muted" />
          </button>
        </div>
      )}

      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};
