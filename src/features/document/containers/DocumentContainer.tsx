import { useState } from 'react';

import { Plus } from 'lucide-react';

import { getDocumentEditorRoute } from '@/app/router/constants';
import { useDevice } from '@/shared/hooks/useDevice';
import { useNavigateWithUtm } from '@/shared/hooks/useNavigateWithUtm';
import {
  DEFAULT_DOCUMENTS,
  useDocumentStore,
  type MyDocumentKind,
} from '@/stores/documentStore';
import { useModalStore } from '@/stores/modalStore';

import {
  AddDocumentBottomSheet,
  AddDocumentMenu,
  AddDocumentPopover,
} from '../components/AddDocumentPopover';
import { DocumentCard } from '../components/DocumentCard';
import { MyDocumentCard } from '../components/MyDocumentCard';

/**
 * 문서 관리 메인 화면.
 * 기본 문서는 고정 목록, 내 문서는 zustand 스토어(세션 내 임시 백엔드)로 관리.
 * 추가는 커서 위치 팝오버에서 양식 종류 선택 → 제작 뷰(/documents/new)로
 * 이동해 저장 시 생성 (내 문서 상세 뷰는 제작 뷰 기반으로 후속 작업).
 */
export function DocumentContainer() {
  const { navigateWithUtm } = useNavigateWithUtm();
  const myDocuments = useDocumentStore((state) => state.myDocuments);
  const openModal = useModalStore((state) => state.openModal);
  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;

  // 팝오버를 띄울 커서 좌표 (null = 닫힘) — 하단 + 추가 카드용 (데스크탑)
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // 헤더 '내 문서 등록하기' 버튼 하단 드롭다운 (데스크탑)
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  // 모바일 등록 바텀시트 — 팝오버/드롭다운 공용 대체
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);

  const handleOpenAddPopover = (e: React.MouseEvent) => {
    if (isMobileView) {
      setIsAddSheetOpen(true);
      return;
    }
    setPopoverPosition({ x: e.clientX, y: e.clientY });
  };

  // 카드 목록 — 모바일은 카드가 화면 중앙에 스냅되는 가로 캐러셀(양옆 peek), 데스크탑은 랩 그리드
  const cardListClass = isMobileView
    ? '-mx-4 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide'
    : 'mt-5 flex flex-wrap gap-4';

  const handleSelectKind = (kind: MyDocumentKind) => {
    // 종류 선택 → 제작 뷰로 이동 (저장 시 내 문서 생성)
    navigateWithUtm(getDocumentEditorRoute(kind));
  };

  const handleSendDocuments = () => {
    openModal('sendDocument', { source: 'documents' });
  };

  // 내 문서 등록하기 — 데스크탑은 버튼 하단 드롭다운, 모바일은 바텀시트.
  // 데스크탑 상단 헤더 / 모바일 '내 문서' 제목 옆 두 위치에서 공용.
  const registerButton = (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        aria-expanded={isAddDropdownOpen}
        onClick={() =>
          isMobileView
            ? setIsAddSheetOpen(true)
            : setIsAddDropdownOpen((prev) => !prev)
        }
        className="h-9 rounded-lg border border-grey-40 bg-white px-4 text-m font-medium text-grey-100 transition-colors lg:h-[41px] lg:px-7 lg:hover:bg-grey-10"
      >
        내 문서 등록하기
      </button>
      {isAddDropdownOpen && (
        <AddDocumentMenu
          onSelect={handleSelectKind}
          onClose={() => setIsAddDropdownOpen(false)}
          className="absolute right-0 top-full mt-2"
        />
      )}
    </div>
  );

  // 문서 발송 — 데스크탑 상단 헤더 / 모바일 '마음토스 기본 문서' 제목 옆 공용.
  const sendButton = (
    <button
      type="button"
      onClick={handleSendDocuments}
      className="h-9 flex-shrink-0 rounded-lg bg-green-80 px-4 text-m font-emphasize text-white transition-opacity lg:h-[41px] lg:px-7 lg:hover:opacity-90"
    >
      문서 발송
    </button>
  );

  return (
    // max-w 1364 = 카드 4장(297×4) + gap(16×3) + 좌우 패딩(64×2) — 한 줄 4장 보장
    <div className="mx-auto w-full max-w-[1364px] px-4 py-6 md:px-10 lg:px-16 lg:py-[42px]">
      {/* 헤더: 타이틀 + 액션 버튼 — 모바일은 숨기고 버튼을 각 섹션 제목 옆으로 이동 */}
      {!isMobileView && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-headline text-grey-100">문서 관리</h1>
          <div className="flex items-center gap-3 lg:gap-5">
            {registerButton}
            {sendButton}
          </div>
        </div>
      )}

      {/* 마음토스 기본 문서 — 고정 목록 */}
      <section className="mt-0 lg:mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-headline text-grey-100">
            마음토스 기본 문서
          </h2>
          {isMobileView && sendButton}
        </div>
        <div className={cardListClass}>
          {DEFAULT_DOCUMENTS.map((document) => (
            <div key={document.id} className="snap-center">
              <DocumentCard document={document} />
            </div>
          ))}
        </div>
      </section>

      {/* 내 문서 — 팝오버로 추가 */}
      <section className="mt-12">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-headline text-grey-100">내 문서</h2>
          {isMobileView && registerButton}
        </div>
        <div className={cardListClass}>
          {myDocuments.map((document) => (
            <div key={document.id} className="snap-center">
              <MyDocumentCard document={document} />
            </div>
          ))}
          {/* 추가 카드 */}
          <button
            type="button"
            aria-label="내 문서 등록하기"
            onClick={handleOpenAddPopover}
            className="flex h-[182px] w-[297px] flex-shrink-0 snap-center items-center justify-center rounded-2xl border border-grey-40 bg-grey-20 text-grey-80 transition-colors lg:hover:bg-grey-30"
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
      <AddDocumentBottomSheet
        open={isAddSheetOpen}
        onClose={() => setIsAddSheetOpen(false)}
        onSelect={handleSelectKind}
      />
    </div>
  );
}

export default DocumentContainer;
