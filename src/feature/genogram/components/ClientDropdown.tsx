import { useEffect, useMemo, useRef, useState } from 'react';

// ICON 변경: Search는 Lucide 직접 사용 중
import { Plus, Search } from 'lucide-react';

import { Button } from '@/components/ui/atoms/Button';
import type { Client } from '@/feature/client/types';
import { GenogramIcon } from '@/shared/icons';

interface ClientDropdownProps {
  clients: Client[];
  selectedClient: Client | null;
  onSelect: (client: Client) => void;
  /** 클라이언트 추가 버튼 클릭 핸들러 */
  onAddClient?: () => void;
  /** 클라이언트 없이 캔버스만 사용 중인 모드 */
  isTemporaryMode?: boolean;
}

export function ClientDropdown({
  clients,
  selectedClient,
  onSelect,
  onAddClient,
  isTemporaryMode = false,
}: ClientDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 열릴 때 검색 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 활성 클라이언트만 필터링 (counsel_done이 아닌)
  const activeClients = useMemo(
    () => clients.filter((client) => !client.counsel_done),
    [clients]
  );

  // 최근 추가한 고객 (최근 4명)
  const recentClients = useMemo(() => {
    return [...activeClients]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      )
      .slice(0, 4);
  }, [activeClients]);

  // 검색 결과 필터링
  const filteredClients = useMemo(() => {
    if (!searchQuery) return activeClients;
    return activeClients.filter((client) =>
      client.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeClients, searchQuery]);

  const handleSelect = (client: Client) => {
    onSelect(client);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 클라이언트가 없고 임시 모드일 때: 클라이언트 추가 버튼
  if (isTemporaryMode && activeClients.length === 0) {
    return (
      <Button
        variant="outline"
        className="gap-2 bg-white shadow-sm"
        onClick={onAddClient}
      >
        <Plus className="h-[18px] w-[18px]" />
        <span>클라이언트 추가</span>
      </Button>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger 버튼 */}
      <Button
        variant="outline"
        className="gap-2 bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <GenogramIcon size={18} />
        <span>{selectedClient?.name || '선택 안됨'}</span>
      </Button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-[280px] rounded-2xl border border-border bg-white p-4 shadow-lg">
          {/* 검색 입력 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-muted" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="클라이언트 검색"
              className="w-full border-b border-border bg-transparent py-2.5 pl-10 pr-3 text-base placeholder:text-fg-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* 최근 추가한 고객 */}
          {!searchQuery && recentClients.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm text-fg-muted">최근 추가한 고객</p>
              <div className="flex flex-wrap gap-2">
                {recentClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    className={`rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${
                      selectedClient?.id === client.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'hover:bg-primary/5 border-border bg-surface-strong text-fg hover:border-primary'
                    }`}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 모든 고객 */}
          <div>
            <p className="mb-2 text-sm text-fg-muted">모든 고객</p>
            <div className="max-h-[240px] space-y-1 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <p className="py-4 text-center text-sm text-fg-muted">
                  검색 결과가 없습니다
                </p>
              ) : (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(client)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface ${
                      selectedClient?.id === client.id
                        ? 'bg-primary-50 font-semibold text-fg'
                        : 'text-fg'
                    }`}
                  >
                    <span className="text-base">{client.name}</span>
                    {selectedClient?.id === client.id && (
                      <span className="text-sm font-medium text-primary">
                        선택됨
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
