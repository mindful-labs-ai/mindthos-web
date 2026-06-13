import { useEffect, useState } from 'react';

import { ChevronDown } from 'lucide-react';

import { useClientList } from '@/features/client/hooks/useClientList';
import type { Client } from '@/features/client/types';
import { useDevice } from '@/shared/hooks/useDevice';
import { UserIcon } from '@/shared/icons';
import { MobileModalHeader } from '@/shared/ui';
import { Modal } from '@/shared/ui/composites/Modal';
import { useAuthStore } from '@/stores/authStore';
import {
  DEFAULT_DOCUMENTS,
  useDocumentStore,
  type CounselDocument,
  type MyDocumentKind,
} from '@/stores/documentStore';
import { useSentDocumentStore } from '@/stores/sentDocumentStore';
import { ClientSelector } from '@/widgets/client/ClientSelector';

interface SendDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 내담자 탭 등에서 진입 시 초기 발송 대상 */
  initialClientId?: string;
}

/** 발송할 문서 — 내 문서/마음토스 양식 공용 표현 (발송 시 스냅샷용 kind/content 포함) */
interface SendTargetDocument {
  id: string;
  title: string;
  kind: MyDocumentKind;
  content: string | null;
}

/** 마음토스 기본 문서 → 발송 대상 표현 (윤리 동의류=consent, 문항류=qna) */
function toSendTarget(doc: CounselDocument): SendTargetDocument {
  return {
    id: doc.id,
    title: doc.title,
    kind: doc.category === 'ethics' ? 'consent' : 'qna',
    content: doc.content,
  };
}

const DEADLINE_OPTIONS = [
  { key: '3d', label: '3일' },
  { key: '1w', label: '1주일' },
  { key: '2w', label: '2주일' },
  { key: '1m', label: '1개월' },
  { key: 'none', label: '마감 기한 없음' },
] as const;

type DeadlineKey = (typeof DEADLINE_OPTIONS)[number]['key'];

