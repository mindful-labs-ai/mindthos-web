import React from 'react';

import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  getAiSupervisionRoute,
  getGenogramRoute,
  ROUTES,
} from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { ChevronDownIcon, SortDescIcon } from '@/shared/icons';
import { BackButton } from '@/shared/ui';
import { Badge } from '@/shared/ui/atoms/Badge';
import type { SentDocument } from '@/stores/sentDocumentStore';

import { ClientDocumentsTab } from '../components/documents/ClientDocumentsTab';
import { SentDocumentView } from '../components/documents/SentDocumentView';
import type { Client } from '../types';

export interface ClientDetailViewProps {
  client: Client;
  /** 데스크탑 좌측 내담자 사이드바 (모바일은 null) */
  sidebar?: React.ReactNode;
  isDummyFlow: boolean;
  sessionRecordCount: number;
  onEditClientClick: () => void;
  sessionList: React.ReactNode;
  sortOrder: 'newest' | 'oldest';
  onSortChange: (order: 'newest' | 'oldest') => void;
  editModal: React.ReactNode;
  isMobileView?: boolean;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  sidebar,
  isDummyFlow,
  sessionRecordCount,
  onEditClientClick,
  sessionList,
  sortOrder,
  onSortChange,
  editModal,
  isMobileView = false,
}) => {
  const navigate = useNavigate();
  const { navigateWithUtm } = useNavigateWithUtm();
  const [isInfoOpen, setIsInfoOpen] = React.useState(false);
  // 페이지 내 탭 — 문서 관리는 이동이 아니라 탭 전환 (데스크탑)
  const [activeTab, setActiveTab] = React.useState<'info' | 'documents'>(
    'info'
  );
  // 문서 관리 탭에서 열어본 발송 문서 (null = 목록)
  const [viewingSentDocument, setViewingSentDocument] =
    React.useState<SentDocument | null>(null);

  // 내담자 정보 필드 (모바일 아코디언 + 데스크탑 카드 공용 데이터)
  const infoFields = [
    { label: '이름', value: client.name },
    { label: '휴대폰 번호', value: client.phone_number },
    { label: '이메일 주소', value: client.email || '-' },
    { label: '상담 주제', value: client.counsel_theme || '-' },
    {
      label: '회기 수',
      value: client.counsel_number ? `${client.counsel_number}회기` : '-',
    },
    { label: '내담자 구성', value: client.memo || '-' },
  ];

  // 모바일 아코디언용 (기존 스타일 유지)
  const clientInfoFields = (
    <>
      {infoFields.map(({ label, value }) => (
        <div key={label}>
          <p className="mb-1 text-sm font-medium text-grey-80">{label}</p>
          <p className="text-sm text-grey-100">{value}</p>
        </div>
      ))}
    </>
  );

  // 우상단 도메인 버튼 — 내담자 정보/문서 관리는 페이지 내 탭, 나머지는 도메인 이동
  // (모바일은 문서 관리 탭 미지원 — 문서 관리 페이지로 이동)
  const domainLinks: {
    label: string;
    isActive?: boolean;
    onClick?: () => void;
  }[] = [
    {
      label: '내담자 정보',
      isActive: isMobileView || activeTab === 'info',
      onClick: isMobileView ? undefined : () => setActiveTab('info'),
    },
    {
      label: '문서 관리',
      isActive: !isMobileView && activeTab === 'documents',
      onClick: isMobileView
        ? () => navigateWithUtm(ROUTES.DOCUMENTS)
        : () => setActiveTab('documents'),
    },
    {
      label: '심리검사 해석',
      onClick: () =>
        navigateWithUtm(
          `${ROUTES.PSYCHOLOGY_ASSESSMENTS}?clientId=${client.id}`
        ),
    },
    {
      label: '가계도',
      onClick: () => navigateWithUtm(getGenogramRoute(client.id)),
    },
    {
      label: 'AI 슈퍼비전',
      onClick: () => navigateWithUtm(getAiSupervisionRoute(client.id)),
    },
  ];

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

        {/* 도메인 이동 버튼 (가로 스크롤) */}
        <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-b border-grey-30 bg-white px-4 py-2">
          {domainLinks.map(({ label, onClick, isActive }) => {
            return (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`flex h-9 flex-shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-[#D6D8E1] px-4 text-sm font-headline transition-colors ${
                  isActive
                    ? 'bg-white text-grey-100'
                    : 'bg-[#FAFBFF] text-[#BABCC7]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 콘텐츠 영역 */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-4 py-4 md:px-10 md:py-6">
            {/* 아코디언 내담자 정보 */}
            <div className="mb-6 rounded-xl border border-grey-30 bg-white">
              <button
                type="button"
                onClick={() => setIsInfoOpen(!isInfoOpen)}
                className="flex w-full items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-1">
                  <span className="text-sm text-grey-60">내담자 정보</span>
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
        </div>

        {editModal}
      </div>
    );
  }

  // 문서 관리 탭에서 발송 문서를 열면 헤더까지 문서 뷰로 전환
  if (viewingSentDocument) {
    return (
      <div className="flex h-full w-full">
        {sidebar}
        <div className="mx-auto h-full min-w-0 max-w-[1332px] flex-1 overflow-y-auto">
          <div className="px-16 pb-[42px] pt-[42px]">
            <SentDocumentView
              document={viewingSentDocument}
              onBack={() => setViewingSentDocument(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {sidebar}
      <div className="mx-auto flex h-full min-w-0 max-w-[1332px] flex-1 flex-col">
        {/* 헤더: 뒤로가기 + 내담자명 + 도메인 이동 버튼 */}
        <div className="flex-shrink-0 px-16 pt-[42px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-6">
              <button
                type="button"
                aria-label="내담자 목록으로"
                onClick={() => navigateWithUtm(ROUTES.CLIENTS)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#D6D8E1] bg-[#FAFBFF] text-[#9C9EA6] transition-colors lg:hover:bg-grey-20"
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="truncate text-2xl font-headline text-grey-100">
                {client.name}
              </h1>
              {isDummyFlow && (
                <Badge tone="warning" variant="soft" size="sm">
                  예시
                </Badge>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              {domainLinks.map(({ label, onClick, isActive }) => {
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={onClick}
                    className={`flex h-[42px] items-center justify-center rounded-lg border border-[#D6D8E1] px-[22px] text-m font-headline transition-colors ${
                      isActive
                        ? 'bg-white text-grey-100'
                        : 'bg-[#FAFBFF] text-[#BABCC7] lg:hover:text-grey-80'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto overflow-x-hidden">
            {activeTab === 'documents' ? (
              /* 문서 관리 탭 */
              <div className="px-16 pb-[42px] pt-8">
                <ClientDocumentsTab
                  client={client}
                  onOpenDocument={setViewingSentDocument}
                />
              </div>
            ) : (
              <div className="grid grid-cols-[1fr_377px] gap-6 px-16 pb-[42px] pt-8">
                {/* 왼쪽: 상담 기록 목록 */}
                <div className="min-w-0">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="truncate pl-3 text-xl font-headline text-grey-100 lg:pl-6">
                      총 {sessionRecordCount}개의 상담 기록
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        onSortChange(
                          sortOrder === 'newest' ? 'oldest' : 'newest'
                        )
                      }
                      className="flex items-center gap-2 truncate rounded-lg px-2.5 py-2 text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-20"
                    >
                      <SortDescIcon size={20} />
                      {sortOrder === 'newest'
                        ? '최신 날짜 순'
                        : '오래된 날짜 순'}
                    </button>
                  </div>
                  {sessionList}
                </div>

                {/* 우측: 클라이언트 정보 카드 */}
                <div className="sticky top-0 h-fit">
                  <div className="rounded-2xl border border-[#D6D8E1] bg-white p-6 text-left">
                    <div className="mb-6 flex items-center justify-between">
                      <h2 className="text-m font-medium text-[#9C9EA6]">
                        클라이언트 정보
                      </h2>
                      <button
                        onClick={onEditClientClick}
                        className="rounded-lg border border-[#EDEFF6] px-3.5 py-1.5 text-m font-medium text-[#9C9EA6] transition-colors lg:hover:bg-grey-10 lg:hover:text-grey-80"
                      >
                        편집
                      </button>
                    </div>
                    <div className="space-y-5">
                      {infoFields.map(({ label, value }) => (
                        <div key={label} className="space-y-2">
                          <p className="text-m font-emphasize text-grey-100">
                            {label}
                          </p>
                          <p className="break-all text-m text-grey-100">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {editModal}
      </div>
    </div>
  );
};
