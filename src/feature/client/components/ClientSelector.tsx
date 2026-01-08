import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Badge } from '@/components/ui/atoms/Badge';
import { Button } from '@/components/ui/atoms/Button';
import { Text } from '@/components/ui/atoms/Text';
import { PopUp } from '@/components/ui/composites/PopUp';
import type { Client } from '@/feature/client/types';
import { SearchIcon, UserIcon, XIcon } from '@/shared/icons';

interface ClientSelectorProps {
  clients: Client[];
  selectedClient?: Client | null;
  onSelect: (client: Client | null) => void;
  variant?: 'default' | 'compact' | 'dropdown';
  // dropdown 모드용 props
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
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // default 모드 portal용 refs와 state
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // dropdown 모드일 때는 controlled, 아니면 internal state 사용
  const isOpen =
    variant === 'dropdown' ? (controlledOpen ?? false) : internalOpen;
  const setIsOpen =
    variant === 'dropdown'
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

  const handleClearSelection = () => {
    onSelect(null);
  };

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
          placeholder="고객 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-surface-strong bg-surface-contrast py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 모든 고객 */}
      <div className="flex min-h-0 flex-1 flex-col space-y-1">
        {searchQuery === '' && (
          <Text className="flex-shrink-0 text-xs text-muted">고객 목록</Text>
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
                className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-contrast"
              >
                <Text className="text-sm">{client.name}</Text>
                <Text className="text-xs font-medium text-surface transition-colors group-hover:text-primary">
                  선택
                </Text>
              </button>
            ))
          ) : (
            <Text className="py-2 text-center text-sm text-fg-muted">
              검색 결과가 없습니다
            </Text>
          )}
        </div>
      </div>
    </div>
  );

  // dropdown 모드
  if (variant === 'dropdown') {
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
        zIndex: 9999,
      }}
      className="w-[384px] space-y-4 rounded-lg border border-surface-strong bg-surface p-4 shadow-lg"
    >
      {/* 검색 */}
      <div className="relative flex-shrink-0">
        <SearchIcon
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-strong"
        />
        <input
          type="text"
          placeholder="고객 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-surface-strong bg-surface-contrast py-1.5 pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 최근 추가된 고객 */}
      {searchQuery === '' && recentClients.length > 0 && (
        <div className="flex-shrink-0 space-y-1.5">
          <Text className="text-xs text-muted">최근 추가된 고객</Text>
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
                  className="bg-primary-200 hover:bg-primary-300"
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
          <Text className="flex-shrink-0 text-xs text-muted">모든 고객</Text>
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
                className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-contrast"
              >
                <Text className="text-sm">{client.name}</Text>
                <Text className="text-xs font-medium text-surface transition-colors group-hover:text-primary">
                  선택
                </Text>
              </button>
            ))
          ) : (
            <Text className="py-2 text-center text-sm text-fg-muted">
              검색 결과가 없습니다
            </Text>
          )}
        </div>
      </div>
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
          <Text className="text-sm">고객 선택 안함</Text>
        </Button>
      ) : (
        <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-primary px-3">
          <UserIcon size={16} className="text-primary" />
          <Text className="flex-1 text-sm font-medium">
            {selectedClient.name}
          </Text>
          <button
            onClick={handleClearSelection}
            className="rounded p-1 hover:bg-surface"
          >
            <XIcon size={16} className="text-muted" />
          </button>
        </div>
      )}

      {isOpen && createPortal(dropdownContent, document.body)}
    </div>
  );
};
