import React from 'react';

import type { Client } from '@/feature/client/types';

interface ClientFilterMenuProps {
  selectedClientIds: string[];
  clients: Client[];
  sessionCounts: Record<string, number>;
  onClientChange: (clientIds: string[]) => void;
  onBack: () => void;
  showBackButton?: boolean; // 뒤로가기 버튼 표시 여부
}

export const ClientFilterMenu: React.FC<ClientFilterMenuProps> = ({
  selectedClientIds,
  clients,
  sessionCounts,
  onClientChange,
  onBack,
  showBackButton = true,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const safeClients = clients || [];
  const filteredClients = !searchQuery.trim()
    ? safeClients
    : safeClients.filter((client) => {
        const query = searchQuery.toLowerCase();
        return (
          client.name.toLowerCase().includes(query) ||
          client.phone_number.includes(query)
        );
      });

  // 체크박스 토글 핸들러
  const handleToggleClient = (clientId: string) => {
    if (selectedClientIds.includes(clientId)) {
      onClientChange(selectedClientIds.filter((id) => id !== clientId));
    } else {
      onClientChange([...selectedClientIds, clientId]);
    }
  };

  // 선택 초기화
  const handleClearSelection = () => {
    onClientChange([]);
  };

  return (
    <div className="w-64 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {showBackButton && (
          <button
            type="button"
            onClick={onBack}
            className="rounded p-1 hover:bg-surface"
            aria-label="뒤로가기"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        <h3 className="text-sm font-semibold text-fg">고객 선택</h3>
      </div>

      {/* 검색 입력 */}
      <div>
        <input
          type="text"
          placeholder="이름 또는 전화번호 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="focus:ring-primary/20 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder-fg-muted focus:border-primary focus:outline-none focus:ring-2"
        />
      </div>

      {/* 선택 초기화 버튼 */}
      {
        <button
          type="button"
          onClick={handleClearSelection}
          className="hover:bg-surface-hover w-full rounded-lg bg-surface px-4 py-2 text-sm font-medium text-fg"
        >
          선택 초기화 ({selectedClientIds.length}명 선택됨)
        </button>
      }

      {/* 고객 목록 */}
      <div className="max-h-80 space-y-1 overflow-y-auto">
        {/* 고객 목록 */}
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const isSelected = selectedClientIds.includes(client.id);
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => handleToggleClient(client.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary-100 hover:bg-primary-200'
                    : 'hover:bg-surface-contrast'
                }`}
              >
                <span
                  className={`flex-1 text-sm text-fg ${
                    isSelected ? 'font-medium' : ''
                  }`}
                >
                  {client.name}
                </span>
                <span
                  className={`text-xs text-fg-muted ${
                    isSelected ? 'font-medium' : ''
                  }`}
                >
                  {sessionCounts?.[client.id] || 0}
                </span>
              </button>
            );
          })
        ) : (
          <p className="py-4 text-center text-sm text-fg-muted">
            검색 결과가 없습니다
          </p>
        )}
      </div>
    </div>
  );
};
