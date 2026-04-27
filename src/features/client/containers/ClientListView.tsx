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
  isMobileView?: boolean;
}

export const ClientListView: React.FC<ClientListViewProps> = ({
  searchQuery,
  onSearchChange,
  onAddClient,
  clientList,
  addClientModal,
  isMobileView = false,
}) => {
  if (isMobileView) {
    return (
      <>
        <div className="w-full px-4 py-4 md:px-10 md:py-10">
          {/* 검색바 */}
          <Input
            type="text"
            placeholder="검색하기"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            prefix={<SearchIcon size={18} className="text-grey-60" />}
            className="w-full border-grey-30 bg-grey-10"
          />

          {/* 내담자 리스트 */}
          <div className="mt-6">{clientList}</div>
        </div>

        {addClientModal}
      </>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-[1332px] px-16 py-[42px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Title as="h1" className="text-2xl font-headline text-grey-100">
            모든 내담자
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
              내담자 추가하기
            </Button>
          </div>
        </div>

        {clientList}
      </div>

      {addClientModal}
    </>
  );
};
