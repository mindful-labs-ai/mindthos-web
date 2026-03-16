import React from 'react';

import { Outlet } from 'react-router-dom';

import type { Client } from '@/features/client/types';
import { useDevice } from '@/shared/hooks/useDevice';
import { ChevronDownIcon, SortDescIcon, UserIcon } from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Title } from '@/shared/ui/atoms/Title';
import { Modal } from '@/shared/ui/composites/Modal';
import { PopUp } from '@/shared/ui/composites/PopUp';
import { FilterMenu } from '@/widgets/session/FilterMenu';

export interface SessionHistoryViewProps {
  sessionId?: string;
  isDummyFlow: boolean;
  effectiveClients: Client[];
  sortOrder: 'newest' | 'oldest';
  selectedClientIds: string[];
  sessionCounts: Record<string, number>;
  onSortChange: (order: 'newest' | 'oldest') => void;
  onClientChange: (clientIds: string[]) => void;
  onFilterReset: () => void;
  sideList: React.ReactNode;
  sessionCards: React.ReactNode;
  sessionChangeModal: React.ReactNode;
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  sessionId,
  isDummyFlow,
  effectiveClients,
  sortOrder,
  selectedClientIds,
  sessionCounts,
  onSortChange,
  onClientChange,
  onFilterReset,
  sideList,
  sessionCards,
  sessionChangeModal,
}) => {
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const [isClientFilterOpen, setIsClientFilterOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  return (
    <div className="flex h-full">
      {/* 왼쪽: 세션 목록 - 모바일에서는 숨김 (상세 페이지 전체 너비 사용) */}
      {!isMobileView && sideList}

      {/* 메인 컨텐츠 영역 */}
      {!sessionId ? (
        <div className="mx-auto flex w-full max-w-[1332px] flex-1 flex-col px-4 pt-6 transition-all duration-300 lg:px-16 lg:pt-[42px]">
          <div className="flex-shrink-0 pb-6">
            <div className="flex items-center gap-2">
              <Title as="h1" className="text-start text-2xl font-bold">
                상담 기록
              </Title>
              {isDummyFlow && (
                <Badge tone="warning" variant="soft" size="sm">
                  예시
                </Badge>
              )}
            </div>

            <div className="mt-6 flex justify-start gap-3">
              {/* 클라이언트 필터: 모바일 fullScreen, 데스크톱 PopUp */}
              <div>
                {isMobileView ? (
                  <>
                    <Button
                      variant="solid"
                      tone="surface"
                      size="sm"
                      icon={<UserIcon size={16} />}
                      iconRight={<ChevronDownIcon size={16} />}
                      onClick={() => setIsClientFilterOpen(true)}
                    >
                      {selectedClientIds.length === 0
                        ? '모든 클라이언트'
                        : selectedClientIds.length === 1
                          ? effectiveClients.find(
                              (c) => c.id === selectedClientIds[0]
                            )?.name || '모든 클라이언트'
                          : `${selectedClientIds.length}명 선택`}
                    </Button>
                    <Modal
                      open={isClientFilterOpen}
                      onOpenChange={setIsClientFilterOpen}
                      mobileVariant="fullScreen"
                    >
                      <FilterMenu
                        sortOrder={sortOrder}
                        selectedClientIds={selectedClientIds}
                        clients={effectiveClients}
                        sessionCounts={sessionCounts}
                        onSortChange={onSortChange}
                        onClientChange={onClientChange}
                        onReset={onFilterReset}
                        initialView="client"
                      />
                    </Modal>
                  </>
                ) : (
                  <PopUp
                    trigger={
                      <Button
                        variant="solid"
                        tone="surface"
                        size="sm"
                        icon={<UserIcon size={16} />}
                        iconRight={<ChevronDownIcon size={16} />}
                      >
                        {selectedClientIds.length === 0
                          ? '모든 클라이언트'
                          : selectedClientIds.length === 1
                            ? effectiveClients.find(
                                (c) => c.id === selectedClientIds[0]
                              )?.name || '모든 클라이언트'
                            : `${selectedClientIds.length}명 선택`}
                      </Button>
                    }
                    content={
                      <FilterMenu
                        sortOrder={sortOrder}
                        selectedClientIds={selectedClientIds}
                        clients={effectiveClients}
                        sessionCounts={sessionCounts}
                        onSortChange={onSortChange}
                        onClientChange={onClientChange}
                        onReset={onFilterReset}
                        initialView="client"
                      />
                    }
                    placement="bottom"
                    className="!p-4"
                  />
                )}
              </div>

              {/* 정렬: 모바일 bottomSheet, 데스크톱 PopUp */}
              <div>
                {isMobileView ? (
                  <>
                    <Button
                      variant="solid"
                      tone="surface"
                      size="sm"
                      icon={<SortDescIcon size={16} />}
                      iconRight={<ChevronDownIcon size={16} />}
                      onClick={() => setIsSortOpen(true)}
                    >
                      {sortOrder === 'newest'
                        ? '최신 날짜 순'
                        : '오래된 날짜 순'}
                    </Button>
                    <Modal
                      open={isSortOpen}
                      onOpenChange={setIsSortOpen}
                      mobileVariant="bottomSheet"
                    >
                      <FilterMenu
                        sortOrder={sortOrder}
                        selectedClientIds={selectedClientIds}
                        clients={effectiveClients}
                        sessionCounts={sessionCounts}
                        onSortChange={onSortChange}
                        onClientChange={onClientChange}
                        onReset={onFilterReset}
                        initialView="sort"
                      />
                    </Modal>
                  </>
                ) : (
                  <PopUp
                    trigger={
                      <Button
                        variant="solid"
                        tone="surface"
                        size="sm"
                        icon={<SortDescIcon size={16} />}
                        iconRight={<ChevronDownIcon size={16} />}
                      >
                        {sortOrder === 'newest'
                          ? '최신 날짜 순'
                          : '오래된 날짜 순'}
                      </Button>
                    }
                    content={
                      <FilterMenu
                        sortOrder={sortOrder}
                        selectedClientIds={selectedClientIds}
                        clients={effectiveClients}
                        sessionCounts={sessionCounts}
                        onSortChange={onSortChange}
                        onClientChange={onClientChange}
                        onReset={onFilterReset}
                        initialView="sort"
                      />
                    }
                    placement="bottom"
                    className="!p-4"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-3">{sessionCards}</div>
          </div>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      )}

      {sessionChangeModal}
    </div>
  );
};