/** 마감 기한 → "2026년 5월 30일까지" / 없음이면 "없음" */
function formatDeadline(key: DeadlineKey): string {
  if (key === 'none') return '없음';
  const date = new Date();
  if (key === '1m') date.setMonth(date.getMonth() + 1);
  else
    date.setDate(date.getDate() + (key === '3d' ? 3 : key === '1w' ? 7 : 14));
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일까지`;
}

/**
 * 문서 발송 모달 — 문서 관리 탭·내담자 탭 공용.
 * 발송 대상(내담자)·문서·마감 기한을 고르면 내용 미리보기(알림톡 목업)에
 * 실제 파라미터가 선반영된다. 실제 발송 API는 백엔드 연결 시 교체.
 */
export function SendDocumentModal({
  open,
  onOpenChange,
  initialClientId,
}: SendDocumentModalProps) {
  const { clients } = useClientList();
  const userName = useAuthStore((state) => state.userName);
  const myDocuments = useDocumentStore((state) => state.myDocuments);
  const addSentDocument = useSentDocumentStore(
    (state) => state.addSentDocument
  );
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedDocument, setSelectedDocument] =
    useState<SendTargetDocument | null>(null);
  const [deadline, setDeadline] = useState<DeadlineKey>('1w');

  // 드롭다운 열림 상태
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isDocumentOpen, setIsDocumentOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);

  // 열릴 때마다 초기화 — 초기 발송 대상/기본 문서/기본 기한
  useEffect(() => {
    if (!open) return;
    setSelectedClient(
      (initialClientId && clients.find((c) => c.id === initialClientId)) || null
    );
    setSelectedDocument(toSendTarget(DEFAULT_DOCUMENTS[0]));
    setDeadline('1w');
    // clients는 로딩 시점에 따라 갱신될 수 있어 open 시점 값만 사용
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialClientId]);

  const canSend = !!selectedClient && !!selectedDocument;

  const handleSend = () => {
    if (!selectedClient || !selectedDocument) return;
    // 임시 백엔드(sentDocumentStore)에 발송 기록 — 실제 발송 API는 백엔드 연결 시 교체
    addSentDocument({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      title: selectedDocument.title,
      kind: selectedDocument.kind,
      content: selectedDocument.content,
      deadlineLabel:
        DEADLINE_OPTIONS.find((o) => o.key === deadline)?.label ?? '',
    });
    onOpenChange(false);
  };

  const deadlineText = formatDeadline(deadline);
  const clientName = selectedClient?.name ?? '내담자';
  const documentTitle = selectedDocument?.title ?? '문서';

  // 문서 선택/마감 기한 목록 본문 — 데스크탑 드롭다운/모바일 바텀시트 공용
  const documentList = (
    <>
      {myDocuments.length > 0 && (
        <>
          <p className="px-2.5 py-1.5 text-sm font-medium text-grey-60">
            내 문서
          </p>
          {myDocuments.map((doc) => (
            <button
              key={doc.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setSelectedDocument({
                  id: doc.id,
                  title: doc.title,
                  kind: doc.kind,
                  content: doc.content,
                });
                setIsDocumentOpen(false);
              }}
              className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-20 ${
                doc.id === selectedDocument?.id ? 'bg-grey-20' : ''
              }`}
            >
              {doc.title}
            </button>
          ))}
        </>
      )}
      <p className="px-2.5 py-1.5 text-sm font-medium text-grey-60">
        마음토스 양식
      </p>
      {DEFAULT_DOCUMENTS.map((doc) => (
        <button
          key={doc.id}
          type="button"
          role="menuitem"
          onClick={() => {
            setSelectedDocument(toSendTarget(doc));
            setIsDocumentOpen(false);
          }}
          className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-20 ${
            doc.id === selectedDocument?.id ? 'bg-grey-20' : ''
          }`}
        >
          {doc.title}
        </button>
      ))}
    </>
  );

  const deadlineList = DEADLINE_OPTIONS.map((option) => (
    <button
      key={option.key}
      type="button"
      role="menuitem"
      onClick={() => {
        setDeadline(option.key);
        setIsDeadlineOpen(false);
      }}
      className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-20 ${
        option.key === deadline ? 'bg-grey-20' : ''
      }`}
    >
      {option.label}
    </button>
  ));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      // 모바일은 depth 있는 풀스크린 페이지(헤더 고정), 데스크탑은 648px 센터 모달
      mobileVariant="fullScreen"
      hideCloseButton={isMobileView}
      className="flex flex-col p-0 lg:block lg:max-h-[90vh] lg:w-[648px] lg:max-w-[648px] lg:rounded-2xl lg:px-10 lg:pb-10 lg:pt-10"
    >
      {/* 헤더 — 모바일은 MobileModalHeader, 데스크탑은 중앙 제목 */}
      {isMobileView ? (
        <MobileModalHeader
          title="문서 발송하기"
          onBack={() => onOpenChange(false)}
        />
      ) : (
        <h2 className="text-center text-xl font-emphasize leading-[29px] text-grey-100">
          문서 발송하기
        </h2>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-5 pb-8 pt-6 lg:mt-12 lg:overflow-visible lg:px-0 lg:pb-0 lg:pt-0">
        {/* 발송 대상 — client-selector로 변경 가능 */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-m font-emphasize text-grey-100">발송 대상</span>
          <ClientSelector
            clients={clients}
            selectedClient={selectedClient}
            onSelect={setSelectedClient}
            variant="dropdown"
            open={isClientOpen}
            onOpenChange={setIsClientOpen}
            placement="bottom-right"
            trigger={
              <span className="flex h-[34px] cursor-pointer items-center gap-3 rounded-lg border border-grey-30 bg-white px-2.5 transition-colors lg:hover:bg-grey-10">
                <UserIcon size={18} className="text-grey-60" />
                <span className="text-sm font-medium text-grey-100">
                  {selectedClient?.name ?? '내담자 선택'}
                </span>
              </span>
            }
          />
        </div>

        {/* 문서 선택 — 내 문서 / 마음토스 양식 그룹 드롭다운 */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-m font-emphasize text-grey-100">문서 선택</span>
          <div className="relative">
            <button
              type="button"
              aria-expanded={isDocumentOpen}
              onClick={() => setIsDocumentOpen((prev) => !prev)}
              className="flex h-[34px] items-center rounded-lg border border-grey-30 bg-white px-2.5 text-sm font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
            >
              {documentTitle}
            </button>
            {isMobileView ? (
              /* 모바일 — 바텀시트 */
              <Modal
                open={isDocumentOpen}
                onOpenChange={setIsDocumentOpen}
                mobileVariant="bottomSheet"
                hideCloseButton
              >
                <div className="max-h-[60dvh] overflow-y-auto pb-4">
                  {documentList}
                </div>
              </Modal>
            ) : (
              isDocumentOpen && (
                <>
                  <div
                    className="fixed inset-0 z-modal"
                    onClick={() => setIsDocumentOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-modal mt-2 max-h-[426px] w-[261px] overflow-y-auto rounded-lg border border-grey-30 bg-white p-2.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
                  >
                    {documentList}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* 마감 기한 드롭다운 */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-m font-emphasize text-grey-100">마감 기한</span>
          <div className="relative">
            <button
              type="button"
              aria-expanded={isDeadlineOpen}
              onClick={() => setIsDeadlineOpen((prev) => !prev)}
              className="flex h-[34px] items-center gap-2 rounded-lg border border-grey-30 bg-white px-2.5 text-sm font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
            >
              {DEADLINE_OPTIONS.find((o) => o.key === deadline)?.label}
              <ChevronDown size={16} className="text-grey-70" />
            </button>
            {isMobileView ? (
              /* 모바일 — 바텀시트 */
              <Modal
                open={isDeadlineOpen}
                onOpenChange={setIsDeadlineOpen}
                mobileVariant="bottomSheet"
                hideCloseButton
              >
                <div className="pb-4">
                  <p className="px-2.5 pb-2 text-m font-emphasize text-grey-100">
                    마감 기한
                  </p>
                  {deadlineList}
                </div>
              </Modal>
            ) : (
              isDeadlineOpen && (
                <>
                  <div
                    className="fixed inset-0 z-modal"
                    onClick={() => setIsDeadlineOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-modal mt-2 w-[205px] rounded-lg border border-grey-30 bg-white p-2.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
                  >
                    {deadlineList}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* 내용 미리보기 — 알림톡 목업에 실제 파라미터 선반영 */}
        <div>
          <p className="text-m font-emphasize text-grey-100">내용 미리보기</p>
          <div className="mt-3 rounded-lg border border-grey-40 bg-[#A5C2D3] px-6 py-6">
            {/* 톡 카드를 박스 중앙에, 아바타는 카드 왼쪽에 배치 */}
            <div className="relative mx-auto w-[286px]">
              <span className="absolute -left-[60px] top-0 hidden h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-grey-40 bg-grey-10 lg:flex">
                <img
                  src="/loading_logo.png"
                  alt="마음토스"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <div>
                <p className="text-sm font-medium text-grey-100">마음토스</p>
                <div className="mt-1.5 w-[286px] overflow-hidden rounded-[20px] border border-grey-40 bg-white">
                  <div className="flex h-[50px] items-center bg-[#FFE412] px-[18px] text-sm font-emphasize text-grey-100">
                    알림톡 도착
                  </div>
                  <div className="px-5 py-4 text-sm font-medium leading-[150%] text-grey-100">
                    <p>
                      {clientName}님, 마음토스 상담센터에서 서명 요청이
                      도착하였습니다. 내용을 확인하고 서명을 진행해주세요.
                    </p>
                    <p className="mt-4">
                      ▶ 담당자 : {userName ?? '담당'} 상담사
                      <br />▶ 문서 이름 : [{documentTitle}]
                      <br />▶ 기한 : {deadlineText}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mx-4 mb-4 h-[43px] w-[254px] cursor-default rounded-xl bg-[#FFE412] text-m font-emphasize text-grey-100"
                  >
                    문서 확인하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 발송 — 모바일은 하단 고정 풋터, 데스크탑은 본문 아래 중앙 버튼 */}
      <div className="flex-shrink-0 border-t border-border px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 lg:border-none lg:px-0 lg:pb-0 lg:pt-0">
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`mx-auto block h-[41px] w-full max-w-full rounded-lg text-m font-medium text-white transition-opacity lg:mt-10 lg:w-[396px] ${
            canSend
              ? 'bg-green-80 lg:hover:opacity-90'
              : 'cursor-not-allowed bg-grey-40'
          }`}
        >
          문서 발송하기
        </button>
      </div>
    </Modal>
  );
}
