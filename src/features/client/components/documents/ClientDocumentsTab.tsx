import { useMemo, useState } from 'react';

import { MoreVertical } from 'lucide-react';

import { useModalStore } from '@/stores/modalStore';
import {
  SENT_DOCUMENT_STATUS_LABEL,
  useSentDocumentStore,
  type SentDocument,
  type SentDocumentStatus,
} from '@/stores/sentDocumentStore';

import type { Client } from '../../types';

interface ClientDocumentsTabProps {
  client: Client;
  /** 발송 문서 클릭 → 탭 내부 문서 뷰로 전환 */
  onOpenDocument: (document: SentDocument) => void;
}

type StatusFilter = 'all' | SentDocumentStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'completed', label: '완료' },
  { key: 'pending', label: '대기 중' },
  { key: 'canceled', label: '취소' },
];

/** 상태 칩 색상 */
const STATUS_CHIP_CLASS: Record<SentDocumentStatus, string> = {
  pending: 'bg-yellow-20 text-yellow-80',
  completed: 'bg-green-20 text-green-80',
  canceled: 'bg-grey-20 text-grey-80',
};

/** "2026.5.20(수)" 형식 */
export function formatSentDate(iso: string): string {
  const date = new Date(iso);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}(${weekday})`;
}

/** 발송/완료/취소 이력 한 줄 — "2026.5.20(수) 발송됨 | 2026.5.22(금) 완료" */
export function formatSentHistory(document: SentDocument): string {
  const parts = [`${formatSentDate(document.sentAt)} 발송됨`];
  if (document.status === 'completed' && document.completedAt) {
    parts.push(`${formatSentDate(document.completedAt)} 완료`);
  }
  if (document.status === 'canceled' && document.canceledAt) {
    parts.push(`${formatSentDate(document.canceledAt)} 취소됨`);
  }
  return parts.join('  |  ');
}

/**
 * 내담자 상세 — 문서 관리 탭.
 * 해당 내담자에게 발송한 문서를 상태 필터와 함께 보여주고,
 * 문서 발송 버튼은 공용 발송 모달(발송 대상 선반영)을 연다.
 */
export function ClientDocumentsTab({
  client,
  onOpenDocument,
}: ClientDocumentsTabProps) {
  const openModal = useModalStore((state) => state.openModal);
  // 셀렉터에서 filter로 새 배열을 만들면 매 렌더 무한 루프 — 원본 구독 후 useMemo로 필터
  const allSentDocuments = useSentDocumentStore((state) => state.sentDocuments);
  const sentDocuments = useMemo(
    () => allSentDocuments.filter((d) => d.clientId === client.id),
    [allSentDocuments, client.id]
  );
  const cancelSentDocument = useSentDocumentStore(
    (state) => state.cancelSentDocument
  );
  const removeSentDocument = useSentDocumentStore(
    (state) => state.removeSentDocument
  );

  const [filter, setFilter] = useState<StatusFilter>('all');
  // 열려 있는 카드 케밥 메뉴의 문서 id (null = 닫힘)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const countOf = (key: StatusFilter) =>
    key === 'all'
      ? sentDocuments.length
      : sentDocuments.filter((d) => d.status === key).length;

  const filtered =
    filter === 'all'
      ? sentDocuments
      : sentDocuments.filter((d) => d.status === filter);

  const handleOpenSendModal = () => {
    openModal('sendDocument', {
      source: 'client_documents',
      clientId: client.id,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 상태 필터 + 문서 발송 */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-grey-40 bg-white p-5">
        <div className="flex items-center gap-2">
          {STATUS_FILTERS.map(({ key, label }) => {
            const isActive = key === filter;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-m font-emphasize transition-colors ${
                  isActive
                    ? 'bg-grey-30 text-grey-100'
                    : 'bg-white text-grey-70 lg:hover:bg-grey-10'
                }`}
              >
                {label}
                <span
                  className={`font-headline ${isActive ? 'text-grey-80' : 'text-grey-70'}`}
                >
                  {countOf(key)}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleOpenSendModal}
          className="h-9 w-[163px] flex-shrink-0 rounded-lg bg-green-80 text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
        >
          문서 발송
        </button>
      </div>

      {sentDocuments.length === 0 ? (
        /* 빈 상태 */
        <div className="mx-auto mt-20 w-full max-w-[512px] rounded-2xl bg-white px-8 py-12 text-center">
          <p className="text-l font-emphasize text-grey-100">
            아직 보낸 문서가 없어요
          </p>
          <p className="mt-4 text-m font-medium leading-[150%] text-grey-70">
            내담자에게 필요한 문서를
            <br />
            마음토스에 간편하게 보내보세요.
          </p>
          <button
            type="button"
            onClick={handleOpenSendModal}
            className="mt-10 h-[35px] rounded-lg border border-grey-40 bg-white px-[19px] text-m font-headline text-grey-100 transition-colors lg:hover:bg-grey-10"
          >
            문서 발송하기
          </button>
        </div>
      ) : (
        /* 발송 문서 목록 */
        <div className="flex flex-col gap-4">
          {filtered.map((document) => (
            <div
              key={document.id}
              className="relative rounded-2xl border border-grey-40 bg-white px-7 py-6"
            >
              <button
                type="button"
                onClick={() => onOpenDocument(document)}
                className="block w-full text-left"
              >
                <span className="flex items-center gap-3">
                  <span className="text-l font-headline text-grey-100">
                    {document.title}
                  </span>
                  <span
                    className={`flex h-[29px] items-center rounded-lg px-2.5 text-sm font-headline ${STATUS_CHIP_CLASS[document.status]}`}
                  >
                    {SENT_DOCUMENT_STATUS_LABEL[document.status]}
                  </span>
                </span>
                <span className="mt-3 block text-sm text-grey-70">
                  {formatSentHistory(document)}
                </span>
              </button>

              {/* 완료 문서 — 서명본 확인 */}
              {document.status === 'completed' && (
                <button
                  type="button"
                  onClick={() => onOpenDocument(document)}
                  className="absolute bottom-5 right-5 h-[29px] rounded-lg border border-green-80 bg-green-20 px-2.5 text-sm font-headline text-green-80 transition-opacity lg:hover:opacity-80"
                >
                  문서 확인하기
                </button>
              )}

              {/* 케밥 메뉴 */}
              <div className="absolute right-4 top-[19px]">
                <button
                  type="button"
                  aria-label="문서 메뉴"
                  onClick={() =>
                    setOpenMenuId((prev) =>
                      prev === document.id ? null : document.id
                    )
                  }
                  className="flex h-6 w-6 items-center justify-center rounded text-grey-70 transition-colors lg:hover:bg-grey-10"
                >
                  <MoreVertical size={16} />
                </button>
                {openMenuId === document.id && (
                  <>
                    <div
                      className="fixed inset-0 z-modal"
                      onClick={() => setOpenMenuId(null)}
                      aria-hidden="true"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full z-modal mt-1 w-[140px] rounded-lg border border-grey-30 bg-white p-1.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
                    >
                      {document.status === 'pending' ? (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            cancelSentDocument(document.id);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium text-grey-100 transition-colors lg:hover:bg-grey-20"
                        >
                          발송 취소
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            removeSentDocument(document.id);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium text-grey-100 transition-colors lg:hover:bg-grey-20"
                        >
                          내역 삭제
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
