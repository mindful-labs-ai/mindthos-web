import { useState } from 'react';

import { MoreVertical } from 'lucide-react';

import { getDocumentViewRoute } from '@/app/router/constants';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import { Modal } from '@/shared/ui/composites/Modal';
import { useToast } from '@/shared/ui/composites/Toast';
import { useDocumentStore, type MyDocument } from '@/stores/documentStore';

import {
  MY_DOCUMENT_KIND_LABEL,
  myDocumentStatusChip,
} from '../constants/myDocument';

interface MyDocumentCardProps {
  document: MyDocument;
}

/** "2026-5-30 등록" 형태 (월·일 패딩 없음) */
function formatRegisteredDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} 등록`;
}

/**
 * 내 문서 카드 — 제목 + 양식 종류 desc + 등록일 (297x182).
 * 기본 문서 카드(카테고리 칩)와 구성이 달라 별도 컴포넌트.
 * 본문 클릭 시 문서 뷰(읽기 전용) 페이지로 이동, 케밥(⋯) 메뉴로 삭제.
 */
export function MyDocumentCard({ document }: MyDocumentCardProps) {
  const { navigateWithUtm } = useNavigateWithUtm();
  const { toast } = useToast();
  const removeMyDocument = useDocumentStore((state) => state.removeMyDocument);
  // 케밥 드롭다운 열림 / 삭제 확인 모달 열림
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  // 발송 가능(완료) / 발송 불가(편집 중) 상태 칩 — validation(content 유효성) 파생
  const statusChip = myDocumentStatusChip(document);

  const handleDelete = () => {
    setIsConfirmOpen(false);
    removeMyDocument(document.id).catch(() => {
      toast({
        title: '문서 삭제 실패',
        description: '잠시 후 다시 시도해 주세요.',
      });
    });
  };

  return (
    <div className="relative h-[182px] w-[297px] flex-shrink-0 rounded-2xl border border-grey-40 bg-white transition-colors lg:hover:bg-grey-10">
      <button
        type="button"
        onClick={() => navigateWithUtm(getDocumentViewRoute(document.id))}
        className="flex h-full w-full flex-col px-7 py-6 text-left"
      >
        <h3 className="truncate pr-6 text-l font-headline leading-[24px] text-grey-100">
          {document.title}
        </h3>
        <p className="mt-3 text-m font-medium leading-[140%] text-grey-100">
          {MY_DOCUMENT_KIND_LABEL[document.kind]}
        </p>
        <p className="absolute bottom-5 left-7 text-m font-medium leading-[140%] text-grey-60">
          {formatRegisteredDate(document.createdAt)}
        </p>
      </button>

      {/* 상태 칩 — 완료(발송 가능) / 편집 중(발송 불가) */}
      <span
        className={`pointer-events-none absolute bottom-[18px] right-6 rounded-lg px-2.5 py-1 text-sm font-headline ${statusChip.className}`}
      >
        {statusChip.label}
      </span>

      {/* 케밥 메뉴 — 삭제하기 */}
      <div className="absolute right-3 top-4">
        <button
          type="button"
          aria-label="문서 메뉴"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-6 w-6 items-center justify-center rounded text-grey-70 transition-colors lg:hover:bg-grey-20"
        >
          <MoreVertical size={16} />
        </button>
        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-modal"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              role="menu"
              className="absolute right-0 top-full z-modal mt-1 w-[140px] rounded-lg border border-grey-30 bg-white p-1.5 shadow-[0px_4px_24px_rgba(0,0,0,0.1)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsConfirmOpen(true);
                }}
                className="flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm font-medium text-red-80 transition-colors lg:hover:bg-grey-20"
              >
                삭제하기
              </button>
            </div>
          </>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        className="lg:w-[400px] lg:max-w-[400px]"
      >
        <div className="flex flex-col items-center py-2 text-center">
          <h2 className="text-l font-headline text-grey-100">
            문서를 삭제할까요?
          </h2>
          <p className="mt-3 text-m font-medium leading-[150%] text-grey-70">
            삭제한 문서는 다시 되돌릴 수 없어요.
          </p>
          <div className="mt-7 flex w-full gap-3">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              className="h-[44px] flex-1 rounded-lg border border-grey-40 bg-white text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-[44px] flex-1 rounded-lg bg-red-80 text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
            >
              삭제하기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
