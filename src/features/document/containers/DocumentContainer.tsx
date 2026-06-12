import { useState } from 'react';

import { Plus } from 'lucide-react';

import {
  DEFAULT_DOCUMENTS,
  useDocumentStore,
  type MyDocumentKind,
} from '@/stores/documentStore';
import { useModalStore } from '@/stores/modalStore';

import { AddDocumentPopover } from '../components/AddDocumentPopover';
import { DocumentCard } from '../components/DocumentCard';
import { MyDocumentCard } from '../components/MyDocumentCard';
import { MY_DOCUMENT_DEFAULT_TITLE } from '../constants/myDocument';

/**
 * 문서 관리 메인 화면.
 * 기본 문서는 고정 목록, 내 문서는 zustand 스토어(세션 내 임시 백엔드)로 관리.
 * 추가는 커서 위치 팝오버에서 양식 종류 선택 → 즉시 생성
 * (생성 전 상태 전이 플로우·내부 상세는 후속 작업).
 */
export function DocumentContainer() {
  const myDocuments = useDocumentStore((state) => state.myDocuments);
  const addMyDocument = useDocumentStore((state) => state.addMyDocument);
  const openModal = useModalStore((state) => state.openModal);

  // 팝오버를 띄울 커서 좌표 (null = 닫힘)
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleOpenAddPopover = (e: React.MouseEvent) => {
    setPopoverPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSelectKind = (kind: MyDocumentKind) => {
    // 지금은 선택 즉시 기본 제목으로 생성 — 생성 플로우는 후속 단계에서 교체
    addMyDocument({ title: MY_DOCUMENT_DEFAULT_TITLE[kind], kind });
  };

  const handleSendDocuments = () => {
    // 문서 발송 플로우는 후속 작업
    openModal('comingSoon', { source: 'documents_send' });
  };

  return (
    // max-w 1364 = 카드 4장(297×4) + gap(16×3) + 좌우 패딩(64×2) — 한 줄 4장 보장
    <div className="mx-auto w-full max-w-[1364px] px-4 py-6 md:px-10 lg:px-16 lg:py-[42px]">
      {/* 헤더: 타이틀 + 액션 버튼 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-headline text-grey-100">문서 관리</h1>
        <div className="flex items-center gap-3 lg:gap-5">
          <button
            type="button"
            onClick={handleOpenAddPopover}
            className="h-[41px] rounded-lg border border-[#D6D8E1] bg-white px-7 text-m font-medium text-grey-100 transition-colors lg:hover:bg-grey-10"
          >
            내 문서 등록하기
          </button>
          <button
            type="button"
            onClick={handleSendDocuments}
            className="h-[41px] rounded-lg bg-green-80 px-7 text-m font-emphasize text-white transition-opacity lg:hover:opacity-90"
          >
            문서 발송
          </button>
        </div>
      </div>

      {/* 마음토스 기본 문서 — 고정 목록 */}
      <section className="mt-10">
        <h2 className="text-xl font-headline text-grey-100">
          마음토스 기본 문서
        </h2>
        <div className="mt-5 flex flex-wrap gap-4">
          {DEFAULT_DOCUMENTS.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      </section>

      {/* 내 문서 — 팝오버로 추가 */}
      <section className="mt-12">
        <h2 className="text-xl font-headline text-grey-100">내 문서</h2>
        <div className="mt-5 flex flex-wrap gap-4">
          {myDocuments.map((document) => (
            <MyDocumentCard key={document.id} document={document} />
          ))}
          {/* 추가 카드 */}
          <button
            type="button"
            aria-label="내 문서 등록하기"
            onClick={handleOpenAddPopover}
            className="flex h-[182px] w-[297px] flex-shrink-0 items-center justify-center rounded-2xl border border-[#D6D8E1] bg-[#F4F5FA] text-[#747479] transition-colors lg:hover:bg-grey-30"
          >
            <Plus size={22} />
          </button>
        </div>
      </section>

      <AddDocumentPopover
        position={popoverPosition}
        onClose={() => setPopoverPosition(null)}
        onSelect={handleSelectKind}
      />
    </div>
  );
}

export default DocumentContainer;
