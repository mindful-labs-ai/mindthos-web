import React from 'react';

import { useNavigate } from 'react-router-dom';

import { ChevronDownIcon, SortDescIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui';
import { Badge } from '@/shared/ui/atoms/Badge';

import type { Client } from '../types';

export interface ClientDetailViewProps {
  client: Client;
  isDummyFlow: boolean;
  activeTab: 'history' | 'analyze';
  onTabChange: (tab: 'history' | 'analyze') => void;
  sessionRecordCount: number;
  onEditClientClick: () => void;
  sessionList: React.ReactNode;
  clientAnalysisTab: React.ReactNode;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
  editModal: React.ReactNode;
  analysisModal: React.ReactNode;
  isMobileView?: boolean;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  isDummyFlow,
  activeTab,
  onTabChange,
  sessionRecordCount,
  onEditClientClick,
  sessionList,
  clientAnalysisTab,
  sortOrder,
  onSortChange,
  editModal,
  analysisModal,
  isMobileView = false,
}) => {
  const navigate = useNavigate();
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);

  // 클라이언트 정보 내용 (공유)
  const clientInfoFields = (
    <>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">이름</p>
        <p className="text-sm text-grey-100">{client.name}</p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">휴대폰 번호</p>
        <p className="text-sm text-grey-100">{client.phone_number}</p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">이메일 주소</p>
        <p className="text-sm text-grey-100">{client.email || '-'}</p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">상담 주제</p>
        <p className="text-sm text-grey-100">{client.counsel_theme || '-'}</p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">회기 수</p>
        <p className="text-sm text-grey-100">
          {client.counsel_number || '-'}회기
        </p>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-grey-80">내담자 구성</p>
        <p className="text-sm text-grey-100">{client.memo || '-'}</p>
      </div>
    </>
  );

  // 탭 버튼 (공유)
  const tabButtons = (
    <div className={`flex justify-center gap-8 ${isMobileView ? '' : ''}`}>
      <button
        onClick={() => onTabChange('analyze')}
        className={`relative px-1 py-4 text-l font-medium transition-colors ${
          activeTab === 'analyze'
            ? 'text-grey-100'
            : 'text-grey-60 lg:hover:text-grey-80'
        }`}
      >
        클라이언트 분석
        <div
          className={`absolute bottom-2 right-0 h-0.5 bg-grey-100 transition-all ${activeTab === 'analyze' ? 'w-full' : 'w-0'}`}
        />
      </button>
      <button
        onClick={() => onTabChange('history')}
        className={`relative px-1 py-4 text-l font-medium transition-colors ${
          activeTab === 'history'
            ? 'text-grey-100'
            : 'text-grey-60 lg:hover:text-grey-80'
        }`}
      >
        상담 기록 및 정보
        <div
          className={`absolute bottom-2 left-0 h-0.5 bg-grey-100 transition-all ${activeTab === 'history' ? 'w-full' : 'w-0'}`}
        />
      </button>
    </div>
  );

  if (isMobileView) {
    return (
      <div className="flex h-dvh w-full flex-col bg-app-bg">
        {/* 자체 헤더 */}
        <div className="flex h-[67px] flex-shrink-0 items-center gap-3 border-b border-grey-30 bg-white px-4 py-3 md:gap-7">
          <BackButton onClick={() => navigate(-1)} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-m font-medium text-grey-100">
              {client.name}
            </span>
            <span className="flex-shrink-0 text-sm text-grey-60">
              총 {sessionRecordCount}개의 상담 기록
            </span>
          </div>
        </div>

        {/* 태블릿: 탭 고정 */}
        <div className="hidden flex-shrink-0 px-10 pt-10 md:block">
          {tabButtons}
        </div>

        {/* 콘텐츠 영역 */}
        <div
          className={`min-h-0 flex-1 ${activeTab === 'analyze' ? 'flex flex-col overflow-y-auto md:overflow-hidden' : 'overflow-y-auto'}`}
        >
          {/* 모바일: 탭이 스크롤에 포함 */}
          <div className="px-4 pt-5 md:hidden">{tabButtons}</div>

          {activeTab === 'history' ? (
            <div className="px-4 py-4 md:px-10 md:py-6">
              {/* 아코디언 클라이언트 정보 */}
              <div className="mb-6 rounded-xl border border-grey-30 bg-white">
                <button
                  type="button"
                  onClick={() => setIsInfoOpen(!isInfoOpen)}
                  className="flex w-full items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-grey-60">
                      클라이언트 정보
                    </span>
                    <ChevronDownIcon
                      size={16}
                      className={`text-grey-60 transition-transform ${isInfoOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClientClick();
                    }}
                    className="rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
                  >
                    편집
                  </button>
                </button>
                {isInfoOpen && (
                  <div className="grid grid-cols-2 gap-4 border-t border-grey-30 px-4 py-4">
                    {clientInfoFields}
                  </div>
                )}
              </div>

              {/* 세션 목록 */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-m font-emphasize text-grey-100 md:text-l">
                    상담 기록
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-grey-30 bg-white px-3 py-1.5 text-sm font-medium text-grey-70 transition-colors lg:hover:bg-grey-10"
                  >
                    <SortDescIcon size={16} />
                    {sortOrder === 'newest' ? '최신 날짜 순' : '오래된 날짜 순'}
                  </button>
                </div>
                {sessionList}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col py-4 md:min-h-0 md:overflow-hidden md:px-10 md:py-6">
              {clientAnalysisTab}
            </div>
          )}
        </div>

        {editModal}
        {analysisModal}
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[1332px] flex-col">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-16 pt-[42px]">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-end gap-3">
            <h1 className="text-2xl font-headline text-grey-100">
              {client.name}
            </h1>
            <span className="text-xl font-medium text-grey-60">
              총 {sessionRecordCount}개의 상담 기록
            </span>
            {isDummyFlow && (
              <Badge tone="warning" variant="soft" size="sm">
                예시
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex-shrink-0 px-12">{tabButtons}</div>

      {/* 컨텐츠 */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'history' ? (
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <div className="px-12 pt-4">
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() =>
                    onSortChange(sortOrder === 'newest' ? 'oldest' : 'newest')
                  }
                  className="flex items-center gap-1.5 px-1 py-1.5 text-sm font-medium text-grey-100 transition-colors lg:hover:opacity-80"
                >
                  <SortDescIcon size={16} />
                  {sortOrder === 'newest' ? '최신 날짜 순' : '오래된 날짜 순'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_400px] gap-6 px-12 pb-6">
              {/* 왼쪽: 세션 목록 */}
              <div className="min-w-0">{sessionList}</div>

              {/* 우측: 클라이언트 정보 */}
              <div className="sticky top-0 h-fit">
                <div className="rounded-lg border border-grey-30 bg-white p-6 text-left">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm text-grey-60">클라이언트 정보</h2>
                    <button
                      onClick={onEditClientClick}
                      className="rounded-md border border-grey-30 px-3 py-1 text-sm font-medium text-grey-80 transition-colors lg:hover:bg-grey-10"
                    >
                      편집
                    </button>
                  </div>
                  <div className="space-y-4">{clientInfoFields}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden px-12 py-6">
            {clientAnalysisTab}
          </div>
        )}
      </div>

      {editModal}
      {analysisModal}
    </div>
  );
};
