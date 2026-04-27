import React from 'react';

import { Outlet } from 'react-router-dom';

import type { Client } from '@/features/client/types';
import { ChevronDownIcon, SortDescIcon, UserIcon } from '@/shared/icons';
import { Badge } from '@/shared/ui/atoms/Badge';
import { Button } from '@/shared/ui/atoms/Button';
import { Title } from '@/shared/ui/atoms/Title';
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
  return (
    <div className="flex h-full">
      {sideList}

      {!sessionId ? (
        <div className="mx-auto flex w-full max-w-[1332px] flex-1 flex-col p-16">
          <div className="flex-shrink-0 pb-6">
            <div className="flex items-center gap-2">
              <Title as="h1" className="typo-2xl text-start font-headline">
                상담 기록
              </Title>
              {isDummyFlow && (
                <Badge tone="warning" variant="soft" size="sm">
                  예시
                </Badge>
              )}
            </div>

            <div className="mt-6 flex justify-start gap-3">
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
                      ? '모든 내담자'
                      : selectedClientIds.length === 1
                        ? effectiveClients.find(
                            (c) => c.id === selectedClientIds[0]
                          )?.name || '모든 내담자'
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

              <PopUp
                trigger={
                  <Button
                    variant="solid"
                    tone="surface"
                    size="sm"
                    icon={<SortDescIcon size={16} />}
                    iconRight={<ChevronDownIcon size={16} />}
                  >
                    {sortOrder === 'newest' ? '최신 날짜 순' : '오래된 날짜 순'}
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
