import React from 'react';

import { Outlet } from 'react-router-dom';

import type { Client } from '@/features/client/types';
import { ChevronDownIcon, SortDescIcon, UserIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui';
import { Button } from '@/shared/ui/atoms/Button';
import { Modal } from '@/shared/ui/composites/Modal';
import { FilterMenu } from '@/widgets/session/FilterMenu';

export interface MobileSessionHistoryViewProps {
  sessionId?: string;
  isDummyFlow: boolean;
  effectiveClients: Client[];
  sortOrder: 'newest' | 'oldest';
  selectedClientIds: string[];
  sessionCounts: Record<string, number>;
  onSortChange: (order: 'newest' | 'oldest') => void;
  onClientChange: (clientIds: string[]) => void;
  onFilterReset: () => void;
  sessionCards: React.ReactNode;
  sessionChangeModal: React.ReactNode;
}

export const MobileSessionHistoryView: React.FC<
  MobileSessionHistoryViewProps
> = ({
  sessionId,
  effectiveClients,
  sortOrder,
  selectedClientIds,
  sessionCounts,
  onSortChange,
  onClientChange,
  onFilterReset,
  sessionCards,
  sessionChangeModal,
}) => {
  const [isClientFilterOpen, setIsClientFilterOpen] = React.useState(false);
  const [isSortOpen, setIsSortOpen] = React.useState(false);

  if (sessionId) {
    return (
      <div className="h-full">
        <Outlet />
        {sessionChangeModal}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="w-full flex-1 overflow-y-auto p-4 md:p-8">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <Button
              variant="solid"
              tone="surface"
              size="sm"
              className="w-full justify-between"
              iconRight={<ChevronDownIcon size={16} />}
              onClick={() => setIsClientFilterOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <UserIcon size={16} />
                {selectedClientIds.length === 0
                  ? '모든 클라이언트'
                  : selectedClientIds.length === 1
                    ? effectiveClients.find(
                        (c) => c.id === selectedClientIds[0]
                      )?.name || '모든 클라이언트'
                    : `${selectedClientIds.length}명 선택`}
              </span>
            </Button>
            <Modal
              open={isClientFilterOpen}
              onOpenChange={setIsClientFilterOpen}
              mobileVariant="fullScreen"
              hideCloseButton
              className="flex flex-col"
            >
              <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 px-4 py-3">
                <BackButton onClick={() => setIsClientFilterOpen(false)} />
                <p className="text-m font-medium text-grey-100">
                  클라이언트 선택하기
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <FilterMenu
                  sortOrder={sortOrder}
                  selectedClientIds={selectedClientIds}
                  clients={effectiveClients}
                  sessionCounts={sessionCounts}
                  onSortChange={onSortChange}
                  onClientChange={onClientChange}
                  onReset={onFilterReset}
                  initialView="client"
                  showCtaButton
                  onCtaClick={() => setIsClientFilterOpen(false)}
                />
              </div>
            </Modal>
          </div>

          <div className="flex-shrink-0">
            <Button
              variant="solid"
              tone="surface"
              size="sm"
              iconRight={<ChevronDownIcon size={16} />}
              onClick={() => setIsSortOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <SortDescIcon size={16} />
                {sortOrder === 'newest' ? '최신 날짜 순' : '오래된 날짜 순'}
              </span>
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
          </div>
        </div>

        <div className="mt-4 space-y-3">{sessionCards}</div>
      </div>

      {sessionChangeModal}
    </div>
  );
};
