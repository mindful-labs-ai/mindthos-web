import React from 'react';

import { SearchIcon } from '@/shared/icons';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Title } from '@/shared/ui/atoms/Title';

export interface ClientListViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClient: () => void;
  clientList: React.ReactNode;
  addClientModal: React.ReactNode;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  searchQuery,
  onSearchChange,
  onAddClient,
  clientList,
  addClientModal,
}) => {
  return (
    <>
      <div className="mx-auto w-full max-w-[1332px] px-16 py-[42px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Title as="h1" className="text-2xl font-bold">
            모든 클라이언트
          </Title>

          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="검색하기"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              prefix={<SearchIcon size={18} />}
              className="w-80"
            />

            <Button
              variant="solid"
              tone="primary"
              size="md"
              onClick={onAddClient}
            >
              클라이언트 추가하기
            </Button>
          </div>
        </div>

        {clientList}
      </div>

      {addClientModal}
    </>
  );
};
